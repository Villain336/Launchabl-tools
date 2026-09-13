import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { quoteServiceOffer } from "@/lib/service-business/offer";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first." }, { status: 409 });
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await quoteServiceOffer(org.id, session.uid, id, {
    description: typeof body?.description === "string" ? body.description : undefined,
    amountCents: typeof body?.amountCents === "number" ? body.amountCents : Number(body?.amountCents),
    notes: typeof body?.notes === "string" ? body.notes : undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ offer: result });
}
