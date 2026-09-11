/**
 * Sliding-window rate limiter for AI routes.
 *
 * In-memory on purpose: it protects the gateway budget from a single abusive
 * client per server instance and costs nothing. When sessions land, the same
 * interface can be backed by Redis/Postgres without changing call sites.
 */

export type RateLimitDecision = {
  ok: boolean;
  remaining: number;
  /** Seconds until a slot frees up (0 when `ok`). */
  retryAfter: number;
};

export type RateLimiter = {
  check(key: string, now?: number): RateLimitDecision;
  reset(): void;
};

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const hits = new Map<string, number[]>();
  let sweeps = 0;

  function prune(now: number) {
    for (const [key, stamps] of hits) {
      const live = stamps.filter((t) => now - t < windowMs);
      if (live.length === 0) hits.delete(key);
      else hits.set(key, live);
    }
  }

  return {
    check(key, now = Date.now()) {
      if (++sweeps % 200 === 0) prune(now);
      const live = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (live.length >= limit) {
        hits.set(key, live);
        const retryAfter = Math.max(1, Math.ceil((live[0] + windowMs - now) / 1000));
        return { ok: false, remaining: 0, retryAfter };
      }
      live.push(now);
      hits.set(key, live);
      return { ok: true, remaining: limit - live.length, retryAfter: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}

/** Best-effort client identity for anonymous tool usage. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "anonymous";
}

declare global {
  var __launchablChatLimiter: RateLimiter | undefined;
}

/** Shared limiter for all chat-style tools: 20 messages per 10 minutes per client. */
export function chatRateLimiter(): RateLimiter {
  // Survive HMR in dev; a module-level const would reset on every reload.
  globalThis.__launchablChatLimiter ??= createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });
  return globalThis.__launchablChatLimiter;
}
