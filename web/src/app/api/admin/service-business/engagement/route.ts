import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { isEngagementType, setEngagementType } from "@/lib/service-business/profile";

/** Platform-ops only (§26.4): flips an account between self-serve and Launchabl-managed delivery. Never exposed to org members — see `setEngagementType`'s doc comment. */

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN to enable admin routes." }, { status: 503 });
  if (!adminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { orgId?: unknown; engagementType?: unknown; actor?: unknown } | null;
  const orgId = typeof body?.orgId === "string" ? body.orgId : "";
  const engagementType = body?.engagementType;
  const actor = typeof body?.actor === "string" && body.actor.trim() ? body.actor.trim() : "admin";
  if (!orgId) return NextResponse.json({ error: "orgId is required." }, { status: 400 });
  if (!isEngagementType(engagementType)) return NextResponse.json({ error: "engagementType must be 'self-serve' or 'managed'." }, { status: 400 });

  const result = await setEngagementType(orgId, actor, engagementType);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ profile: result });
}
