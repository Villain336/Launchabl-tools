import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { listLeadsForOrg, updateLead, isLeadStatus } from "@/lib/service-business/lead";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, leads: [] }, { headers: { "cache-control": "private, no-store" } });
  const leads = await listLeadsForOrg(org.id);
  return NextResponse.json({ org, leads }, { headers: { "cache-control": "private, no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  const result = await updateLead(org.id, session.uid, id, {
    status: typeof body?.status === "string" && isLeadStatus(body.status) ? body.status : undefined,
    customerId: typeof body?.customerId === "string" || body?.customerId === null ? (body.customerId as string | null) : undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ lead: result });
}
