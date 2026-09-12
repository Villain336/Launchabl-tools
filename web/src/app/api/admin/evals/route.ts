import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { EVAL_CASES } from "@/lib/evals/cases";
import { listEvalRuns, loadLatestEvalRun, runEvals } from "@/lib/evals/run";

export const dynamic = "force-dynamic";
// A full run is a dozen real model jobs; give it the longest window the plan allows.
export const maxDuration = 800;

export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN to enable evals." }, { status: 503 });
  if (!adminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const [latest, runs] = await Promise.all([loadLatestEvalRun(), listEvalRuns()]);
  return NextResponse.json({ cases: EVAL_CASES.map(({ id, slug, cost, expectTools }) => ({ id, slug, cost, expectTools })), latest, runs });
}

export async function POST(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN to enable evals." }, { status: 503 });
  if (!adminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown; concurrency?: unknown };
  const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : undefined;
  const concurrency = typeof body.concurrency === "number" ? Math.min(6, Math.max(1, body.concurrency)) : 3;
  const run = await runEvals(ids, { concurrency });
  return NextResponse.json(run);
}
