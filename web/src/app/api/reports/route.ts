import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { readSession } from "@/lib/auth/session";
import { getToolBySlug } from "@/lib/site-config";
import { extractReportItems, fitReport, reportTitle, type Report } from "@/lib/reports/extract";
import { newReportId, saveReport } from "@/lib/reports/storage";

/**
 * Freeze a conversation's deliverables into a shareable report.
 * Signed-in accounts only: the report carries the author's name and the
 * link is public, so an anonymous free run can't mint them.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

declare global {
  var __launchablReportLimiter: RateLimiter | undefined;
}

function limiter(): RateLimiter {
  globalThis.__launchablReportLimiter ??= createRateLimiter(
    [
      { name: "reports-burst", limit: 12, windowSeconds: 10 * 60 },
      { name: "reports-daily", limit: 60, windowSeconds: 24 * 60 * 60 },
    ],
    getStore(),
  );
  return globalThis.__launchablReportLimiter;
}

export async function POST(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) {
    return NextResponse.json({ error: "Sign in to share a report.", cause: "sign_in_required" }, { status: 401 });
  }
  const limit = await limiter().check(`${session.uid}:${clientKey(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many reports in a short time. Try again in a few minutes." }, { status: 429, headers: { "retry-after": String(limit.retryAfter) } });
  }

  const body = (await request.json().catch(() => null)) as { slug?: unknown; messages?: unknown; title?: unknown } | null;
  const slug = typeof body?.slug === "string" ? body.slug : "";
  if (!(slug === "agent" || getToolBySlug(slug)) || !Array.isArray(body?.messages)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const items = extractReportItems(body.messages);
  if (!items.some((item) => item.kind === "tool")) {
    return NextResponse.json({ error: "Nothing to share yet — run a tool first so the report has a deliverable." }, { status: 422 });
  }
  const requestedTitle = typeof body.title === "string" ? body.title.trim().slice(0, 90) : "";
  const draft: Report = {
    id: newReportId(),
    slug,
    title: requestedTitle || reportTitle(items),
    ownerUid: session.uid,
    preparedBy: session.name?.trim() || null,
    createdAt: new Date().toISOString(),
    items,
  };
  const report = fitReport(draft);
  if (!report) {
    return NextResponse.json({ error: "This conversation is too large to share as one report. Start a new chat for the next job." }, { status: 413 });
  }
  await saveReport(report);

  return NextResponse.json({ id: report.id, path: `/r/${report.id}`, trimmed: Boolean(report.trimmed), items: report.items.length });
}
