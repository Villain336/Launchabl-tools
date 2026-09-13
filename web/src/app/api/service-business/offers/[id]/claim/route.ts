import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { claimServiceOffer } from "@/lib/service-business/offer";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first." }, { status: 409 });
  const { id } = await params;
  const result = await claimServiceOffer(org.id, session.uid, id);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ offer: result });
}
