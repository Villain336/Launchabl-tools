/**
 * Shared shape for checklist-style page audits (voice search, compliance,
 * LLM readability). One report type → one artifact renderer.
 */

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export type Check = {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
  /** Concrete change a developer can make. Omitted for passes and informational rows. */
  fix?: string;
  /** Optional grouping label shown as a section in the artifact. */
  group?: string;
};

export type ChecklistReport = {
  kind: "voice-search" | "compliance" | "llm-readability" | "landing-page" | "website-audit" | "dns-email" | "security-headers" | "accessibility" | "ssl";
  requestedUrl: string;
  finalUrl: string;
  status: number;
  title: string | null;
  checks: Check[];
  summary: { pass: number; warn: number; fail: number; info: number };
  /** 0–100 heuristic: every non-info check counts, fails cost more than warnings. */
  score: number;
  /** Key facts the model can quote, kept small on purpose. */
  facts: Record<string, string | number | boolean | null>;
};

const STATUS_ORDER: Record<CheckStatus, number> = { fail: 0, warn: 1, info: 2, pass: 3 };

export function finalizeChecklist(
  base: Omit<ChecklistReport, "checks" | "summary" | "score">,
  checks: Check[],
): ChecklistReport {
  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const check of checks) summary[check.status] += 1;
  const scored = summary.pass + summary.warn + summary.fail;
  const score = scored === 0 ? 100 : Math.round(((summary.pass + summary.warn * 0.4) / scored) * 100);
  const sorted = [...checks].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  return { ...base, checks: sorted, summary, score };
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
