import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createWarranty, listWarranties, updateWarranty, type WarrantyInput } from "@/lib/service-business/warranty";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

function readInput(body: unknown): WarrantyInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    customerId: typeof b.customerId === "string" ? b.customerId : undefined,
    jobId: typeof b.jobId === "string" || b.jobId === null ? (b.jobId as string | null) : undefined,
    coverage: typeof b.coverage === "string" ? b.coverage : undefined,
    startOn: typeof b.startOn === "string" ? b.startOn : undefined,
    endOn: typeof b.endOn === "string" ? b.endOn : undefined,
    reminderDaysBefore: typeof b.reminderDaysBefore === "number" ? b.reminderDaysBefore : Number(b.reminderDaysBefore) || undefined,
    notes: typeof b.notes === "string" ? b.notes : undefined,
  };
}

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, warranties: [] }, { headers: { "cache-control": "private, no-store" } });
  const warranties = await listWarranties(org.id);
  return NextResponse.json({ org, warranties }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const result = await createWarranty(org.id, session.uid, readInput(await request.json().catch(() => null)));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ warranty: result });
}

export async function PATCH(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing warranty id." }, { status: 400 });
  const result = await updateWarranty(org.id, session.uid, id, readInput(body));
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ warranty: result });
}
