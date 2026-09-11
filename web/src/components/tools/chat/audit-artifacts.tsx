"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Download, ExternalLink, Gauge, Info, Link2, Link2Off, XCircle } from "lucide-react";
import type { CanonicalReport, CheckStatus } from "@/lib/web/canonical";
import type { LinkReport } from "@/lib/web/links";
import type { PerformanceReport, Severity } from "@/lib/web/performance";
import type { BacklinkReport, BacklinkResult } from "@/lib/web/backlinks";
import { downloadBlob } from "@/lib/download";

/* ── shared bits ─────────────────────────────────────────── */

const tone = {
  good: { text: "text-green", bg: "bg-green-tint", icon: CheckCircle2 },
  warn: { text: "text-orange", bg: "bg-orange-tint", icon: AlertTriangle },
  bad: { text: "text-red", bg: "bg-red-tint", icon: XCircle },
  info: { text: "text-accent-ink", bg: "bg-accent-tint", icon: Info },
  muted: { text: "text-ink-3", bg: "bg-field", icon: Info },
} as const;

type Tone = keyof typeof tone;

function Pill({ t, children }: { t: Tone; children: ReactNode }) {
  return <span className={`inline-flex h-[20px] items-center gap-1 rounded-[5px] px-1.5 text-[11px] font-medium ${tone[t].text} ${tone[t].bg}`}>{children}</span>;
}

function Frame({ icon, title, subtitle, actions, children }: { icon: ReactNode; title: string; subtitle: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-primary">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
          <p className="truncate text-[12px] text-ink-2">{subtitle}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function DownloadButton({ text, filename, mime, label }: { text: string; filename: string; mime: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadBlob(new Blob([text], { type: mime }), filename)}
      className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
    >
      <Download className="h-3 w-3" /> {label}
    </button>
  );
}

function Stat({ label, value, t }: { label: string; value: ReactNode; t?: Tone }) {
  return (
    <div className="rounded-control bg-field px-3 py-2">
      <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
      <p className={`mt-0.5 text-[15px] font-semibold tabular-nums ${t ? tone[t].text : "text-ink"}`}>{value}</p>
    </div>
  );
}

const shorten = (url: string, max = 64) => {
  const s = url.replace(/^https?:\/\//, "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const csvCell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/* ── Canonical ───────────────────────────────────────────── */

const checkTone: Record<CheckStatus, Tone> = { pass: "good", warn: "warn", fail: "bad", info: "info" };

export function CanonicalArtifact({ report }: { report: CanonicalReport }) {
  const verdict: Tone = report.summary.fail ? "bad" : report.summary.warn ? "warn" : "good";
  const verdictLabel = report.summary.fail ? `${report.summary.fail} problem${report.summary.fail > 1 ? "s" : ""}` : report.summary.warn ? `${report.summary.warn} warning${report.summary.warn > 1 ? "s" : ""}` : "All checks passed";
  return (
    <Frame
      icon={<Link2 className="h-4 w-4" />}
      title="Canonical audit"
      subtitle={shorten(report.finalUrl, 90)}
      actions={<Pill t={verdict}>{verdictLabel}</Pill>}
    >
      <div className="grid gap-2 border-b border-line px-4 py-3 sm:grid-cols-3">
        <Stat label="Declared canonical" value={<span className="block truncate font-mono text-[12.5px]" title={report.effectiveCanonical ?? ""}>{report.effectiveCanonical ? shorten(report.effectiveCanonical, 40) : "none"}</span>} t={report.effectiveCanonical ? undefined : "bad"} />
        <Stat label="Source" value={report.htmlCanonicals.length ? `HTML${report.headerCanonical ? " + header" : ""}` : report.headerCanonical ? "HTTP header" : "—"} />
        <Stat label="Passed" value={`${report.summary.pass} / ${report.checks.filter((c) => c.status !== "info").length}`} t={verdict} />
      </div>

      <ul className="divide-y divide-line">
        {report.checks.map((check) => {
          const T = tone[checkTone[check.status]];
          const Icon = T.icon;
          return (
            <li key={check.id} className="flex gap-3 px-4 py-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${T.text}`} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-ink">{check.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed break-words text-ink-2">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-line px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Recommended tag</p>
          <CopyButton text={report.recommendedTag} />
        </div>
        <pre className="mt-1.5 overflow-x-auto rounded-control bg-field px-3 py-2 font-mono text-[12px] text-ink">{report.recommendedTag}</pre>
      </div>
    </Frame>
  );
}

/* ── Links ───────────────────────────────────────────────── */

export function linksToCsv(report: LinkReport): string {
  const rows = [["url", "anchor", "kind", "status", "result", "occurrences", "suggested_fix", "fix_reason"]];
  for (const l of report.links) {
    rows.push([l.url, l.anchor, l.kind, l.status ?? l.error ?? "", !l.ok ? "broken" : l.redirectedTo ? "redirect" : "ok", l.occurrences, l.suggestions[0]?.url ?? l.redirectedTo ?? "", l.suggestions[0]?.reason ?? ""].map(csvCell));
  }
  return rows.map((r) => r.join(",")).join("\n");
}

export function LinksArtifact({ report }: { report: LinkReport }) {
  const [showOk, setShowOk] = useState(false);
  const visible = report.links.filter((l) => showOk || !l.ok || l.redirectedTo);
  const replaceList = report.links
    .filter((l) => (!l.ok && l.suggestions[0]) || l.redirectedTo)
    .map((l) => `${l.url} → ${l.suggestions[0]?.url ?? l.redirectedTo}`)
    .join("\n");
  const host = new URL(report.finalUrl).hostname;

  return (
    <Frame
      icon={report.totals.broken ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      title="Link check"
      subtitle={`${shorten(report.finalUrl, 70)} · ${report.totals.checked} checked${report.totals.skipped ? ` · ${report.totals.skipped} skipped` : ""}`}
      actions={
        <>
          {replaceList && <CopyButton text={replaceList} label="Copy fixes" />}
          <DownloadButton text={linksToCsv(report)} filename={`links-${host}.csv`} mime="text/csv" label="CSV" />
        </>
      }
    >
      <div className="grid grid-cols-3 gap-2 border-b border-line px-4 py-3">
        <Stat label="Broken" value={report.totals.broken} t={report.totals.broken ? "bad" : "good"} />
        <Stat label="Redirecting" value={report.totals.redirected} t={report.totals.redirected ? "warn" : undefined} />
        <Stat label="Healthy" value={report.totals.ok - report.totals.redirected} t="good" />
      </div>

      {visible.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-ink-2">Every link on this page resolves cleanly.</p>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((l) => {
            const t: Tone = !l.ok ? "bad" : l.redirectedTo ? "warn" : "good";
            return (
              <li key={l.url} className="px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill t={t}>{l.status ?? l.error ?? "—"}</Pill>
                  <Pill t="muted">{l.kind}</Pill>
                  {l.occurrences > 1 && <Pill t="muted">×{l.occurrences}</Pill>}
                  <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink hover:underline" title={l.url}>
                    {shorten(l.url, 80)}
                  </a>
                </div>
                {l.anchor && <p className="mt-1 text-[12px] text-ink-3">Anchor: “{l.anchor}”</p>}
                {(l.suggestions.length > 0 || l.redirectedTo) && (
                  <div className="mt-1.5 space-y-1">
                    {(l.suggestions.length ? l.suggestions : [{ url: l.redirectedTo!, reason: "Redirect destination", verified: true }]).map((s) => (
                      <div key={s.url} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                        <span className="text-ink-3">→</span>
                        <a href={s.url} target="_blank" rel="noreferrer" className="min-w-0 truncate font-mono text-green hover:underline" title={s.url}>
                          {shorten(s.url, 70)}
                        </a>
                        <span className="text-ink-3">{s.reason}{s.verified ? " · verified live" : " · unverified"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {report.totals.ok - report.totals.redirected > 0 && (
        <button type="button" onClick={() => setShowOk((v) => !v)} className="w-full border-t border-line px-4 py-2 text-[12px] font-medium text-ink-3 hover:bg-hover hover:text-ink">
          {showOk ? "Hide" : "Show"} {report.totals.ok - report.totals.redirected} healthy links
        </button>
      )}
    </Frame>
  );
}

/* ── Performance ─────────────────────────────────────────── */

const severityTone: Record<Severity, Tone> = { high: "bad", medium: "warn", low: "info", pass: "good" };

function ScoreRing({ score }: { score: number }) {
  const t: Tone = score >= 85 ? "good" : score >= 60 ? "warn" : "bad";
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-line" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} className={`${tone[t].text}`} stroke="currentColor" />
      </svg>
      <span className={`text-[16px] font-semibold tabular-nums ${tone[t].text}`}>{score}</span>
    </div>
  );
}

export function PerformanceArtifact({ report }: { report: PerformanceReport }) {
  const [showPass, setShowPass] = useState(false);
  const issues = report.findings.filter((f) => f.severity !== "pass");
  const passes = report.findings.filter((f) => f.severity === "pass");
  const json = JSON.stringify(report, null, 2);
  return (
    <Frame
      icon={<Gauge className="h-4 w-4" />}
      title="Page speed audit"
      subtitle={`${shorten(report.finalUrl, 70)} · static analysis, not a Lighthouse run`}
      actions={<DownloadButton text={json} filename="page-speed-audit.json" mime="application/json" label="JSON" />}
    >
      <div className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3">
        <ScoreRing score={report.score} />
        <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="First byte" value={`${report.timing.ttfbMs} ms`} t={report.timing.ttfbMs > 1200 ? "bad" : report.timing.ttfbMs > 600 ? "warn" : "good"} />
          <Stat label="HTML" value={`${report.document.htmlKb} KB`} />
          <Stat
            label={report.scripts.measuredKb !== null && report.scripts.measuredFiles < report.scripts.total ? `JavaScript · ${report.scripts.measuredFiles}/${report.scripts.total} files` : "JavaScript"}
            value={report.scripts.measuredKb !== null ? `${Math.round(report.scripts.measuredKb)} KB` : `${report.scripts.total} files`}
            t={report.scripts.blocking ? "warn" : undefined}
          />
          <Stat label="3rd parties" value={report.thirdParties.length} t={report.thirdParties.length > 8 ? "bad" : report.thirdParties.length > 4 ? "warn" : undefined} />
        </div>
      </div>

      <ul className="divide-y divide-line">
        {(showPass ? report.findings : issues).map((f) => {
          const T = tone[severityTone[f.severity]];
          const Icon = T.icon;
          return (
            <li key={f.id} className="flex gap-3 px-4 py-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${T.text}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-medium text-ink">{f.title}</p>
                  {f.severity !== "pass" && <Pill t={severityTone[f.severity]}>{f.severity}</Pill>}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed break-words text-ink-2">{f.detail}</p>
                {f.fix && <p className="mt-1 text-[12.5px] leading-relaxed text-ink"><span className="font-medium">Fix:</span> {f.fix}</p>}
              </div>
            </li>
          );
        })}
        {issues.length === 0 && <li className="px-4 py-6 text-center text-[13px] text-ink-2">Nothing to fix from a static read — run a real-user test to confirm.</li>}
      </ul>

      {passes.length > 0 && (
        <button type="button" onClick={() => setShowPass((v) => !v)} className="w-full border-t border-line px-4 py-2 text-[12px] font-medium text-ink-3 hover:bg-hover hover:text-ink">
          {showPass ? "Hide" : "Show"} {passes.length} passing check{passes.length > 1 ? "s" : ""}
        </button>
      )}
    </Frame>
  );
}

/* ── Backlinks ───────────────────────────────────────────── */

const verdictMeta: Record<BacklinkResult["verdict"], { t: Tone; label: string }> = {
  live: { t: "good", label: "Live · follow" },
  nofollow: { t: "warn", label: "Live · nofollow" },
  "domain-only": { t: "info", label: "Links to domain only" },
  missing: { t: "bad", label: "Link missing" },
  unreachable: { t: "bad", label: "Page unreachable" },
};

export function backlinksToCsv(report: BacklinkReport): string {
  const rows = [["referrer", "status", "verdict", "anchor", "href", "rel", "indexable", "canonical_mismatch"]];
  for (const r of report.results) {
    if (r.links.length === 0) rows.push([r.referrer, r.status ?? r.error ?? "", r.verdict, "", "", "", r.indexable === null ? "" : String(r.indexable), String(r.canonicalMismatch)].map(csvCell));
    for (const l of r.links) rows.push([r.referrer, r.status ?? "", r.verdict, l.anchor, l.href, l.rel ?? "", r.indexable === null ? "" : String(r.indexable), String(r.canonicalMismatch)].map(csvCell));
  }
  return rows.map((r) => r.join(",")).join("\n");
}

export function BacklinksArtifact({ report }: { report: BacklinkReport }) {
  return (
    <Frame
      icon={<ExternalLink className="h-4 w-4" />}
      title="Backlink health"
      subtitle={`${report.summary.checked} referring page${report.summary.checked === 1 ? "" : "s"} checked for links to ${report.targetHost}${report.summary.skipped ? ` · ${report.summary.skipped} skipped (20 max)` : ""}`}
      actions={<DownloadButton text={backlinksToCsv(report)} filename={`backlinks-${report.targetHost}.csv`} mime="text/csv" label="CSV" />}
    >
      <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3 sm:grid-cols-4">
        <Stat label="Live · follow" value={report.summary.live} t="good" />
        <Stat label="Nofollow" value={report.summary.nofollow} t={report.summary.nofollow ? "warn" : undefined} />
        <Stat label="Domain only" value={report.summary.domainOnly} t={report.summary.domainOnly ? "info" : undefined} />
        <Stat label="Missing / gone" value={report.summary.missing + report.summary.unreachable} t={report.summary.missing + report.summary.unreachable ? "bad" : undefined} />
      </div>
      <ul className="divide-y divide-line">
        {report.results.map((r) => {
          const v = verdictMeta[r.verdict];
          return (
            <li key={r.referrer} className="px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill t={v.t}>{v.label}</Pill>
                {r.status !== null && <Pill t="muted">{r.status}</Pill>}
                {r.indexable === false && <Pill t="warn">noindex</Pill>}
                {r.canonicalMismatch && <Pill t="warn">canonical elsewhere</Pill>}
                <a href={r.referrer} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink hover:underline" title={r.referrer}>
                  {shorten(r.referrer, 80)}
                </a>
              </div>
              {r.title && <p className="mt-1 truncate text-[12px] text-ink-3">{r.title}</p>}
              {r.error && <p className="mt-1 text-[12px] text-red">{r.error}</p>}
              {r.links.slice(0, 4).map((l, i) => (
                <div key={`${l.href}-${i}`} className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px]">
                  <span className="text-ink-3">→</span>
                  <span className="text-ink">“{l.anchor}”</span>
                  <span className="min-w-0 truncate font-mono text-ink-3" title={l.href}>{shorten(l.href, 50)}</span>
                  {l.rel && <Pill t={l.follow ? "muted" : "warn"}>rel={l.rel}</Pill>}
                </div>
              ))}
              {r.links.length > 4 && <p className="mt-1 text-[12px] text-ink-3">+{r.links.length - 4} more links to {report.targetHost}</p>}
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}
