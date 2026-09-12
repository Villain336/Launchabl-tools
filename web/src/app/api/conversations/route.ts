import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { clearConversationRecords, isConversationId, listConversationRecords, saveConversationRecord } from "@/lib/chat/conversations";
import { isProjectId } from "@/lib/projects/project";
import { getToolBySlug } from "@/lib/site-config";

/** Cross-device conversation history for signed-in users, per tool. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
const knownSlug = (slug: string) => slug === "agent" || Boolean(getToolBySlug(slug));

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!knownSlug(slug)) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  const conversations = await listConversationRecords(session.uid, slug);
  return NextResponse.json({ conversations }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const body = (await request.json().catch(() => null)) as { id?: unknown; slug?: unknown; title?: unknown; messages?: unknown; createdAt?: unknown; updatedAt?: unknown; projectId?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id : "";
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!isConversationId(id) || !knownSlug(slug) || !Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const record = await saveConversationRecord({
    id,
    uid: session.uid,
    slug,
    projectId: typeof body.projectId === "string" && isProjectId(body.projectId) ? body.projectId : null,
    title: typeof body.title === "string" ? body.title.slice(0, 120) : "Conversation",
    messages: body.messages as ToolChatMessage[],
    createdAt: typeof body.createdAt === "number" ? body.createdAt : undefined,
    updatedAt: typeof body.updatedAt === "number" ? body.updatedAt : undefined,
  });
  return NextResponse.json({ id: record.id, updatedAt: record.updatedAt });
}

export async function DELETE(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  if (!knownSlug(slug)) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  await clearConversationRecords(session.uid, slug);
  return NextResponse.json({ ok: true });
}
