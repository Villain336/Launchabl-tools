import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { createReplyDraftAsAdmin, listManagedReplyOrgs, listReadyReplyDrafts } from "@/lib/service-business/reply-queue";

/** Platform-ops: draft a neighborhood reply for a Run org we sit on. */

export const runtime = "nodejs";

function reject(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN to enable admin routes." }, { status: 503 });
  if (!adminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return null;
}

export async function GET(request: NextRequest) {
  const denied = reject(request);
  if (denied) return denied;
  const [orgs, ready] = await Promise.all([listManagedReplyOrgs(), listReadyReplyDrafts()]);
  return NextResponse.json({ orgs, ready }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  const denied = reject(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orgId = typeof body?.orgId === "string" ? body.orgId : "";
  if (!orgId) return NextResponse.json({ error: "orgId is required." }, { status: 400 });
  const actor = typeof body?.actor === "string" && body.actor.trim() ? body.actor.trim() : "admin";
  const result = await createReplyDraftAsAdmin(orgId, actor, body ?? {});
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ draft: result });
}
