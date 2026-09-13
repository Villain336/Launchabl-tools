import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createJob, createJobFromLead, listJobs, updateJob, isJobStatus, type JobInput } from "@/lib/service-business/job";
import { isTrade } from "@/lib/service-business/profile";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, jobs: [] }, { headers: { "cache-control": "private, no-store" } });
  const jobs = await listJobs(org.id);
  return NextResponse.json({ org, jobs }, { headers: { "cache-control": "private, no-store" } });
}

function readJobInput(body: unknown): JobInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    customerId: typeof b.customerId === "string" ? b.customerId : undefined,
    leadId: typeof b.leadId === "string" || b.leadId === null ? (b.leadId as string | null) : undefined,
    title: typeof b.title === "string" ? b.title : undefined,
    serviceType: typeof b.serviceType === "string" && isTrade(b.serviceType) ? b.serviceType : undefined,
    status: typeof b.status === "string" && isJobStatus(b.status) ? b.status : undefined,
    assignedUid: typeof b.assignedUid === "string" || b.assignedUid === null ? (b.assignedUid as string | null) : undefined,
    scheduledFor: typeof b.scheduledFor === "string" || b.scheduledFor === null ? (b.scheduledFor as string | null) : undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
    estimateId: typeof b.estimateId === "string" || b.estimateId === null ? (b.estimateId as string | null) : undefined,
    durationMinutes: typeof b.durationMinutes === "number" ? b.durationMinutes : Number(b.durationMinutes) || undefined,
    driveMinutes: typeof b.driveMinutes === "number" ? b.driveMinutes : b.driveMinutes !== undefined ? Number(b.driveMinutes) : undefined,
    address: typeof b.address === "string" ? b.address : undefined,
    allowOverlap: typeof b.allowOverlap === "boolean" ? b.allowOverlap : undefined,
  };
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (typeof body?.fromLead === "string") {
    const result = await createJobFromLead(org.id, session.uid, body.fromLead);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ job: result });
  }
  const result = await createJob(org.id, session.uid, readJobInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ job: result });
}

export async function PATCH(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing job id." }, { status: 400 });
  const result = await updateJob(org.id, session.uid, id, readJobInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ job: result });
}
