import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { recordTemplatePick } from "@/lib/ai/usage";
import { AGENT_TEMPLATES } from "@/lib/agent/templates";

/**
 * Counts clicks on the agent's "Start from a job" cards. Fired with
 * `sendBeacon` when a card is picked; no personal data is stored.
 */

declare global {
  var __launchablPickLimiter: RateLimiter | undefined;
}

function limiter(): RateLimiter {
  globalThis.__launchablPickLimiter ??= createRateLimiter([{ name: "template-pick", limit: 60, windowSeconds: 10 * 60 }], getStore());
  return globalThis.__launchablPickLimiter;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { template?: unknown } | null;
  const template = typeof body?.template === "string" ? body.template : "";
  if (!AGENT_TEMPLATES.some((t) => t.id === template)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const limit = await limiter().check(clientKey(request.headers));
  if (!limit.ok) return new NextResponse(null, { status: 429 });

  await recordTemplatePick(template);
  return new NextResponse(null, { status: 204 });
}
