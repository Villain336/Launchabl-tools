import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createSchedule, listSchedules } from "@/lib/schedules/storage";
import type { ScheduleInput } from "@/lib/schedules/schedule";
import { getToolBySlug } from "@/lib/site-config";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in to see your automations.", cause: "sign_in_required" }, { status: 401 });
  const schedules = await listSchedules(session.uid);
  return NextResponse.json({ schedules, emailEnabled: Boolean(process.env.RESEND_API_KEY) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in to schedule a job.", cause: "sign_in_required" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as ScheduleInput | null;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const slug = typeof body.slug === "string" ? body.slug : "agent";
  if (!(slug === "agent" || getToolBySlug(slug))) return NextResponse.json({ error: "Unknown tool." }, { status: 400 });
  const result = await createSchedule({ uid: session.uid, email: session.email, name: session.name ?? null }, { ...body, slug, email: body.email ?? session.email });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ schedule: result }, { status: 201 });
}
