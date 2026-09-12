/**
 * Report persistence: the shared key-value store with a 90-day TTL.
 * Records are kept under ~800 KB (see `fitReport`) so they fit a single
 * Redis value.
 */

import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { REPORT_TTL_SECONDS, type Report } from "@/lib/reports/extract";

export function newReportId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Buffer.from(bytes).toString("base64url");
}

export const isReportId = (id: string) => /^[A-Za-z0-9_-]{12}$/.test(id);

export async function saveReport(report: Report, store: KeyValueStore = getStore()): Promise<void> {
  await store.set(`report:${report.id}`, JSON.stringify(report), REPORT_TTL_SECONDS);
  await store.sadd(`user:${report.ownerUid}:reports`, report.id, REPORT_TTL_SECONDS);
  const day = report.createdAt.slice(0, 10);
  await store.hincrby(`reports:${day}`, { created: 1, [`tool:${report.slug}`]: 1 }, 400 * 24 * 60 * 60);
}

export async function loadReport(id: string, store: KeyValueStore = getStore()): Promise<Report | null> {
  if (!isReportId(id)) return null;
  const raw = await store.get(`report:${id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Report;
    return parsed && Array.isArray(parsed.items) ? parsed : null;
  } catch {
    return null;
  }
}

export type ReportSummary = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
  items: number;
  views: number;
};

/**
 * The signed-in user's reports, newest first. Ids whose record has expired
 * are pruned from the index as a side effect so the list stays honest.
 */
export async function listReports(uid: string, store: KeyValueStore = getStore()): Promise<ReportSummary[]> {
  const ids = await store.smembers(`user:${uid}:reports`);
  const out: ReportSummary[] = [];
  for (const id of ids) {
    const report = await loadReport(id, store);
    if (!report || report.ownerUid !== uid) {
      await store.srem(`user:${uid}:reports`, id);
      continue;
    }
    const views = (await store.hgetall(`reportviews:${id}`)).views ?? 0;
    out.push({
      id: report.id,
      slug: report.slug,
      title: report.title,
      createdAt: report.createdAt,
      items: report.items.filter((item) => item.kind === "tool").length,
      views,
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Delete a report the caller owns. Returns false when it's missing or belongs to someone else. */
export async function deleteReport(id: string, uid: string, store: KeyValueStore = getStore()): Promise<boolean> {
  const report = await loadReport(id, store);
  if (!report || report.ownerUid !== uid) return false;
  await store.del(`report:${id}`);
  await store.del(`reportviews:${id}`);
  await store.srem(`user:${uid}:reports`, id);
  return true;
}

/** Record a view; used by the admin dashboard to see which reports travel. */
export async function recordReportView(id: string, store: KeyValueStore = getStore()): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await store.hincrby(`reports:${day}`, { views: 1 }, 400 * 24 * 60 * 60);
  await store.hincrby(`reportviews:${id}`, { views: 1 }, REPORT_TTL_SECONDS);
}

export async function reportStats(days: number, store: KeyValueStore = getStore()): Promise<{ created: number; views: number; byTool: Record<string, number> }> {
  let created = 0;
  let views = 0;
  const byTool: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const h = await store.hgetall(`reports:${date}`);
    created += h.created ?? 0;
    views += h.views ?? 0;
    for (const [field, value] of Object.entries(h)) {
      if (field.startsWith("tool:")) byTool[field.slice(5)] = (byTool[field.slice(5)] ?? 0) + value;
    }
  }
  return { created, views, byTool };
}
