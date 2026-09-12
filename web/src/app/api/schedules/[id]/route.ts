import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import type { ScheduleInput } from "@/lib/schedules/schedule";
import { deleteSchedule, updateSchedule } from "@/lib/schedules/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as ScheduleInput | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const result = await updateSchedule(id, session.uid, body);
  if (result === null) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ schedule: result });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await params;
  const ok = await deleteSchedule(id, session.uid);
  return ok ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: "Not found." }, { status: 404 });
}
