import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { recordUpsell, UPSELL_KINDS, type UpsellKind } from "@/lib/ai/usage";
import { getToolBySlug } from "@/lib/site-config";

/**
 * Counts agency-upsell impressions, clicks and dismissals per tool. Fired
 * with `sendBeacon` from the chat artifacts; no personal data is stored.
 */

declare global {
  var __launchablUpsellLimiter: RateLimiter | undefined;
}

function limiter(): RateLimiter {
  globalThis.__launchablUpsellLimiter ??= createRateLimiter([{ name: "upsell", limit: 60, windowSeconds: 10 * 60 }], getStore());
  return globalThis.__launchablUpsellLimiter;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { slug?: unknown; kind?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  const kind = typeof body?.kind === "string" ? body.kind : "";
  if (!getToolBySlug(slug) || !(UPSELL_KINDS as readonly string[]).includes(kind)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const limit = await limiter().check(clientKey(request.headers));
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  await recordUpsell({ slug, kind: kind as UpsellKind });
  return new NextResponse(null, { status: 204 });
}
