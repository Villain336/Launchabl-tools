import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createOrg, getOrgForUser, listMembers, listPendingInvites } from "@/lib/orgs/org";

/** The signed-in user's org (team account), their role in it, and — for owners/admins — its members and pending invites. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, role: null, members: [], pendingInvites: [] }, { headers: { "cache-control": "private, no-store" } });
  const members = await listMembers(org.id);
  const role = members.find((m) => m.uid === session.uid)?.role ?? null;
  const pendingInvites = role === "owner" || role === "admin" ? await listPendingInvites(org.id) : [];
  return NextResponse.json({ org, role, members, pendingInvites }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const result = await createOrg(session.uid, name);
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json({ org: result, role: "owner" as const });
}
