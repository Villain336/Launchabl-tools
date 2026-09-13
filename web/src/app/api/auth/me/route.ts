import { NextResponse, type NextRequest } from "next/server";
import { ANON_FREE_RUNS, readOrCreateAnon, readSession } from "@/lib/auth/session";
import { getStore } from "@/lib/ai/store";
import { getCreditBalance } from "@/lib/billing/credits";

export const dynamic = "force-dynamic";

/** Who am I, how many free anonymous runs are left, and (signed in) the purchased credit-pack balance. */
export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (session) {
    const credits = await getCreditBalance(session.uid).catch(() => 0);
    return NextResponse.json({ user: { email: session.email, name: session.name }, freeRunsLeft: null, credits });
  }
  const anon = await readOrCreateAnon(request.cookies);
  const used = anon.setCookie ? 0 : ((await getStore().hgetall(`anon:${anon.anonId}`)).runs ?? 0);
  const response = NextResponse.json({ user: null, freeRunsLeft: Math.max(0, ANON_FREE_RUNS - used) });
  if (anon.setCookie) response.headers.append("Set-Cookie", anon.setCookie);
  return response;
}
