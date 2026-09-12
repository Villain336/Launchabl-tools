import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getStore, redisCredentials } from "@/lib/ai/store";
import { dailySpendCapUsd, fetchGatewayCredits, MODEL_PRICES, readUsage, sumBuckets, sumUpsell, type UpsellBucket, type UsageBucket } from "@/lib/ai/usage";
import { CHAT_LIMITS } from "@/lib/ai/rate-limit";
import { modelChain } from "@/lib/ai/models";
import { authStats } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : request.headers.get("x-admin-token") ?? "";
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Set ADMIN_TOKEN to enable the usage dashboard." }, { status: 503 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days") ?? 30) || 30));
  const store = getStore();
  const [usage, credits, accounts] = await Promise.all([readUsage(days, store), fetchGatewayCredits(), authStats(days, store)]);

  const window = (n: number) => sumBuckets(usage.slice(0, n).map((d) => d.total));
  const toolBuckets: Record<string, UsageBucket[]> = {};
  const modelBuckets: Record<string, UsageBucket[]> = {};
  for (const day of usage) {
    for (const [slug, bucket] of Object.entries(day.byTool)) (toolBuckets[slug] ??= []).push(bucket);
    for (const [model, bucket] of Object.entries(day.byModel)) (modelBuckets[model] ??= []).push(bucket);
  }
  const aggregate = (groups: Record<string, UsageBucket[]>) =>
    Object.fromEntries(
      Object.entries(groups)
        .map(([key, buckets]) => [key, sumBuckets(buckets)] as const)
        .sort((a, b) => b[1].costUsd - a[1].costUsd),
    );
  const byTool = aggregate(toolBuckets);
  const byModel = aggregate(modelBuckets);

  const upsellByToolBuckets: Record<string, UpsellBucket[]> = {};
  for (const day of usage) {
    for (const [slug, bucket] of Object.entries(day.upsellByTool)) (upsellByToolBuckets[slug] ??= []).push(bucket);
  }
  const upsell = {
    today: sumUpsell(usage.slice(0, 1).map((d) => d.upsell)),
    last7: sumUpsell(usage.slice(0, 7).map((d) => d.upsell)),
    range: sumUpsell(usage.map((d) => d.upsell)),
    byTool: Object.fromEntries(
      Object.entries(upsellByToolBuckets)
        .map(([slug, buckets]) => [slug, sumUpsell(buckets)] as const)
        .sort((a, b) => b[1].clicks - a[1].clicks || b[1].views - a[1].views),
    ),
  };

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    store: { kind: store.kind, shared: Boolean(redisCredentials()) },
    limits: CHAT_LIMITS,
    dailyCapUsd: dailySpendCapUsd(),
    chains: { writer: modelChain("writer"), fast: modelChain("fast") },
    prices: MODEL_PRICES,
    credits,
    summary: { today: window(1), last7: window(7), last30: window(30), range: window(days) },
    byTool,
    byModel,
    upsell,
    accounts,
    days: usage,
  });
}
