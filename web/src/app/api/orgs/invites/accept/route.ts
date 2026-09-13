import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { acceptInvite } from "@/lib/orgs/org";

export const runtime = "nodejs";

/** The signed-in user claims a pending org invite by token. */
export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const result = await acceptInvite(token, session.uid);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ org: result.org });
}
