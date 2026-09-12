import { isStepCount, type ModelMessage, type ToolSet } from "ai";
import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import { modelChain } from "@/lib/ai/models";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { generateWithFallback } from "@/lib/ai/stream";
import { judgeDeliverables, REVIEW_PASS } from "@/lib/ai/tools/review";
import { EVAL_CASES, findEvalCase, type EvalCase } from "@/lib/evals/cases";

/**
 * Eval harness. Runs golden briefs through the real runtimes (same
 * instructions, tools and model chains as production, minus streaming),
 * then has the reviewer model score the deliverables against the case's
 * rubric. A case passes when the expected tools ran, nothing errored and
 * the score clears the review pass mark. Runs are stored so the admin
 * dashboard can show the trend and the worst cases.
 */

export type EvalResult = {
  id: string;
  slug: string;
  model: string | null;
  ok: boolean;
  passed: boolean;
  error: string | null;
  toolsCalled: string[];
  missingTools: string[];
  score: number | null;
  verdict: "ship" | "revise" | null;
  issues: string[];
  steps: number;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
  reply: string;
};

export type EvalRun = {
  id: string;
  startedAt: string;
  finishedAt: string;
  results: EvalResult[];
  summary: { cases: number; passed: number; avgScore: number | null; toolHitRate: number; errors: number };
};

const LATEST_KEY = "evals:latest";
const RUNS_KEY = "evals:runs";
const RUN_TTL_SECONDS = 90 * 24 * 60 * 60;
const KEEP_RUNS = 12;

type StepLike = {
  toolCalls: Array<{ toolName: string; toolCallId: string }>;
  toolResults: Array<{ toolName: string; toolCallId: string; output: unknown }>;
};

function toolsHit(called: string[], expected: string[]): string[] {
  const have = new Set(called);
  return expected.filter((entry) => !entry.split("|").some((name) => have.has(name)));
}

export async function runEvalCase(evalCase: EvalCase): Promise<EvalResult> {
  const startedAt = Date.now();
  const base: Omit<EvalResult, "ok" | "passed"> = {
    id: evalCase.id,
    slug: evalCase.slug,
    model: null,
    error: null,
    toolsCalled: [],
    missingTools: evalCase.expectTools,
    score: null,
    verdict: null,
    issues: [],
    steps: 0,
    durationMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    reply: "",
  };
  const runtime = getChatToolRuntime(evalCase.slug);
  if (!runtime) return { ...base, ok: false, passed: false, error: `No runtime for ${evalCase.slug}` };

  try {
    const messages: ModelMessage[] = [{ role: "user", content: evalCase.prompt }];
    const { model, result } = await generateWithFallback(modelChain(runtime.modelKind), {
      instructions: `${runtime.instructions}\n\nToday is ${new Date().toISOString().slice(0, 10)}.`,
      messages,
      tools: runtime.tools as ToolSet,
      stopWhen: isStepCount(runtime.maxSteps ?? 3),
      prepareStep: runtime.prepareStep,
      providerOptions: { gateway: { tags: ["launchabl", `tool:${evalCase.slug}`, "eval"] } },
    });
    const steps = result.steps as unknown as StepLike[];
    const toolsCalled = steps.flatMap((step) => step.toolCalls.map((call) => call.toolName));
    const missingTools = toolsHit(toolsCalled, evalCase.expectTools);
    const deliverables = steps.flatMap((step) =>
      step.toolResults
        .filter((r) => !["fetchPage", "readTranscript", "loadSkillGuide", "reviewDeliverables"].includes(r.toolName))
        .map((r) => ({ tool: r.toolName, toolCallId: r.toolCallId, output: r.output })),
    );

    let score: number | null = null;
    let verdict: EvalResult["verdict"] = null;
    let issues: string[] = [];
    if (deliverables.length > 0) {
      const judged = await judgeDeliverables({ brief: evalCase.prompt.slice(0, 1_500), focus: evalCase.rubric.slice(0, 300) }, deliverables, evalCase.slug);
      score = judged.overall;
      verdict = judged.verdict;
      issues = judged.mustFix.slice(0, 6);
    } else {
      issues = ["No deliverable produced."];
    }

    const passed = missingTools.length === 0 && score !== null && score >= REVIEW_PASS;
    return {
      ...base,
      ok: true,
      passed,
      model,
      toolsCalled: Array.from(new Set(toolsCalled)),
      missingTools,
      score,
      verdict,
      issues,
      steps: steps.length,
      durationMs: Date.now() - startedAt,
      inputTokens: result.totalUsage.inputTokens ?? 0,
      outputTokens: result.totalUsage.outputTokens ?? 0,
      reply: result.text.slice(0, 600),
    };
  } catch (error) {
    return { ...base, ok: false, passed: false, error: error instanceof Error ? error.message.slice(0, 300) : String(error), durationMs: Date.now() - startedAt };
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = next++;
      if (index >= items.length) return;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

export function summarise(results: EvalResult[]): EvalRun["summary"] {
  const scored = results.filter((r) => r.score !== null);
  const expected = results.reduce((n, r) => n + findEvalCase(r.id)!.expectTools.length, 0);
  const hit = results.reduce((n, r) => n + (findEvalCase(r.id)!.expectTools.length - r.missingTools.length), 0);
  return {
    cases: results.length,
    passed: results.filter((r) => r.passed).length,
    avgScore: scored.length ? Math.round(scored.reduce((n, r) => n + (r.score ?? 0), 0) / scored.length) : null,
    toolHitRate: expected ? hit / expected : 0,
    errors: results.filter((r) => !r.ok).length,
  };
}

export async function runEvals(ids?: string[], options: { concurrency?: number; store?: KeyValueStore } = {}): Promise<EvalRun> {
  const cases = ids?.length ? EVAL_CASES.filter((c) => ids.includes(c.id)) : EVAL_CASES;
  const startedAt = new Date().toISOString();
  const results = await mapLimit(cases, options.concurrency ?? 3, runEvalCase);
  const run: EvalRun = { id: `ev_${Date.now().toString(36)}`, startedAt, finishedAt: new Date().toISOString(), results, summary: summarise(results) };
  await saveEvalRun(run, options.store ?? getStore());
  return run;
}

export async function saveEvalRun(run: EvalRun, store: KeyValueStore = getStore()): Promise<void> {
  const json = JSON.stringify(run);
  await store.set(`evals:run:${run.id}`, json, RUN_TTL_SECONDS);
  // Latest merges per-case: a partial run of two cases shouldn't wipe the others' results.
  const previous = await loadLatestEvalRun(store);
  const merged = new Map<string, EvalResult>((previous?.results ?? []).map((r) => [r.id, r]));
  for (const result of run.results) merged.set(result.id, result);
  const results = EVAL_CASES.map((c) => merged.get(c.id)).filter((r): r is EvalResult => Boolean(r));
  await store.set(LATEST_KEY, JSON.stringify({ ...run, results, summary: summarise(results) } satisfies EvalRun), RUN_TTL_SECONDS);
  await store.sadd(RUNS_KEY, run.id);
  const ids = (await store.smembers(RUNS_KEY)).sort();
  for (const stale of ids.slice(0, Math.max(0, ids.length - KEEP_RUNS))) {
    await store.srem(RUNS_KEY, stale);
    await store.del(`evals:run:${stale}`);
  }
}

export async function loadLatestEvalRun(store: KeyValueStore = getStore()): Promise<EvalRun | null> {
  const raw = await store.get(LATEST_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EvalRun;
  } catch {
    return null;
  }
}

export async function listEvalRuns(store: KeyValueStore = getStore()): Promise<Array<Pick<EvalRun, "id" | "startedAt" | "summary">>> {
  const ids = (await store.smembers(RUNS_KEY)).sort().reverse();
  const runs = await Promise.all(ids.map((id) => store.get(`evals:run:${id}`)));
  return runs
    .map((raw) => {
      try {
        return raw ? (JSON.parse(raw) as EvalRun) : null;
      } catch {
        return null;
      }
    })
    .filter((run): run is EvalRun => Boolean(run))
    .map(({ id, startedAt, summary }) => ({ id, startedAt, summary }));
}
