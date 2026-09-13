import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { listKnowledgeNotes, saveKnowledgeNote, type KnowledgeNoteInput } from "@/lib/service-business/knowledge";

/** Knowledge notes for the signed-in user's org — see `lib/service-business/knowledge.ts` for the private-vs-shared-pool distinction. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, notes: [] }, { headers: { "cache-control": "private, no-store" } });
  const notes = await listKnowledgeNotes(org.id);
  return NextResponse.json({ org, notes }, { headers: { "cache-control": "private, no-store" } });
}

function readInput(body: unknown): KnowledgeNoteInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    title: typeof b.title === "string" ? b.title : undefined,
    markdown: typeof b.markdown === "string" ? b.markdown : undefined,
    source: typeof b.source === "string" ? (b.source as KnowledgeNoteInput["source"]) : undefined,
  };
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const result = await saveKnowledgeNote(org.id, session.uid, readInput(await request.json().catch(() => null)));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ note: result });
}
