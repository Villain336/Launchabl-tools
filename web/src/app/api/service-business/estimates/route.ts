import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createEstimate, listEstimates, updateEstimate, isEstimateStatus, type EstimateInput } from "@/lib/service-business/estimate";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, estimates: [] }, { headers: { "cache-control": "private, no-store" } });
  const estimates = await listEstimates(org.id);
  return NextResponse.json({ org, estimates }, { headers: { "cache-control": "private, no-store" } });
}

function readEstimateInput(body: unknown): EstimateInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    customerId: typeof b.customerId === "string" ? b.customerId : undefined,
    jobId: typeof b.jobId === "string" || b.jobId === null ? (b.jobId as string | null) : undefined,
    status: typeof b.status === "string" && isEstimateStatus(b.status) ? b.status : undefined,
    aiDrafted: typeof b.aiDrafted === "boolean" ? b.aiDrafted : undefined,
    lineItems: Array.isArray(b.lineItems) ? (b.lineItems as EstimateInput["lineItems"]) : undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
  };
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const result = await createEstimate(org.id, session.uid, readEstimateInput(await request.json().catch(() => null)));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ estimate: result });
}

export async function PATCH(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing estimate id." }, { status: 400 });
  const result = await updateEstimate(org.id, session.uid, id, readEstimateInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ estimate: result });
}
