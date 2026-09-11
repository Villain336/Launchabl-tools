/**
 * Usage and cost accounting for AI tools.
 *
 * Every completed chat turn increments per-day hashes in the shared store:
 * totals, per tool, per model. Cost comes from the gateway when it reports
 * one (providerMetadata.gateway.cost) and from a price table otherwise, and
 * is stored as integer micro-dollars so sums stay exact.
 */

import { getStore, type KeyValueStore } from "@/lib/ai/store";

export type UsageEvent = {
  slug: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** USD, when the provider reported it. */
  reportedCostUsd?: number | null;
  durationMs?: number;
  ok: boolean;
};

/** USD per million tokens (input, output). Approximate list prices; used only when the gateway omits cost. */
export const MODEL_PRICES: Record<string, [number, number]> = {
  "anthropic/claude-sonnet-4.6": [3, 15],
  "anthropic/claude-haiku-4.5": [1, 5],
  "openai/gpt-5.4": [2.5, 10],
  "openai/gpt-5-mini": [0.25, 2],
  "google/gemini-3.5-flash": [0.3, 2.5],
  "google/gemini-3.5-flash-lite": [0.1, 0.4],
  "meta/llama-4-scout": [0.08, 0.3],
};

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const [inPrice, outPrice] = MODEL_PRICES[model] ?? [1, 4];
  return (inputTokens * inPrice + outputTokens * outPrice) / 1_000_000;
}

export const toMicro = (usd: number) => Math.round(usd * 1_000_000);
export const fromMicro = (micro: number) => micro / 1_000_000;

export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const RETENTION_SECONDS = 400 * 24 * 60 * 60;
const KEY_PREFIX = "usage";

/** Redis hash field names are flat; slugs and models are safe (no ":" in either except the model's "/"). */
const field = (...parts: string[]) => parts.join(":");

export async function recordUsage(event: UsageEvent, store: KeyValueStore = getStore(), date = new Date()): Promise<void> {
  const day = dayKey(date);
  const costUsd = event.reportedCostUsd ?? estimateCostUsd(event.model, event.inputTokens, event.outputTokens);
  const cost = toMicro(costUsd);
  const scopes = ["all", field("tool", event.slug), field("model", event.model)];
  const fields: Record<string, number> = {};
  for (const scope of scopes) {
    fields[field(scope, "requests")] = 1;
    fields[field(scope, "input")] = event.inputTokens;
    fields[field(scope, "output")] = event.outputTokens;
    fields[field(scope, "cost")] = cost;
    if (!event.ok) fields[field(scope, "errors")] = 1;
    if (event.durationMs) fields[field(scope, "duration")] = Math.round(event.durationMs);
  }
  if (event.reportedCostUsd == null) fields[field("all", "estimated")] = 1;
  try {
    await Promise.all([store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS), store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS)]);
  } catch (error) {
    console.warn("[usage] failed to record", error);
  }
}

export type UsageBucket = { requests: number; inputTokens: number; outputTokens: number; costUsd: number; errors: number; avgDurationMs: number | null };

export type UsageDay = {
  day: string;
  total: UsageBucket;
  byTool: Record<string, UsageBucket>;
  byModel: Record<string, UsageBucket>;
  estimatedRequests: number;
};

function emptyBucket(): UsageBucket {
  return { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, errors: 0, avgDurationMs: null };
}

export function parseDay(day: string, raw: Record<string, number>): UsageDay {
  const total = emptyBucket();
  const byTool: Record<string, UsageBucket> = {};
  const byModel: Record<string, UsageBucket> = {};
  const durations: Record<string, number> = {};
  const bucketFor = (scope: string): UsageBucket | null => {
    if (scope === "all") return total;
    if (scope.startsWith("tool:")) return (byTool[scope.slice(5)] ??= emptyBucket());
    if (scope.startsWith("model:")) return (byModel[scope.slice(6)] ??= emptyBucket());
    return null;
  };
  let estimatedRequests = 0;
  for (const [key, value] of Object.entries(raw)) {
    const idx = key.lastIndexOf(":");
    const scope = key.slice(0, idx);
    const metric = key.slice(idx + 1);
    if (scope === "all" && metric === "estimated") {
      estimatedRequests = value;
      continue;
    }
    const bucket = bucketFor(scope);
    if (!bucket) continue;
    if (metric === "requests") bucket.requests = value;
    else if (metric === "input") bucket.inputTokens = value;
    else if (metric === "output") bucket.outputTokens = value;
    else if (metric === "cost") bucket.costUsd = fromMicro(value);
    else if (metric === "errors") bucket.errors = value;
    else if (metric === "duration") durations[scope] = value;
  }
  for (const [scope, sum] of Object.entries(durations)) {
    const bucket = bucketFor(scope);
    if (bucket && bucket.requests) bucket.avgDurationMs = Math.round(sum / bucket.requests);
  }
  return { day, total, byTool, byModel, estimatedRequests };
}

export async function readUsage(days: number, store: KeyValueStore = getStore(), now = new Date()): Promise<UsageDay[]> {
  const wanted: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    wanted.push(dayKey(d));
  }
  const raws = await Promise.all(wanted.map((day) => store.hgetall(`${KEY_PREFIX}:day:${day}`)));
  return wanted.map((day, i) => parseDay(day, raws[i]));
}

/* ── Daily spend cap ───────────────────────────────────────
 * Tools are free with no account, so a runaway bot could burn the gateway
 * balance overnight. Every AI request checks today's recorded cost first.
 */

export const DEFAULT_DAILY_CAP_USD = 25;

export function dailySpendCapUsd(env: Record<string, string | undefined> = process.env): number {
  const raw = Number(env.DAILY_SPEND_CAP_USD);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_CAP_USD;
}

export type SpendCheck = { ok: boolean; spentUsd: number; capUsd: number; resetsInSeconds: number };

export async function checkDailySpend(store: KeyValueStore = getStore(), now = new Date(), capUsd = dailySpendCapUsd()): Promise<SpendCheck> {
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  const resetsInSeconds = Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 1000));
  try {
    const raw = await store.hgetall(`${KEY_PREFIX}:day:${dayKey(now)}`);
    const spentUsd = fromMicro(raw[field("all", "cost")] ?? 0);
    return { ok: spentUsd < capUsd, spentUsd, capUsd, resetsInSeconds };
  } catch (error) {
    // Fail open: a store outage shouldn't take the tools down.
    console.warn("[usage] spend check failed", error);
    return { ok: true, spentUsd: 0, capUsd, resetsInSeconds };
  }
}

export const SPEND_CAP_MESSAGE = "The free tools have hit today's usage limit. They reset at midnight UTC — come back then, or get in touch if you need more today.";

export function sumBuckets(buckets: UsageBucket[]): UsageBucket {
  const out = emptyBucket();
  let durationWeighted = 0;
  let durationRequests = 0;
  for (const b of buckets) {
    out.requests += b.requests;
    out.inputTokens += b.inputTokens;
    out.outputTokens += b.outputTokens;
    out.costUsd += b.costUsd;
    out.errors += b.errors;
    if (b.avgDurationMs !== null) {
      durationWeighted += b.avgDurationMs * b.requests;
      durationRequests += b.requests;
    }
  }
  out.avgDurationMs = durationRequests ? Math.round(durationWeighted / durationRequests) : null;
  return out;
}

export type GatewayCredits = { balance: number; totalUsed: number } | null;

/** Remaining AI Gateway credits for the configured key. */
export async function fetchGatewayCredits(apiKey: string | undefined = process.env.AI_GATEWAY_API_KEY): Promise<GatewayCredits> {
  if (!apiKey) return null;
  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { balance?: string | number; total_used?: string | number };
    return { balance: Number(data.balance ?? 0), totalUsed: Number(data.total_used ?? 0) };
  } catch {
    return null;
  }
}
