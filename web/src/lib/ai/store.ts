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
  /** Increment a counter by an arbitrary amount, setting `ttlSeconds` only when the key is new. Returns the new value. */
  incrBy(key: string, amount: number, ttlSeconds?: number): Promise<number>;
  /**
   * Atomic check-and-decrement: decrements a counter by `amount` only if its
   * current value is at least `amount`, in a single round trip (no
   * read-then-write race between two concurrent calls). Returns the new
   * value, or `null` if the balance was too low (no change made).
   */
  decrIfAtLeast(key: string, amount: number): Promise<number | null>;
  /** Read a counter's current value (0 if unset). Doesn't mutate it. */
  getCounter(key: string): Promise<number>;
  /**
   * Atomic "set if absent": writes `value` and returns `true` only if the
   * key didn't already exist; otherwise makes no change and returns
   * `false`. Use as an idempotency guard where double-processing has a
   * real cost (e.g. granting credits twice for one Stripe checkout
   * session) — a plain get-then-set has a race two near-simultaneous
   * callers can both slip through.
   */
  setNx(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
  /** Increment many hash fields at once. */
  hincrby(key: string, fields: Record<string, number>, ttlSeconds?: number): Promise<void>;
  hgetall(key: string): Promise<Record<string, number>>;
  sadd(key: string, member: string, ttlSeconds?: number): Promise<void>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, member: string): Promise<void>;
  /** Plain string value with optional TTL; used for small records (sessions, codes, users). */
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
};

type Entry<T> = { value: T; expiresAt: number | null };

export function createMemoryStore(now: () => number = Date.now): KeyValueStore {
  const counters = new Map<string, Entry<number>>();
  const hashes = new Map<string, Entry<Map<string, number>>>();
  const sets = new Map<string, Entry<Set<string>>>();
  const strings = new Map<string, Entry<string>>();

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
    async incrBy(key, amount, ttl) {
      const entry = live(counters, key);
      if (!entry) {
        counters.set(key, { value: amount, expiresAt: expiry(ttl) });
        return amount;
      }
      entry.value += amount;
      return entry.value;
    },
    async decrIfAtLeast(key, amount) {
      const entry = live(counters, key);
      const current = entry ? entry.value : 0;
      if (current < amount) return null;
      const next = current - amount;
      if (entry) entry.value = next;
      else counters.set(key, { value: next, expiresAt: null });
      return next;
    },
    async getCounter(key) {
      return live(counters, key)?.value ?? 0;
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
    async srem(key, member) {
      live(sets, key)?.value.delete(member);
    },
    async set(key, value, ttl) {
      strings.set(key, { value, expiresAt: expiry(ttl) });
    },
    async setNx(key, value, ttl) {
      if (live(strings, key)) return false;
      strings.set(key, { value, expiresAt: expiry(ttl) });
      return true;
    },
    async get(key) {
      return live(strings, key)?.value ?? null;
    },
    async del(key) {
      strings.delete(key);
      counters.delete(key);
      hashes.delete(key);
      sets.delete(key);
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
    async incrBy(key, amount, ttl) {
      const commands: RedisCommand[] = [["INCRBY", key, amount]];
      if (ttl) commands.push(["EXPIRE", key, ttl, "NX"]);
      const [value] = await pipeline(commands);
      return Number(value);
    },
    async decrIfAtLeast(key, amount) {
      // A pipeline batches commands but isn't atomic; EVAL runs this whole
      // read-then-act sequence as one atomic step on the server, which a
      // pipelined GET+DECRBY (or MULTI/EXEC, which can't branch on a value
      // it just read) can't guarantee under concurrent requests.
      const script = "local c = tonumber(redis.call('GET', KEYS[1]) or '0') if c < tonumber(ARGV[1]) then return -1 end return redis.call('DECRBY', KEYS[1], ARGV[1])";
      const [result] = await pipeline([["EVAL", script, 1, key, amount]]);
      const value = Number(result);
      return value < 0 ? null : value;
    },
    async getCounter(key) {
      const [value] = await pipeline([["GET", key]]);
      return value === null || value === undefined ? 0 : Number(value);
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
    async srem(key, member) {
      await pipeline([["SREM", key, member]]);
    },
    async set(key, value, ttl) {
      await pipeline([ttl ? ["SET", key, value, "EX", ttl] : ["SET", key, value]]);
    },
    async setNx(key, value, ttl) {
      const command: RedisCommand = ttl ? ["SET", key, value, "EX", ttl, "NX"] : ["SET", key, value, "NX"];
      const [result] = await pipeline([command]);
      return result === "OK";
    },
    async get(key) {
      const [value] = await pipeline([["GET", key]]);
      return value === null || value === undefined ? null : String(value);
    },
    async del(key) {
      await pipeline([["DEL", key]]);
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
  // A dev HMR cycle can leave an instance built from an older module version.
  if (globalThis.__launchablStore && typeof globalThis.__launchablStore.srem !== "function") globalThis.__launchablStore = undefined;
  if (!globalThis.__launchablStore) {
    const creds = redisCredentials();
    globalThis.__launchablStore = creds ? createRedisRestStore(creds.url, creds.token) : createMemoryStore();
  }
  return globalThis.__launchablStore;
}
