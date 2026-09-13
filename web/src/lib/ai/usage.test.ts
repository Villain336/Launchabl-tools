import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { readAccountToolBreadth, readContextReuseStats, recordUsage } from "./usage";

const baseEvent = { model: "openai/gpt-5-mini", inputTokens: 100, outputTokens: 50, ok: true };

describe("recordUsage — account tool breadth", () => {
  it("tracks distinct tools run by an account across multiple calls", async () => {
    const store = createMemoryStore();
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: "u1" }, store);
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: "u1" }, store);
    await recordUsage({ ...baseEvent, slug: "schema-generator", uid: "u1" }, store);
    const stats = await readAccountToolBreadth(store);
    expect(stats.accountsWithUsage).toBe(1);
    expect(stats.avgDistinctTools).toBe(2);
    expect(stats.multiToolRate).toBe(1);
    expect(stats.distinctToolsHistogram["2-3"]).toBe(1);
  });

  it("doesn't count anonymous runs (no uid) toward account breadth", async () => {
    const store = createMemoryStore();
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: null }, store);
    const stats = await readAccountToolBreadth(store);
    expect(stats.accountsWithUsage).toBe(0);
  });

  it("buckets accounts by distinct tool count", async () => {
    const store = createMemoryStore();
    // u1: 1 tool
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: "u1" }, store);
    // u2: 5 tools
    for (const slug of ["a", "b", "c", "d", "e"]) {
      await recordUsage({ ...baseEvent, slug, uid: "u2" }, store);
    }
    const stats = await readAccountToolBreadth(store);
    expect(stats.accountsWithUsage).toBe(2);
    expect(stats.distinctToolsHistogram["1"]).toBe(1);
    expect(stats.distinctToolsHistogram["4-9"]).toBe(1);
    expect(stats.multiToolRate).toBe(0.5);
  });
});

describe("recordUsage — project context reuse", () => {
  it("counts signed-in runs with vs without saved project context", async () => {
    const store = createMemoryStore();
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: "u1", hasProjectContext: true }, store);
    await recordUsage({ ...baseEvent, slug: "schema-generator", uid: "u1", hasProjectContext: true }, store);
    await recordUsage({ ...baseEvent, slug: "meta-tag-generator", uid: "u1", hasProjectContext: false }, store);
    const stats = await readContextReuseStats(30, store);
    expect(stats.withProject).toBe(2);
    expect(stats.withoutProject).toBe(1);
    expect(stats.reuseRate).toBeCloseTo(2 / 3);
  });

  it("ignores anonymous runs entirely (no uid means no context field is written)", async () => {
    const store = createMemoryStore();
    await recordUsage({ ...baseEvent, slug: "brand-creator", uid: null, hasProjectContext: false }, store);
    const stats = await readContextReuseStats(30, store);
    expect(stats.withProject).toBe(0);
    expect(stats.withoutProject).toBe(0);
    expect(stats.reuseRate).toBe(0);
  });

  it("returns a reuseRate of 0 when there's no signed-in usage yet", async () => {
    const store = createMemoryStore();
    const stats = await readContextReuseStats(30, store);
    expect(stats.reuseRate).toBe(0);
  });
});
