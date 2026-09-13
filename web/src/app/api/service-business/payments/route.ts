import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { isPaymentMethod, isPaymentStatus, listPayments, recordPayment } from "@/lib/service-business/payment";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, payments: [] }, { headers: { "cache-control": "private, no-store" } });
  const payments = await listPayments(org.id);
  return NextResponse.json({ org, payments }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await recordPayment(org.id, session.uid, {
    jobId: typeof body?.jobId === "string" ? body.jobId : undefined,
    amountCents: typeof body?.amountCents === "number" ? body.amountCents : Number(body?.amountCents),
    method: typeof body?.method === "string" && isPaymentMethod(body.method) ? body.method : undefined,
    status: typeof body?.status === "string" && isPaymentStatus(body.status) ? body.status : undefined,
    note: typeof body?.note === "string" ? body.note : undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ payment: result });
}
