import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { listOffersForOrg, listOpenOffers } from "@/lib/service-business/offer";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, open: [], mine: [] }, { headers: { "cache-control": "private, no-store" } });
  const [allOpen, mine] = await Promise.all([listOpenOffers(), listOffersForOrg(org.id)]);
  const open = allOpen.filter((offer) => offer.pingedOrgIds.includes(org.id));
  return NextResponse.json({ org, open, mine }, { headers: { "cache-control": "private, no-store" } });
}
