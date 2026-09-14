import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { actOnReplyDraft, type ReplyAction } from "@/lib/service-business/reply-queue";

export const runtime = "nodejs";

const ACTIONS = new Set<ReplyAction>(["copied", "sent", "skipped"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { action?: unknown } | null;
  const action = body?.action;
  if (typeof action !== "string" || !ACTIONS.has(action as ReplyAction)) {
    return NextResponse.json({ error: "Mark it copied, sent, or skipped." }, { status: 400 });
  }
  const result = await actOnReplyDraft(org.id, session.uid, id, action as ReplyAction);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ draft: result });
}
