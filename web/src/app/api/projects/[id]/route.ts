import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import type { ProjectInput } from "@/lib/projects/project";
import { deleteProject, updateProject } from "@/lib/projects/storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as ProjectInput | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const project = await updateProject(id, session.uid, body);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest, context: Context) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await context.params;
  const removed = await deleteProject(id, session.uid);
  if (!removed) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
