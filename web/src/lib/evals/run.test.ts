import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { EVAL_CASES } from "./cases";
import { listEvalRuns, loadLatestEvalRun, saveEvalRun, summarise, type EvalResult, type EvalRun } from "./run";

const result = (id: string, patch: Partial<EvalResult> = {}): EvalResult => ({
  id,
  slug: EVAL_CASES.find((c) => c.id === id)!.slug,
  model: "m",
  ok: true,
  passed: true,
  error: null,
  toolsCalled: [],
  missingTools: [],
  score: 90,
  verdict: "ship",
  issues: [],
  steps: 2,
  durationMs: 1000,
  inputTokens: 10,
  outputTokens: 10,
  reply: "",
  ...patch,
});

const run = (id: string, results: EvalResult[]): EvalRun => ({ id, startedAt: "2026-09-12T00:00:00Z", finishedAt: "2026-09-12T00:01:00Z", results, summary: summarise(results) });

describe("eval runs", () => {
  it("cases are well-formed and unique", () => {
    expect(new Set(EVAL_CASES.map((c) => c.id)).size).toBe(EVAL_CASES.length);
    for (const c of EVAL_CASES) expect(c.expectTools.length).toBeGreaterThan(0);
  });

  it("summarises pass rate, average and tool hit rate", () => {
    const s = summarise([result("utm-launch"), result("dns-stripe", { passed: false, score: 60, missingTools: ["checkDnsEmail"] }), result("qr-review-link", { ok: false, passed: false, score: null, error: "boom" })]);
    expect(s).toEqual({ cases: 3, passed: 1, avgScore: 75, toolHitRate: 2 / 3, errors: 1 });
  });

  it("latest merges per case across partial runs and keeps a bounded history", async () => {
    const store = createMemoryStore();
    await saveEvalRun(run("ev_1", [result("utm-launch", { score: 70, passed: false }), result("dns-stripe")]), store);
    await saveEvalRun(run("ev_2", [result("utm-launch", { score: 95 })]), store);
    const latest = await loadLatestEvalRun(store);
    expect(latest?.results.map((r) => [r.id, r.score])).toEqual([["dns-stripe", 90], ["utm-launch", 95]]);
    expect(latest?.summary.passed).toBe(2);
    const runs = await listEvalRuns(store);
    expect(runs.map((r) => r.id)).toEqual(["ev_2", "ev_1"]);
  });
});
