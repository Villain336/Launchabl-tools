import { describe, expect, it } from "vitest";
import { classifyAiError, userFacingAiMessage } from "@/lib/ai/errors";
import { modelChain, modelLabel } from "@/lib/ai/models";
import { createRateLimiter } from "@/lib/ai/rate-limit";
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
    expect(classifyAiError({ statusCode: 400, message: "bad" }).fallback).toBe(false);
    expect(classifyAiError(new Error("fetch failed")).cause).toBe("upstream");
  });

  it("never leaks provider text to users", () => {
    const message = userFacingAiMessage(classifyAiError({ statusCode: 403, message: "secret-internal-detail" }));
    expect(message).not.toContain("secret-internal-detail");
  });
});

describe("createRateLimiter", () => {
  it("allows `limit` hits per window then blocks with a retry hint", () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000 });
    expect(limiter.check("a", 0).ok).toBe(true);
    expect(limiter.check("a", 1_000).ok).toBe(true);
    const blocked = limiter.check("a", 2_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(8);
    expect(limiter.check("b", 2_000).ok).toBe(true);
    expect(limiter.check("a", 10_001).ok).toBe(true);
  });
});

describe("chat tool registry", () => {
  it("has matching client metadata and server runtime for every chat tool", () => {
    const metaSlugs = listChatTools().map((m) => m.slug).sort();
    const runtimeSlugs = listChatToolRuntimes().map((r) => r.slug).sort();
    expect(metaSlugs).toEqual(runtimeSlugs);
  });

  it("registers every chat tool in the public tool list", () => {
    for (const meta of listChatTools()) {
      expect(tools.find((t) => t.slug === meta.slug), meta.slug).toBeDefined();
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
