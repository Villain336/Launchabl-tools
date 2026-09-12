import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { readSession } from "@/lib/auth/session";
import { runSchedule } from "@/lib/schedules/runner";
import { claimSchedule, loadSchedule, releaseSchedule } from "@/lib/schedules/storage";

/** "Run now": executes one automation on demand for its owner. */

export const runtime = "nodejs";
export const maxDuration = 300;

declare global {
  var __launchablScheduleRunLimiter: RateLimiter | undefined;
}

function limiter(): RateLimiter {
  globalThis.__launchablScheduleRunLimiter ??= createRateLimiter(
    [
      { name: "schedule-run-burst", limit: 4, windowSeconds: 10 * 60 },
      { name: "schedule-run-daily", limit: 20, windowSeconds: 24 * 60 * 60 },
    ],
    getStore(),
  );
  return globalThis.__launchablScheduleRunLimiter;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession(request.cookies);
  if (!session) return NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });
  const { id } = await params;
  const schedule = await loadSchedule(id);
  if (!schedule || schedule.ownerUid !== session.uid) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const limit = await limiter().check(`${session.uid}:${clientKey(request.headers)}`);
  if (!limit.ok) return NextResponse.json({ error: "Too many manual runs. Try again in a few minutes." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  if (!(await claimSchedule(id))) return NextResponse.json({ error: "This automation is already running." }, { status: 409 });
  try {
    const outcome = await runSchedule(schedule);
    const updated = await loadSchedule(id);
    return NextResponse.json({ outcome, schedule: updated }, { status: outcome.ok ? 200 : 502 });
  } finally {
    await releaseSchedule(id);
  }
}
