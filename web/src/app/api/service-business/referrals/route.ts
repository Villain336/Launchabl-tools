import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { listFoundingReferrals, recordFoundingReferral } from "@/lib/service-business/founding-referral";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, referrals: [] }, { headers: { "cache-control": "private, no-store" } });
  const referrals = await listFoundingReferrals(org.id);
  return NextResponse.json({ org, referrals }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await recordFoundingReferral(org.id, session.uid, body ?? {});
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ referral: result });
}
