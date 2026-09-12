import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import type { ProjectInput } from "@/lib/projects/project";
import { createProject, getCurrentProjectId, listProjects, setCurrentProject } from "@/lib/projects/storage";

/** The signed-in user's projects (workspace contexts) and which one is active. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in to use projects.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const [projects, current] = await Promise.all([listProjects(session.uid), getCurrentProjectId(session.uid)]);
  return NextResponse.json({ projects, current: projects.some((p) => p.id === current) ? current : null }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const body = (await request.json().catch(() => null)) as ProjectInput | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const result = await createProject(session.uid, body);
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  await setCurrentProject(session.uid, result.id);
  return NextResponse.json({ project: result });
}

/** Switch the active project (null to work without one). */
export async function PUT(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const body = (await request.json().catch(() => null)) as { current?: unknown } | null;
  const current = typeof body?.current === "string" ? body.current : null;
  if (current) {
    const projects = await listProjects(session.uid);
    if (!projects.some((p) => p.id === current)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  await setCurrentProject(session.uid, current);
  return NextResponse.json({ current });
}
