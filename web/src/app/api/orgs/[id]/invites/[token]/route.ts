import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { revokeInvite } from "@/lib/orgs/org";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; token: string }> };

export async function DELETE(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id, token } = await context.params;
  const result = await revokeInvite(id, session.uid, token);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
