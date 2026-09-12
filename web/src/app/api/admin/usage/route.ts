import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { getStore, redisCredentials } from "@/lib/ai/store";
import { dailySpendCapUsd, fetchGatewayCredits, MODEL_PRICES, readUsage, sumBuckets, sumUpsell, type UpsellBucket, type UsageBucket } from "@/lib/ai/usage";
import { CHAT_LIMITS } from "@/lib/ai/rate-limit";
import { imageModelChain, modelChain } from "@/lib/ai/models";
import { authStats } from "@/lib/auth/session";
import { reportStats } from "@/lib/reports/storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Set ADMIN_TOKEN to enable the usage dashboard." }, { status: 503 });
  }
  if (!adminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const days = Math.min(90, Math.max(1, Number(request.nextUrl.searchParams.get("days") ?? 30) || 30));
  const store = getStore();
  const [usage, credits, accounts, reports] = await Promise.all([readUsage(days, store), fetchGatewayCredits(), authStats(days, store), reportStats(days, store)]);

  const window = (n: number) => sumBuckets(usage.slice(0, n).map((d) => d.total));
  const toolBuckets: Record<string, UsageBucket[]> = {};
  const modelBuckets: Record<string, UsageBucket[]> = {};
  const templateBuckets: Record<string, UsageBucket[]> = {};
  const templatePicks: Record<string, number> = {};
  for (const day of usage) {
    for (const [slug, bucket] of Object.entries(day.byTool)) (toolBuckets[slug] ??= []).push(bucket);
    for (const [model, bucket] of Object.entries(day.byModel)) (modelBuckets[model] ??= []).push(bucket);
    for (const [id, bucket] of Object.entries(day.byTemplate ?? {})) (templateBuckets[id] ??= []).push(bucket);
    for (const [id, picks] of Object.entries(day.templatePicks ?? {})) templatePicks[id] = (templatePicks[id] ?? 0) + picks;
  }
  const aggregate = (groups: Record<string, UsageBucket[]>) =>
    Object.fromEntries(
      Object.entries(groups)
        .map(([key, buckets]) => [key, sumBuckets(buckets)] as const)
        .sort((a, b) => b[1].costUsd - a[1].costUsd),
    );
  const byTool = aggregate(toolBuckets);
  const byModel = aggregate(modelBuckets);
  const byTemplate = Object.fromEntries(Object.entries(aggregate(templateBuckets)).sort((a, b) => b[1].requests - a[1].requests));

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
    chains: { writer: modelChain("writer"), fast: modelChain("fast"), image: imageModelChain() },
    prices: MODEL_PRICES,
    credits,
    summary: { today: window(1), last7: window(7), last30: window(30), range: window(days) },
    byTool,
    byModel,
    byTemplate,
    templatePicks,
    upsell,
    accounts,
    reports,
    days: usage,
  });
}
