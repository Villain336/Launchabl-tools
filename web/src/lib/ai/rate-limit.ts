/**
 * Rate limiting for AI routes, backed by the shared key-value store so limits
 * hold across serverless instances when Redis is attached.
 *
 * Fixed windows via INCR + EXPIRE — one round trip, no per-client arrays —
 * which is what keeps it cheap on a free tool. Two tiers: a short burst
 * window and a daily cap that bounds worst-case gateway spend per client.
 */

import { createMemoryStore, getStore, type KeyValueStore } from "@/lib/ai/store";

export type RateLimitDecision = {
  ok: boolean;
  remaining: number;
  /** Seconds until a slot frees up (0 when `ok`). */
  retryAfter: number;
  /** Which tier rejected the request, when `ok` is false. */
  tier?: string;
};

export type RateLimitTier = { name: string; limit: number; windowSeconds: number };

export type RateLimiter = {
  check(key: string, now?: number): Promise<RateLimitDecision>;
};

export function createRateLimiter(tiers: RateLimitTier[], store: KeyValueStore = createMemoryStore()): RateLimiter {
  return {
    async check(key, now = Date.now()) {
      let remaining = Number.POSITIVE_INFINITY;
      for (const tier of tiers) {
        const windowMs = tier.windowSeconds * 1000;
        const bucket = Math.floor(now / windowMs);
        const count = await store.incr(`rl:${tier.name}:${key}:${bucket}`, tier.windowSeconds + 1);
        if (count > tier.limit) {
          const retryAfter = Math.max(1, Math.ceil(((bucket + 1) * windowMs - now) / 1000));
          return { ok: false, remaining: 0, retryAfter, tier: tier.name };
        }
        remaining = Math.min(remaining, tier.limit - count);
      }
      return { ok: true, remaining: Number.isFinite(remaining) ? remaining : 0, retryAfter: 0 };
    },
  };
}

/** Best-effort client identity for anonymous tool usage. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "anonymous";
}

export const CHAT_LIMITS: RateLimitTier[] = [
  { name: "burst", limit: 20, windowSeconds: 10 * 60 },
  { name: "daily", limit: 120, windowSeconds: 24 * 60 * 60 },
];

declare global {
  var __launchablChatLimiter: RateLimiter | undefined;
}

/** Shared limiter for all chat-style tools: 20 messages / 10 min and 120 / day per client. */
export function chatRateLimiter(): RateLimiter {
  globalThis.__launchablChatLimiter ??= createRateLimiter(CHAT_LIMITS, getStore());
  return globalThis.__launchablChatLimiter;
}

export function describeRetry(decision: RateLimitDecision): string {
  if (decision.tier === "daily") return "You've used today's free allowance for this tool. It resets at midnight UTC.";
  const minutes = Math.ceil(decision.retryAfter / 60);
  return `You've hit the free usage limit for this tool. Try again in about ${minutes} min.`;
}
