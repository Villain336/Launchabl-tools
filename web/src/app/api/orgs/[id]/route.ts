import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { deleteOrg, renameOrg } from "@/lib/orgs/org";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function PATCH(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name : "";
  const result = await renameOrg(id, session.uid, name);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ org: result });
}

export async function DELETE(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const { id } = await context.params;
  const result = await deleteOrg(id, session.uid);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
