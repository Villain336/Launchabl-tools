import { Output, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { modelChain } from "@/lib/ai/models";
import { generateWithFallback } from "@/lib/ai/stream";
import { recordUsage } from "@/lib/ai/usage";

/**
 * reviewDeliverables — the agent's self-check. Reads every deliverable
 * produced so far in the conversation (from the tool results), asks a
 * separate judge model to score each against the brief, and returns the
 * fixes that must happen before the work is handed over. The agent then
 * revises anything under threshold instead of shipping a first draft.
 */

export const REVIEW_PASS = 80;
const MAX_DELIVERABLES = 8;
const MAX_CHARS_PER_DELIVERABLE = 6_000;
const INTERNAL_TOOLS = new Set(["fetchPage", "readTranscript", "loadSkillGuide", "reviewDeliverables"]);

export const reviewSchema = z.object({
  brief: z.string().min(10).max(1_500).describe("The user's job in one or two sentences: what they asked for, for whom, and any constraints they stated."),
  focus: z.string().max(300).optional().describe("Anything the user specifically cared about (tone, length, a claim to avoid, a platform)."),
});

const judgeSchema = z.object({
  checks: z
    .array(
      z.object({
        deliverable: z.string().describe("The tool name of the deliverable being scored."),
        score: z.number().min(0).max(100).describe("How well it serves the brief: 90+ ship as-is, 70–89 minor polish, below 70 needs rework."),
        strengths: z.string().max(300),
        issue: z.string().max(400).nullable().describe("The single most important problem, concretely, or null."),
        fix: z.string().max(400).nullable().describe("What to change to fix it, specific enough to act on, or null."),
      }),
    )
    .min(1),
  gaps: z.array(z.string().max(300)).max(5).describe("Parts of the brief nothing delivered covers."),
  overall: z.number().min(0).max(100),
  verdict: z.enum(["ship", "revise"]),
});

export type ReviewResult = z.infer<typeof judgeSchema> & {
  brief: string;
  reviewed: number;
  model: string;
  passMark: number;
  mustFix: string[];
};

type Deliverable = { tool: string; toolCallId: string; output: unknown };

/** Pull successful deliverable outputs out of the model-message history, oldest first. */
export function collectDeliverables(messages: ModelMessage[]): Deliverable[] {
  const out: Deliverable[] = [];
  for (const message of messages) {
    if (message.role !== "tool" || !Array.isArray(message.content)) continue;
    for (const part of message.content) {
      if (part.type !== "tool-result") continue;
      if (INTERNAL_TOOLS.has(part.toolName)) continue;
      const raw = part.output as { type?: string; value?: unknown } | unknown;
      const value = raw && typeof raw === "object" && "type" in (raw as object) && "value" in (raw as object) ? (raw as { type: string; value: unknown }) : null;
      if (value && (value.type === "error-text" || value.type === "error-json")) continue;
      const output = value ? value.value : raw;
      if (output === null || output === undefined) continue;
      out.push({ tool: part.toolName, toolCallId: part.toolCallId, output });
    }
  }
  // Newest deliverables matter most when there are too many.
  return out.slice(-MAX_DELIVERABLES);
}

function describe(deliverable: Deliverable): string {
  const text = typeof deliverable.output === "string" ? deliverable.output : JSON.stringify(deliverable.output);
  const clipped = text.length > MAX_CHARS_PER_DELIVERABLE ? `${text.slice(0, MAX_CHARS_PER_DELIVERABLE)}… [truncated]` : text;
  return `### ${deliverable.tool}\n${clipped}`;
}

export const JUDGE_INSTRUCTIONS = `You are a demanding creative director and technical reviewer at a top agency. You score deliverables produced for a client brief. Be specific and honest; generic praise is useless. Penalise: not answering the brief, placeholder text, claims that can't be true from the inputs, wrong audience or tone, missing required elements, too long for the platform, repetition. Reward: specificity, correct facts from the inputs, ready-to-ship polish. Never rewrite the deliverable — only judge it and say what to change.`;

export async function judgeDeliverables(input: z.infer<typeof reviewSchema>, deliverables: Deliverable[], slug: string): Promise<ReviewResult> {
  const chain = modelChain("fast");
  const startedAt = Date.now();
  const messages: ModelMessage[] = [
    {
      role: "user",
      content: [
        `Brief: ${input.brief}`,
        input.focus ? `The user specifically cares about: ${input.focus}` : null,
        "",
        `Deliverables (${deliverables.length}):`,
        ...deliverables.map(describe),
      ]
        .filter((line) => line !== null)
        .join("\n\n"),
    },
  ];
  const { model, result } = await generateWithFallback(chain, {
    instructions: JUDGE_INSTRUCTIONS,
    messages,
    output: Output.object({ schema: judgeSchema }),
    temperature: 0.2,
    maxOutputTokens: 1_500,
    providerOptions: { gateway: { tags: ["launchabl", `tool:${slug}`, "judge"] } },
  });
  void recordUsage({ slug, model, inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0, durationMs: Date.now() - startedAt, ok: true });
  const judged = result.output;
  const mustFix = judged.checks.filter((c) => c.score < REVIEW_PASS && c.fix).map((c) => `${c.deliverable}: ${c.fix}`);
  for (const gap of judged.gaps) mustFix.push(`Missing: ${gap}`);
  return { ...judged, brief: input.brief, reviewed: deliverables.length, model, passMark: REVIEW_PASS, mustFix };
}

export const reviewDeliverablesTool = tool({
  description:
    "Quality check before handing over: a separate reviewer scores every deliverable produced so far against the brief and lists what must change. Call once, after the deliverable tools, on any job with two or more deliverables or where the user asked for a specific outcome. Then fix what it flags (re-run the relevant deliverable tool) before your closing reply.",
  inputSchema: reviewSchema,
  execute: async (input, { messages }): Promise<ReviewResult> => {
    const deliverables = collectDeliverables(messages);
    if (deliverables.length === 0) throw new Error("Nothing to review yet — produce the deliverables first.");
    return judgeDeliverables(input, deliverables, "agent");
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value:
      `Review: ${output.verdict.toUpperCase()} (${output.overall}/100, pass mark ${output.passMark}). ` +
      output.checks.map((c) => `${c.deliverable} ${c.score}${c.issue ? ` — ${c.issue}` : ""}`).join("; ") +
      (output.mustFix.length ? ` Must fix: ${output.mustFix.join(" | ")}` : " Nothing blocking."),
  }),
});
