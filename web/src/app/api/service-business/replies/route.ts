import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createReplyDraft, listReplyQueue } from "@/lib/service-business/reply-queue";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, run: false, canDraft: false, bookingPath: null, drafts: [] }, { headers: { "cache-control": "private, no-store" } });
  const result = await listReplyQueue(org.id, session.uid);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ org, ...result }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await createReplyDraft(org.id, session.uid, body ?? {});
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ draft: result });
}
