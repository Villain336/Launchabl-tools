import { describe, expect, it } from "vitest";
import { classifyAiError, userFacingAiMessage } from "@/lib/ai/errors";
import { modelChain, modelLabel } from "@/lib/ai/models";
import { createRateLimiter } from "@/lib/ai/rate-limit";
import { createMemoryStore } from "@/lib/ai/store";
import { checkDailySpend, dailySpendCapUsd, estimateCostUsd, readUsage, recordUpsell, recordTemplatePick, recordUsage, sumBuckets, sumUpsell } from "@/lib/ai/usage";
import { getChatTool, listChatTools } from "@/lib/ai/chat-tools";
import { getChatToolRuntime, listChatToolRuntimes } from "@/lib/ai/chat-runtime";
import { tools } from "@/lib/site-config";

describe("modelChain", () => {
  it("returns the default chain when no override is set", () => {
    expect(modelChain("writer", {})[0]).toBe("anthropic/claude-sonnet-4.6");
    expect(modelChain("fast", {})).toContain("meta/llama-4-scout");
  });

  it("honours comma-separated env overrides and drops junk", () => {
    expect(modelChain("writer", { AI_MODEL_WRITER: " openai/gpt-5.4, nonsense ,meta/llama-4-scout,openai/gpt-5.4 " })).toEqual([
      "openai/gpt-5.4",
      "meta/llama-4-scout",
    ]);
  });

  it("labels slugs for humans", () => {
    expect(modelLabel("anthropic/claude-sonnet-4.6")).toBe("Claude Sonnet 4.6");
    expect(modelLabel("openai/gpt-5-mini")).toBe("GPT 5 Mini");
  });
});

describe("classifyAiError", () => {
  it("maps gateway statuses to causes", () => {
    expect(classifyAiError({ statusCode: 403, message: "Free tier users do not have access" }).cause).toBe("no_access");
    expect(classifyAiError({ name: "GatewayRateLimitError", message: "slow down" }).cause).toBe("rate_limited");
    expect(classifyAiError({ statusCode: 404, message: "model not found" }).cause).toBe("not_found");
    expect(classifyAiError({ statusCode: 401, message: "nope" })).toMatchObject({ cause: "unauthorized", fallback: false });
    expect(classifyAiError({ statusCode: 400, message: "bad" })).toMatchObject({ cause: "bad_request", fallback: true });
    expect(classifyAiError(new Error("fetch failed")).cause).toBe("upstream");
  });

  it("never leaks provider text to users", () => {
    const message = userFacingAiMessage(classifyAiError({ statusCode: 403, message: "secret-internal-detail" }));
    expect(message).not.toContain("secret-internal-detail");
  });
});

describe("createRateLimiter", () => {
  it("allows `limit` hits per window then blocks with a retry hint", async () => {
    let clock = 0;
    const limiter = createRateLimiter([{ name: "burst", limit: 2, windowSeconds: 10 }], createMemoryStore(() => clock));
    expect((await limiter.check("a", 0)).ok).toBe(true);
    clock = 1_000;
    expect((await limiter.check("a", 1_000)).ok).toBe(true);
    clock = 2_000;
    const blocked = await limiter.check("a", 2_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(8);
    expect(blocked.tier).toBe("burst");
    expect((await limiter.check("b", 2_000)).ok).toBe(true);
    clock = 10_001;
    expect((await limiter.check("a", 10_001)).ok).toBe(true);
  });

  it("applies the stricter of several tiers", async () => {
    const limiter = createRateLimiter(
      [
        { name: "burst", limit: 5, windowSeconds: 60 },
        { name: "daily", limit: 2, windowSeconds: 86_400 },
      ],
      createMemoryStore(() => 0),
    );
    await limiter.check("a", 0);
    await limiter.check("a", 0);
    const blocked = await limiter.check("a", 0);
    expect(blocked.ok).toBe(false);
    expect(blocked.tier).toBe("daily");
  });
});

describe("usage accounting", () => {
  it("records per-day totals by tool and model and reads them back", async () => {
    const store = createMemoryStore(() => 0);
    const date = new Date("2026-09-11T10:00:00Z");
    await recordUsage({ slug: "qr", model: "anthropic/claude-sonnet-4.6", inputTokens: 1_000, outputTokens: 500, ok: true, durationMs: 1_200 }, store, date);
    await recordUsage({ slug: "meta", model: "openai/gpt-5.4", inputTokens: 2_000, outputTokens: 100, reportedCostUsd: 0.01, ok: false, durationMs: 800 }, store, date);
    const [today] = await readUsage(1, store, date);
    expect(today.day).toBe("2026-09-11");
    expect(today.total.requests).toBe(2);
    expect(today.total.inputTokens).toBe(3_000);
    expect(today.total.errors).toBe(1);
    expect(today.total.avgDurationMs).toBe(1_000);
    expect(today.estimatedRequests).toBe(1);
    expect(today.byTool.qr.costUsd).toBeCloseTo(estimateCostUsd("anthropic/claude-sonnet-4.6", 1_000, 500), 6);
    expect(today.byModel["openai/gpt-5.4"].costUsd).toBeCloseTo(0.01, 6);
    expect(sumBuckets([today.total, today.total]).requests).toBe(4);
  });

  it("attributes runs to the agent template that started them", async () => {
    const store = createMemoryStore(() => 0);
    const date = new Date("2026-09-11T10:00:00Z");
    await recordUsage({ slug: "agent", model: "x", inputTokens: 100, outputTokens: 50, reportedCostUsd: 0.02, ok: true, template: "launch-page" }, store, date);
    await recordUsage({ slug: "agent", model: "x", inputTokens: 100, outputTokens: 50, reportedCostUsd: 0.03, ok: true, template: "launch-page" }, store, date);
    await recordUsage({ slug: "agent", model: "x", inputTokens: 100, outputTokens: 50, reportedCostUsd: 0.01, ok: true, template: null }, store, date);
    const [today] = await readUsage(1, store, date);
    expect(today.total.requests).toBe(3);
    expect(Object.keys(today.byTemplate)).toEqual(["launch-page"]);
    expect(today.byTemplate["launch-page"].requests).toBe(2);
    expect(today.byTemplate["launch-page"].costUsd).toBeCloseTo(0.05, 6);
  });

  it("counts template card picks separately from runs", async () => {
    const store = createMemoryStore(() => 0);
    const date = new Date("2026-09-11T10:00:00Z");
    await recordTemplatePick("launch-page", store, date);
    await recordTemplatePick("launch-page", store, date);
    await recordTemplatePick("fix-email", store, date);
    await recordUsage({ slug: "agent", model: "x", inputTokens: 1, outputTokens: 1, reportedCostUsd: 0, ok: true, template: "launch-page" }, store, date);
    const [today] = await readUsage(1, store, date);
    expect(today.templatePicks).toEqual({ "launch-page": 2, "fix-email": 1 });
    expect(Object.keys(today.byTemplate)).toEqual(["launch-page"]);
    expect(today.byTemplate["launch-page"].requests).toBe(1);
    expect(today.total.requests).toBe(1);
  });

  it("counts upsell impressions, clicks and dismissals per tool without touching request totals", async () => {
    const store = createMemoryStore(() => 0);
    const date = new Date("2026-09-11T10:00:00Z");
    await recordUpsell({ slug: "website-audit-report", kind: "view" }, store, date);
    await recordUpsell({ slug: "website-audit-report", kind: "view" }, store, date);
    await recordUpsell({ slug: "website-audit-report", kind: "click" }, store, date);
    await recordUpsell({ slug: "link-checker", kind: "dismiss" }, store, date);
    const [today] = await readUsage(1, store, date);
    expect(today.total.requests).toBe(0);
    expect(today.upsell).toEqual({ views: 2, clicks: 1, dismissals: 1 });
    expect(today.upsellByTool["website-audit-report"]).toEqual({ views: 2, clicks: 1, dismissals: 0 });
    expect(today.upsellByTool["link-checker"]).toEqual({ views: 0, clicks: 0, dismissals: 1 });
    expect(sumUpsell([today.upsell, today.upsell]).clicks).toBe(2);
  });

  it("enforces the daily spend cap and resets at midnight UTC", async () => {
    const store = createMemoryStore(() => 0);
    const now = new Date("2026-09-11T22:00:00Z");
    expect((await checkDailySpend(store, now, 1)).ok).toBe(true);
    await recordUsage({ slug: "qr", model: "x", inputTokens: 0, outputTokens: 0, reportedCostUsd: 0.6, ok: true }, store, now);
    const under = await checkDailySpend(store, now, 1);
    expect(under.ok).toBe(true);
    expect(under.spentUsd).toBeCloseTo(0.6, 6);
    expect(under.resetsInSeconds).toBe(2 * 60 * 60);
    await recordUsage({ slug: "qr", model: "x", inputTokens: 0, outputTokens: 0, reportedCostUsd: 0.5, ok: true }, store, now);
    expect((await checkDailySpend(store, now, 1)).ok).toBe(false);
    expect((await checkDailySpend(store, new Date("2026-09-12T00:01:00Z"), 1)).ok).toBe(true);
    expect(dailySpendCapUsd({ DAILY_SPEND_CAP_USD: "40" })).toBe(40);
    expect(dailySpendCapUsd({ DAILY_SPEND_CAP_USD: "nope" })).toBe(25);
  });
});

describe("chat tool registry", () => {
  it("has matching client metadata and server runtime for every chat tool", () => {
    // The agent is built from the specialist runtimes, so it has client metadata but isn't in the specialist list.
    const metaSlugs = listChatTools().map((m) => m.slug).filter((slug) => slug !== "agent").sort();
    const runtimeSlugs = listChatToolRuntimes().map((r) => r.slug).sort();
    expect(metaSlugs).toEqual(runtimeSlugs);
    expect(getChatToolRuntime("agent")).toBeDefined();
  });

  it("registers every chat tool in the public tool list", () => {
    for (const meta of listChatTools()) {
      if (meta.slug !== "agent") expect(tools.find((t) => t.slug === meta.slug), meta.slug).toBeDefined();
      expect(meta.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(meta.intro.length).toBeGreaterThan(20);
    }
  });

  it("gives every runtime real instructions and a known model tier", () => {
    for (const runtime of listChatToolRuntimes()) {
      expect(runtime.instructions.length).toBeGreaterThan(200);
      expect(["writer", "fast"]).toContain(runtime.modelKind);
    }
    expect(getChatTool("ab-copy-variants")?.artifacts).toContain("deliverVariants");
    expect(Object.keys(getChatToolRuntime("ab-copy-variants")?.tools ?? {})).toEqual(["deliverVariants"]);
  });
});
