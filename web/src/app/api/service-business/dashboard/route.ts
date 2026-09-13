import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { readOsDashboard } from "@/lib/service-business/dashboard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, dashboard: null }, { headers: { "cache-control": "private, no-store" } });
  const dashboard = await readOsDashboard(org.id);
  return NextResponse.json({ org, dashboard }, { headers: { "cache-control": "private, no-store" } });
}
