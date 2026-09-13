import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { runDueAutomations } from "@/lib/service-business/automation";

/**
 * Hourly cron for OS automations (lead follow-up, review request, job
 * reminder, warranty). Same auth as `/api/cron/schedules` — CRON_SECRET
 * or the admin token. Distinct from SEO/tool-report schedules.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (secret && header === `Bearer ${secret}`) return true;
  return adminAuthorized(request);
}

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const runs = await runDueAutomations(now);
  const summary = {
    at: now.toISOString(),
    fired: runs.length,
    byKind: {
      lead_followup: runs.filter((run) => run.kind === "lead_followup").length,
      review_request: runs.filter((run) => run.kind === "review_request").length,
      job_reminder: runs.filter((run) => run.kind === "job_reminder").length,
      warranty_reminder: runs.filter((run) => run.kind === "warranty_reminder").length,
    },
  };
  return NextResponse.json(summary);
}
