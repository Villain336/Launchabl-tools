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
  /** Agent template id that started the conversation, when the run came from one. */
  template?: string | null;
  /**
   * Signed-in account id, when the run wasn't anonymous. Not set for anon
   * runs. Powers the "distinct tools used per account" moat metric
   * (STRATEGY.md §18.2.1 / §23.5) — see `readAccountToolBreadth`.
   */
  uid?: string | null;
  /** Whether a saved project's Brand Vault context was attached to this run. Only meaningful when `uid` is set. */
  hasProjectContext?: boolean;
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
  if (event.template) scopes.push(field("template", event.template));
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
  // Only signed-in runs can have (or lack) saved project context — anonymous
  // traffic never has a project, so mixing it in would dilute the reuse rate.
  if (event.uid) fields[field("context", event.hasProjectContext ? "project" : "noproject", "requests")] = 1;
  const writes: Promise<unknown>[] = [
    store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS),
    store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS),
  ];
  if (event.uid) {
    writes.push(store.sadd(`${KEY_PREFIX}:user:${event.uid}:tools`, event.slug, RETENTION_SECONDS));
    writes.push(store.sadd(`${KEY_PREFIX}:users`, event.uid, RETENTION_SECONDS));
  }
  try {
    await Promise.all(writes);
  } catch (error) {
    console.warn("[usage] failed to record", error);
  }
}

/* ── Moat metrics (STRATEGY.md §18.2.1 / §23.5) ─────────────
 * §18 named "distinct tools used per account" and "% of runs that reused
 * saved project context" as the single biggest lever behind the whole
 * connective-tissue/Brand Vault thesis — and §22.1/§23.1 flagged that
 * neither was actually measured anywhere. These two readers are that
 * measurement: an account that only ever uses one tool is a "used for a
 * month and tossed" account; an account whose tool count grows and that
 * keeps reusing its saved project context is the moat, if it exists at all.
 */

export type ToolBreadthStats = {
  /** Accounts that have run at least one tool, ever (capped by `limit`). */
  accountsWithUsage: number;
  /** True if `accountsWithUsage` was capped by `limit` rather than exhaustive. */
  sampled: boolean;
  /** Bucketed count of accounts by how many distinct tool slugs they've ever run. */
  distinctToolsHistogram: { "1": number; "2-3": number; "4-9": number; "10+": number };
  /** Mean distinct tools run, across accounts with at least one run. */
  avgDistinctTools: number;
  /** Share of accounts with usage that have used 2 or more distinct tools — the direct read on whether the connective-tissue thesis is real. */
  multiToolRate: number;
};

export function emptyToolBreadthStats(): ToolBreadthStats {
  return { accountsWithUsage: 0, sampled: false, distinctToolsHistogram: { "1": 0, "2-3": 0, "4-9": 0, "10+": 0 }, avgDistinctTools: 0, multiToolRate: 0 };
}

/**
 * Scans the (uncapped, all-time) index of accounts that have ever run a
 * tool, and for each one counts distinct tool slugs via the per-account set
 * written in `recordUsage`. At current usage volumes a full scan is cheap;
 * `limit` exists so this can't become an unbounded admin-dashboard query if
 * the account base grows before this gets replaced with a cheaper rollup.
 */
export async function readAccountToolBreadth(store: KeyValueStore = getStore(), limit = 5000): Promise<ToolBreadthStats> {
  try {
    const uids = await store.smembers(`${KEY_PREFIX}:users`);
    const sample = uids.slice(0, limit);
    const counts = await Promise.all(sample.map(async (uid) => (await store.smembers(`${KEY_PREFIX}:user:${uid}:tools`)).length));
    const stats = emptyToolBreadthStats();
    stats.sampled = uids.length > limit;
    let totalTools = 0;
    let multi = 0;
    let withUsage = 0;
    for (const count of counts) {
      if (count <= 0) continue;
      withUsage++;
      totalTools += count;
      if (count >= 2) multi++;
      if (count === 1) stats.distinctToolsHistogram["1"]++;
      else if (count <= 3) stats.distinctToolsHistogram["2-3"]++;
      else if (count <= 9) stats.distinctToolsHistogram["4-9"]++;
      else stats.distinctToolsHistogram["10+"]++;
    }
    stats.accountsWithUsage = withUsage;
    stats.avgDistinctTools = withUsage ? totalTools / withUsage : 0;
    stats.multiToolRate = withUsage ? multi / withUsage : 0;
    return stats;
  } catch (error) {
    console.warn("[usage] failed to read account tool breadth", error);
    return emptyToolBreadthStats();
  }
}

export type ContextReuseStats = { withProject: number; withoutProject: number; reuseRate: number };

export function emptyContextReuseStats(): ContextReuseStats {
  return { withProject: 0, withoutProject: 0, reuseRate: 0 };
}

/** Share of signed-in runs (over `days`) that had a saved project's Brand Vault context attached. */
export async function readContextReuseStats(days: number, store: KeyValueStore = getStore(), now = new Date()): Promise<ContextReuseStats> {
  const stats = emptyContextReuseStats();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const raw = await store.hgetall(`${KEY_PREFIX}:day:${dayKey(d)}`);
    stats.withProject += raw["context:project:requests"] ?? 0;
    stats.withoutProject += raw["context:noproject:requests"] ?? 0;
  }
  const total = stats.withProject + stats.withoutProject;
  stats.reuseRate = total ? stats.withProject / total : 0;
  return stats;
}

/**
 * A "Start from a job" card was clicked. Compared with the template's runs
 * this shows which cards attract attention but don't turn into a sent brief.
 */
export async function recordTemplatePick(templateId: string, store: KeyValueStore = getStore(), date = new Date()): Promise<void> {
  const day = dayKey(date);
  const fields = { [field("template", templateId, "picks")]: 1 };
  try {
    await Promise.all([store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS), store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS)]);
  } catch (error) {
    console.warn("[usage] failed to record template pick", error);
  }
}

/* ── Agency upsell ─────────────────────────────────────────
 * The free tools exist to sell the agency. Reports with failures show a
 * "want this done for you?" card; every impression, click and dismissal is
 * counted here (per day, per tool) so the admin dashboard can show whether
 * the offer converts and from which tool.
 */

export const UPSELL_KINDS = ["view", "click", "dismiss"] as const;
export type UpsellKind = (typeof UPSELL_KINDS)[number];

export type UpsellEvent = { slug: string; kind: UpsellKind };

export type UpsellBucket = { views: number; clicks: number; dismissals: number };

export async function recordUpsell(event: UpsellEvent, store: KeyValueStore = getStore(), date = new Date()): Promise<void> {
  const day = dayKey(date);
  const fields: Record<string, number> = {
    [field("upsell", "all", event.kind)]: 1,
    [field("upsell", "tool", event.slug, event.kind)]: 1,
  };
  try {
    await Promise.all([store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS), store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS)]);
  } catch (error) {
    console.warn("[usage] failed to record upsell", error);
  }
}

/* ── Tools Pro paywall (dark-launch metrics) ────────────────
 * While a pro-tier tool isn't in PAYWALL_ENFORCED_TOOLS yet, entitlement.ts
 * waves the request through instead of blocking it, but records the would-
 * have-blocked event here so the admin dashboard can show how many requests
 * a tool would actually stop before enforcement is switched on.
 */

export type PaywallKind = "shadow_blocked" | "blocked" | "trial_started";

export async function recordPaywallEvent(kind: PaywallKind, slug: string, store: KeyValueStore = getStore(), date = new Date()): Promise<void> {
  const day = dayKey(date);
  const fields = { [field("paywall", kind, "all")]: 1, [field("paywall", kind, "tool", slug)]: 1 };
  try {
    await Promise.all([store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS), store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS)]);
  } catch (error) {
    console.warn("[usage] failed to record paywall event", error);
  }
}

export type PaywallStats = { shadowBlocked: number; blocked: number; trialsStarted: number; byTool: Record<string, { shadowBlocked: number; blocked: number; trialsStarted: number }> };

export function emptyPaywallStats(): PaywallStats {
  return { shadowBlocked: 0, blocked: 0, trialsStarted: 0, byTool: {} };
}

function applyPaywall(raw: Record<string, number>): PaywallStats {
  const stats = emptyPaywallStats();
  const kindKey: Record<PaywallKind, keyof Omit<PaywallStats, "byTool">> = { shadow_blocked: "shadowBlocked", blocked: "blocked", trial_started: "trialsStarted" };
  for (const [key, value] of Object.entries(raw)) {
    if (!key.startsWith("paywall:")) continue;
    const rest = key.slice("paywall:".length);
    for (const [kind, prop] of Object.entries(kindKey) as [PaywallKind, keyof Omit<PaywallStats, "byTool">][]) {
      if (rest === `${kind}:all`) {
        stats[prop] += value;
      } else if (rest.startsWith(`${kind}:tool:`)) {
        const slug = rest.slice(`${kind}:tool:`.length);
        const bucket = (stats.byTool[slug] ??= { shadowBlocked: 0, blocked: 0, trialsStarted: 0 });
        bucket[prop] += value;
      }
    }
  }
  return stats;
}

export async function readPaywallStats(days: number, store: KeyValueStore = getStore(), now = new Date()): Promise<PaywallStats> {
  const merged: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const raw = await store.hgetall(`${KEY_PREFIX}:day:${dayKey(d)}`);
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith("paywall:")) merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return applyPaywall(merged);
}

/* ── Credit packs ────────────────────────────────────────── 
 * One-time-payment alternative to the Tools Pro subscription (see
 * lib/billing/credits.ts for the ledger itself). "purchased" is recorded
 * when the Stripe webhook grants a pack; "spent" when entitlement.ts draws
 * one down as a fallback before it would otherwise block a pro-tier request.
 */

export type CreditEventKind = "purchased" | "spent";

export async function recordCreditEvent(
  kind: CreditEventKind,
  opts: { pack?: string; amount?: number; revenueUsd?: number } = {},
  store: KeyValueStore = getStore(),
  date = new Date(),
): Promise<void> {
  const day = dayKey(date);
  const fields: Record<string, number> =
    kind === "purchased"
      ? {
          [field("credits", "purchased", "packs")]: 1,
          [field("credits", "purchased", "credits")]: opts.amount ?? 0,
          [field("credits", "purchased", "revenue")]: toMicro(opts.revenueUsd ?? 0),
          ...(opts.pack ? { [field("credits", "purchased", "pack", opts.pack)]: 1 } : {}),
        }
      : { [field("credits", "spent", "credits")]: 1 };
  try {
    await Promise.all([store.hincrby(`${KEY_PREFIX}:day:${day}`, fields, RETENTION_SECONDS), store.sadd(`${KEY_PREFIX}:days`, day, RETENTION_SECONDS)]);
  } catch (error) {
    console.warn("[usage] failed to record credit event", error);
  }
}

export type CreditStats = { packsSold: number; creditsPurchased: number; creditsSpent: number; revenueUsd: number; byPack: Record<string, number> };

export function emptyCreditStats(): CreditStats {
  return { packsSold: 0, creditsPurchased: 0, creditsSpent: 0, revenueUsd: 0, byPack: {} };
}

const PACK_FIELD_PREFIX = "credits:purchased:pack:";

export async function readCreditStats(days: number, store: KeyValueStore = getStore(), now = new Date()): Promise<CreditStats> {
  const stats = emptyCreditStats();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const raw = await store.hgetall(`${KEY_PREFIX}:day:${dayKey(d)}`);
    for (const [key, value] of Object.entries(raw)) {
      if (key === "credits:purchased:packs") stats.packsSold += value;
      else if (key === "credits:purchased:credits") stats.creditsPurchased += value;
      else if (key === "credits:purchased:revenue") stats.revenueUsd += fromMicro(value);
      else if (key === "credits:spent:credits") stats.creditsSpent += value;
      else if (key.startsWith(PACK_FIELD_PREFIX)) {
        const pack = key.slice(PACK_FIELD_PREFIX.length);
        stats.byPack[pack] = (stats.byPack[pack] ?? 0) + value;
      }
    }
  }
  return stats;
}

export function emptyUpsell(): UpsellBucket {
  return { views: 0, clicks: 0, dismissals: 0 };
}

export function sumUpsell(buckets: UpsellBucket[]): UpsellBucket {
  const out = emptyUpsell();
  for (const b of buckets) {
    out.views += b.views;
    out.clicks += b.clicks;
    out.dismissals += b.dismissals;
  }
  return out;
}

export type UsageBucket = { requests: number; inputTokens: number; outputTokens: number; costUsd: number; errors: number; avgDurationMs: number | null };

export type UsageDay = {
  day: string;
  total: UsageBucket;
  byTool: Record<string, UsageBucket>;
  byModel: Record<string, UsageBucket>;
  /** Runs started from an agent template, by template id. */
  byTemplate: Record<string, UsageBucket>;
  /** Template card clicks, by template id (a pick doesn't always become a run). */
  templatePicks: Record<string, number>;
  estimatedRequests: number;
  upsell: UpsellBucket;
  upsellByTool: Record<string, UpsellBucket>;
};

function emptyBucket(): UsageBucket {
  return { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, errors: 0, avgDurationMs: null };
}

function applyUpsell(bucket: UpsellBucket, metric: string, value: number) {
  if (metric === "view") bucket.views = value;
  else if (metric === "click") bucket.clicks = value;
  else if (metric === "dismiss") bucket.dismissals = value;
}

export function parseDay(day: string, raw: Record<string, number>): UsageDay {
  const total = emptyBucket();
  const byTool: Record<string, UsageBucket> = {};
  const byModel: Record<string, UsageBucket> = {};
  const byTemplate: Record<string, UsageBucket> = {};
  const templatePicks: Record<string, number> = {};
  const upsell = emptyUpsell();
  const upsellByTool: Record<string, UpsellBucket> = {};
  const durations: Record<string, number> = {};
  const bucketFor = (scope: string): UsageBucket | null => {
    if (scope === "all") return total;
    if (scope.startsWith("tool:")) return (byTool[scope.slice(5)] ??= emptyBucket());
    if (scope.startsWith("model:")) return (byModel[scope.slice(6)] ??= emptyBucket());
    if (scope.startsWith("template:")) return (byTemplate[scope.slice(9)] ??= emptyBucket());
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
    if (scope === "upsell:all") {
      applyUpsell(upsell, metric, value);
      continue;
    }
    if (scope.startsWith("upsell:tool:")) {
      applyUpsell((upsellByTool[scope.slice("upsell:tool:".length)] ??= emptyUpsell()), metric, value);
      continue;
    }
    if (scope.startsWith("template:") && metric === "picks") {
      templatePicks[scope.slice(9)] = value;
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
  return { day, total, byTool, byModel, byTemplate, templatePicks, estimatedRequests, upsell, upsellByTool };
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
 * Tools are free and anonymous for the first run, so a runaway bot could burn the gateway
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
