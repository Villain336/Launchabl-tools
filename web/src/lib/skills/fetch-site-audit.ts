import type { AuditResult } from "@/lib/site-audit";

export type SiteAuditRow = {
  url: string;
  ok: boolean;
  result?: AuditResult;
  error?: string;
};

export async function requestSiteAudit(input: { url?: string; urls?: string[] }): Promise<SiteAuditRow[]> {
  const res = await fetch("/api/site-audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json()) as { results?: SiteAuditRow[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Could not reach that URL.");
  return data.results ?? [];
}
