import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { createServiceBusinessProfile, getServiceBusinessProfile, updateServiceBusinessProfile, type ServiceBusinessProfileInput } from "@/lib/service-business/profile";

/** The signed-in user's org's service-business profile — trades, service area, licensing, and marketplace/OS knowledge-sharing consent. */

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ org: null, profile: null }, { headers: { "cache-control": "private, no-store" } });
  const profile = await getServiceBusinessProfile(org.id);
  return NextResponse.json({ org, profile }, { headers: { "cache-control": "private, no-store" } });
}

function readInput(body: unknown): ServiceBusinessProfileInput {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    trades: Array.isArray(b.trades) ? (b.trades as ServiceBusinessProfileInput["trades"]) : undefined,
    serviceArea: Array.isArray(b.serviceArea) ? (b.serviceArea as string[]) : undefined,
    address: typeof b.address === "string" ? b.address : undefined,
    phone: typeof b.phone === "string" ? b.phone : undefined,
    licensed: typeof b.licensed === "boolean" ? b.licensed : undefined,
    insured: typeof b.insured === "boolean" ? b.insured : undefined,
    bonded: typeof b.bonded === "boolean" ? b.bonded : undefined,
    gbpUrl: b.gbpUrl === null || typeof b.gbpUrl === "string" ? (b.gbpUrl as string | null) : undefined,
    websiteUrl: b.websiteUrl === null || typeof b.websiteUrl === "string" ? (b.websiteUrl as string | null) : undefined,
    allowKnowledgeSharing: typeof b.allowKnowledgeSharing === "boolean" ? b.allowKnowledgeSharing : undefined,
    leadTier: typeof b.leadTier === "string" ? (b.leadTier as ServiceBusinessProfileInput["leadTier"]) : undefined,
  };
}

/** Upsert: creates the profile if the org doesn't have one yet, otherwise updates it. */
export async function PUT(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });

  const input = readInput(await request.json().catch(() => null));
  const existing = await getServiceBusinessProfile(org.id);
  const result = existing ? await updateServiceBusinessProfile(org.id, session.uid, input) : await createServiceBusinessProfile(org.id, session.uid, input);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ profile: result });
}
