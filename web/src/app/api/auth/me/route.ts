import { NextResponse, type NextRequest } from "next/server";
import { ANON_FREE_RUNS, getUser, hasProAccess, readOrCreateAnon, readSession } from "@/lib/auth/session";
import { getStore } from "@/lib/ai/store";
import { getCreditBalance } from "@/lib/billing/credits";

export const dynamic = "force-dynamic";

/**
 * Who am I, how many free anonymous runs are left, and (signed in) the
 * purchased credit-pack balance plus whether Tools Pro is active. `isPro`
 * is the only place any client surface can currently learn subscription
 * status — see docs/STRATEGY.md §17 for why that gap mattered enough to
 * fix (there was previously no way to show a subscriber that they're Pro).
 */
export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (session) {
    const [credits, user] = await Promise.all([getCreditBalance(session.uid).catch(() => 0), getUser(session.uid).catch(() => null)]);
    return NextResponse.json({ user: { email: session.email, name: session.name }, freeRunsLeft: null, credits, isPro: hasProAccess(user) });
  }
  const anon = await readOrCreateAnon(request.cookies);
  const used = anon.setCookie ? 0 : ((await getStore().hgetall(`anon:${anon.anonId}`)).runs ?? 0);
  const response = NextResponse.json({ user: null, freeRunsLeft: Math.max(0, ANON_FREE_RUNS - used) });
  if (anon.setCookie) response.headers.append("Set-Cookie", anon.setCookie);
  return response;
}
