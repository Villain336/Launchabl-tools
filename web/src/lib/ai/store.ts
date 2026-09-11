/**
 * Minimal key-value store used by rate limiting and usage accounting.
 *
 * Backed by Upstash Redis / Vercel KV over REST when the standard env vars
 * are present (no SDK dependency, works on the edge), and by process memory
 * otherwise. Memory is fine for local dev and previews; production should
 * attach a Redis so limits and usage are shared across instances.
 */

export type KeyValueStore = {
  kind: "memory" | "redis";
  /** Increment a counter, setting `ttlSeconds` only when the key is new. Returns the new value. */
  incr(key: string, ttlSeconds?: number): Promise<number>;
  /** Increment many hash fields at once. */
  hincrby(key: string, fields: Record<string, number>, ttlSeconds?: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, number>>;
  sadd(key: string, member: string, ttlSeconds?: number): Promise<void>;
  smembers(key: string): Promise<string[]>;
};

type Entry<T> = { value: T; expiresAt: number | null };

export function createMemoryStore(now: () => number = Date.now): KeyValueStore {
  const counters = new Map<string, Entry<number>>();
  const hashes = new Map<string, Entry<Map<string, number>>>();
  const sets = new Map<string, Entry<Set<string>>>();

  function live<T>(map: Map<string, Entry<T>>, key: string): Entry<T> | undefined {
    const entry = map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= now()) {
      map.delete(key);
      return undefined;
    }
    return entry;
  }
  const expiry = (ttl?: number) => (ttl ? now() + ttl * 1000 : null);

  return {
    kind: "memory",
    async incr(key, ttl) {
      const entry = live(counters, key);
      if (!entry) {
        counters.set(key, { value: 1, expiresAt: expiry(ttl) });
        return 1;
      }
      entry.value += 1;
      return entry.value;
    },
    async hincrby(key, fields, ttl) {
      let entry = live(hashes, key);
      if (!entry) {
        entry = { value: new Map(), expiresAt: expiry(ttl) };
        hashes.set(key, entry);
      }
      for (const [field, delta] of Object.entries(fields)) entry.value.set(field, (entry.value.get(field) ?? 0) + delta);
    },
    async hgetall(key) {
      const entry = live(hashes, key);
      return entry ? Object.fromEntries(entry.value) : {};
    },
    async sadd(key, member, ttl) {
      let entry = live(sets, key);
      if (!entry) {
        entry = { value: new Set(), expiresAt: expiry(ttl) };
        sets.set(key, entry);
      }
      entry.value.add(member);
    },
    async smembers(key) {
      const entry = live(sets, key);
      return entry ? Array.from(entry.value) : [];
    },
  };
}

type RedisCommand = (string | number)[];

export function createRedisRestStore(url: string, token: string): KeyValueStore {
  async function pipeline(commands: RedisCommand[]): Promise<unknown[]> {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) throw new Error(`Redis REST ${response.status}`);
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    return results.map((r) => {
      if (r.error) throw new Error(r.error);
      return r.result;
    });
  }

  return {
    kind: "redis",
    async incr(key, ttl) {
      const commands: RedisCommand[] = [["INCR", key]];
      if (ttl) commands.push(["EXPIRE", key, ttl, "NX"]);
      const [value] = await pipeline(commands);
      return Number(value);
    },
    async hincrby(key, fields, ttl) {
      const commands: RedisCommand[] = Object.entries(fields).map(([field, delta]) => ["HINCRBY", key, field, delta]);
      if (ttl) commands.push(["EXPIRE", key, ttl, "NX"]);
      if (commands.length) await pipeline(commands);
    },
    async hgetall(key) {
      const [flat] = (await pipeline([["HGETALL", key]])) as [unknown[]];
      const out: Record<string, number> = {};
      if (!Array.isArray(flat)) return out;
      for (let i = 0; i < flat.length; i += 2) out[String(flat[i])] = Number(flat[i + 1]);
      return out;
    },
    async sadd(key, member, ttl) {
      const commands: RedisCommand[] = [["SADD", key, member]];
      if (ttl) commands.push(["EXPIRE", key, ttl, "NX"]);
      await pipeline(commands);
    },
    async smembers(key) {
      const [members] = (await pipeline([["SMEMBERS", key]])) as [unknown[]];
      return Array.isArray(members) ? members.map(String) : [];
    },
  };
}

export function redisCredentials(env: Record<string, string | undefined> = process.env): { url: string; token: string } | null {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

declare global {
  var __launchablStore: KeyValueStore | undefined;
}

/** Process-wide store: Redis when configured, otherwise memory (survives HMR in dev). */
export function getStore(): KeyValueStore {
  if (!globalThis.__launchablStore) {
    const creds = redisCredentials();
    globalThis.__launchablStore = creds ? createRedisRestStore(creds.url, creds.token) : createMemoryStore();
  }
  return globalThis.__launchablStore;
}
