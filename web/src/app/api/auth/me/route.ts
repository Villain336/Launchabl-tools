import { NextResponse, type NextRequest } from "next/server";
import { ANON_FREE_RUNS, readOrCreateAnon, readSession } from "@/lib/auth/session";
import { getStore } from "@/lib/ai/store";

export const dynamic = "force-dynamic";

/** Who am I, and how many free anonymous runs are left. */
export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (session) return NextResponse.json({ user: { email: session.email, name: session.name }, freeRunsLeft: null });
  const anon = await readOrCreateAnon(request.cookies);
  const used = anon.setCookie ? 0 : ((await getStore().hgetall(`anon:${anon.anonId}`)).runs ?? 0);
  const response = NextResponse.json({ user: null, freeRunsLeft: Math.max(0, ANON_FREE_RUNS - used) });
  if (anon.setCookie) response.headers.append("Set-Cookie", anon.setCookie);
  return response;
}
