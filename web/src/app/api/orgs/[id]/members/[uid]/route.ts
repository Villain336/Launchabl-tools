import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { changeMemberRole, removeMember } from "@/lib/orgs/org";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; uid: string }> };

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function PATCH(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const { id, uid } = await context.params;
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;
  if (body?.role !== "admin" && body?.role !== "member") return NextResponse.json({ error: "role must be admin or member." }, { status: 400 });
  const result = await changeMemberRole(id, session.uid, uid, body.role);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}

/** Removes a member. A member removing their own uid is treated as leaving the org. */
export async function DELETE(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const { id, uid } = await context.params;
  const result = await removeMember(id, session.uid, uid);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
