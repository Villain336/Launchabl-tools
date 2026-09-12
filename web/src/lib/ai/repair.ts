import { asSchema, generateText, InvalidToolInputError, Output, type ToolCallRepairFunction, type ToolSet } from "ai";
import { modelChain } from "@/lib/ai/models";

/**
 * Tool-call repair. Deliverable schemas carry tight limits (a 80-char
 * `bestTime`, twelve competitors, a 600-char summary) so artifacts render
 * well. Models overrun them now and then, and without repair one over-long
 * field aborts the whole job. Two passes:
 *
 * 1. Structural — trim over-long strings and arrays and drop unknown keys,
 *    straight from the validator's issue list. Free and deterministic.
 * 2. Model — if that isn't enough (missing fields, wrong enum), a fast model
 *    rewrites the input to fit the schema, keeping the content.
 */

type Issue = { code?: string; origin?: string; maximum?: number; path?: Array<string | number>; keys?: string[] };

function issuesOf(error: unknown): Issue[] {
  let cursor: unknown = error;
  for (let depth = 0; depth < 4 && cursor && typeof cursor === "object"; depth += 1) {
    const issues = (cursor as { issues?: unknown }).issues;
    if (Array.isArray(issues)) return issues as Issue[];
    cursor = (cursor as { cause?: unknown }).cause;
  }
  return [];
}

function getAt(root: unknown, path: Array<string | number>): unknown {
  let node = root;
  for (const key of path) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string | number, unknown>)[key];
  }
  return node;
}

function setAt(root: unknown, path: Array<string | number>, value: unknown): void {
  if (path.length === 0) return;
  const parent = getAt(root, path.slice(0, -1));
  if (parent === null || typeof parent !== "object") return;
  (parent as Record<string | number, unknown>)[path[path.length - 1]] = value;
}

/** Cut at the last word boundary before `max`, adding an ellipsis only when there is room. */
export function trimString(value: string, max: number): string {
  if (value.length <= max) return value;
  const hard = value.slice(0, max);
  const boundary = hard.lastIndexOf(" ");
  const cut = boundary > max * 0.6 ? hard.slice(0, boundary) : hard;
  return cut.replace(/[\s,;:—–-]+$/, "");
}

/** Apply every deterministic fix the issue list allows; returns whether anything changed. */
export function applyStructuralFixes(input: unknown, issues: Issue[]): boolean {
  let changed = false;
  for (const issue of issues) {
    const path = issue.path ?? [];
    if (issue.code === "too_big" && typeof issue.maximum === "number") {
      const current = getAt(input, path);
      if (issue.origin === "string" && typeof current === "string") {
        setAt(input, path, trimString(current, issue.maximum));
        changed = true;
      } else if (issue.origin === "array" && Array.isArray(current)) {
        setAt(input, path, current.slice(0, issue.maximum));
        changed = true;
      }
    } else if (issue.code === "unrecognized_keys" && Array.isArray(issue.keys)) {
      const target = getAt(input, path);
      if (target && typeof target === "object") {
        for (const key of issue.keys) delete (target as Record<string, unknown>)[key];
        changed = true;
      }
    }
  }
  return changed;
}

const REPAIR_INSTRUCTIONS =
  "You fix a tool call whose arguments failed schema validation. Return the same arguments, corrected to satisfy the schema exactly: shorten text that is too long (keep the meaning), fill required fields from context, fix enum values, remove unknown keys. Never invent facts that aren't in the original arguments.";

export const repairToolCall: ToolCallRepairFunction<ToolSet> = async ({ toolCall, tools, error }) => {
  if (!InvalidToolInputError.isInstance(error)) return null;
  const definition = tools[toolCall.toolName];
  if (!definition?.inputSchema) return null;

  let input: unknown;
  try {
    input = JSON.parse(toolCall.input);
  } catch {
    return null;
  }

  const schema = asSchema(definition.inputSchema);
  const validate = async (candidate: unknown) => {
    const outcome = await schema.validate?.(candidate);
    return outcome?.success === true ? { ok: true as const } : { ok: false as const, error: outcome?.error };
  };

  // Pass 1 — structural, up to three rounds because trimming one field can
  // expose an issue the validator stopped short of reporting.
  let issues = issuesOf(error);
  for (let round = 0; round < 3 && issues.length > 0; round += 1) {
    if (!applyStructuralFixes(input, issues)) break;
    const check = await validate(input);
    if (check.ok) {
      console.info(`[repair] ${toolCall.toolName}: trimmed ${issues.length} field(s) to fit the schema`);
      return { ...toolCall, input: JSON.stringify(input) };
    }
    issues = issuesOf(check.error);
  }

  // Pass 2 — a fast model rewrites the arguments to fit. Providers differ in
  // which JSON-schema features they accept for structured output, so walk the
  // chain rather than trusting the first model.
  const prompt = [
    `Tool: ${toolCall.toolName}`,
    `Validation errors: ${JSON.stringify(issues.length ? issues : issuesOf(error)).slice(0, 4_000)}`,
    `Arguments:\n${JSON.stringify(input).slice(0, 40_000)}`,
  ].join("\n\n");
  const failures: string[] = [];
  for (const model of modelChain("fast")) {
    try {
      const result = await generateText({
        model,
        instructions: REPAIR_INSTRUCTIONS,
        messages: [{ role: "user", content: prompt }],
        output: Output.object({ schema: definition.inputSchema }),
        temperature: 0,
        maxRetries: 0,
        providerOptions: { gateway: { tags: ["launchabl", "repair"] } },
      });
      const check = await validate(result.output);
      if (!check.ok) {
        failures.push(`${String(model)}: output still invalid`);
        continue;
      }
      console.info(`[repair] ${toolCall.toolName}: rewritten by ${String(model)}`);
      return { ...toolCall, input: JSON.stringify(result.output) };
    } catch (cause) {
      failures.push(`${String(model)}: ${cause instanceof Error ? cause.message.slice(0, 120) : String(cause)}`);
    }
  }
  console.warn(`[repair] ${toolCall.toolName}: could not repair —`, failures.join("; "));
  return null;
};
