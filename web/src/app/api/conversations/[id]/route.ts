import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { deleteConversationRecord, isConversationId } from "@/lib/chat/conversations";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await context.params;
  if (!isConversationId(id)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const removed = await deleteConversationRecord(id, session.uid);
  return NextResponse.json({ ok: removed });
}
