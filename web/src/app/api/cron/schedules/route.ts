import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { runDueSchedules } from "@/lib/schedules/runner";
import { listDueSchedules } from "@/lib/schedules/storage";

/**
 * Hourly cron (see vercel.json). Vercel signs the request with CRON_SECRET;
 * the admin token is accepted too so it can be triggered by hand.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 800;

function cronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (secret && header === `Bearer ${secret}`) return true;
  return adminAuthorized(request);
}

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const now = new Date();
  const due = await listDueSchedules(now);
  const outcomes = await runDueSchedules(due, { concurrency: 2, budgetMs: 700_000 });
  const summary = {
    at: now.toISOString(),
    due: due.length,
    ok: outcomes.filter((o) => typeof o.outcome === "object" && o.outcome.ok).length,
    failed: outcomes.filter((o) => typeof o.outcome === "object" && !o.outcome.ok).length,
    skipped: outcomes.filter((o) => o.outcome === "skipped" || o.outcome === "locked").length,
    outcomes,
  };
  if (summary.failed) console.warn("[cron/schedules]", JSON.stringify(summary));
  return NextResponse.json(summary);
}
