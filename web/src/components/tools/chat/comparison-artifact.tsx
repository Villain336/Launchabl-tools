"use client";

import { Fragment, useState } from "react";
import { Crown, Download, Swords } from "lucide-react";
import type { ComparedSite, CompareMetric, CompareValue, ComparisonReport } from "@/lib/web/compare-sites";
import { downloadBlob } from "@/lib/download";
import { ArtifactHeader, Footnote, Pill, ScoreRing, shorten, Tabs } from "@/components/tools/chat/bits";
import { AgencyUpsell } from "@/components/tools/chat/agency-upsell";

const host = (site: ComparedSite) => {
  try {
    return new URL(site.finalUrl ?? site.requestedUrl).hostname.replace(/^www\./, "");
  } catch {
    return site.requestedUrl;
  }
};

function format(value: CompareValue, metric: CompareMetric): string {
  if (value === null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return `${value.toLocaleString()}${metric.unit ?? ""}`;
}

export function comparisonToCsv(report: ComparisonReport): string {
  const head = ["Metric", ...report.sites.map(host)];
  const rows = report.metrics.map((m) => [m.label, ...report.sites.map((s) => format(s.values[m.key], m))]);
  return [head, ...rows].map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
}

export function ComparisonArtifact({ report }: { report: ComparisonReport }) {
  const [view, setView] = useState<"table" | "gaps">("table");
  const yours = report.sites[0];
  const groups = Array.from(new Set(report.metrics.map((m) => m.group)));
  const okSites = report.sites.filter((s) => s.ok).length;

  return (
    <>
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <ArtifactHeader icon={<Swords className="h-4 w-4" />} title="Competitor gap report" subtitle={`${report.sites.length} pages · ${okSites} fetched · you lead on ${report.wins.length} of ${report.metrics.length} signals`}>
        <Tabs value={view} onChange={setView} options={[{ key: "table", label: "Side by side" }, { key: "gaps", label: `Gaps (${report.gaps.length})` }]} />
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([comparisonToCsv(report)], { type: "text/csv" }), `competitor-gap-${host(yours)}.csv`)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> CSV
        </button>
      </ArtifactHeader>

      <div className="grid gap-2 border-b border-line px-4 py-3" style={{ gridTemplateColumns: `repeat(${report.sites.length}, minmax(0, 1fr))` }}>
        {report.sites.map((site, i) => (
          <div key={site.requestedUrl} className={`flex items-center gap-2 rounded-control px-2.5 py-2 ${i === 0 ? "bg-accent-tint" : "bg-field"}`}>
            {site.ok && typeof site.values.score === "number" ? <ScoreRing score={site.values.score} size={40} /> : <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-tint text-[11px] font-medium text-red">n/a</div>}
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-ink" title={site.finalUrl ?? site.requestedUrl}>
                {i === 0 ? "You · " : ""}
                {host(site)}
              </p>
              <p className="truncate text-[11.5px] text-ink-2" title={site.title ?? undefined}>
                {site.ok ? (site.title ?? shorten(site.finalUrl ?? site.requestedUrl, 40)) : site.error}
              </p>
            </div>
          </div>
        ))}
      </div>

      {view === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <tbody>
              {groups.map((group) => (
                <Fragment key={group}>
                  <tr>
                    <td colSpan={report.sites.length + 1} className="bg-field/60 px-4 py-1.5 text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
                      {group}
                    </td>
                  </tr>
                  {report.metrics
                    .filter((m) => m.group === group)
                    .map((m) => {
                      const leader = report.leaders[m.key] ?? null;
                      return (
                        <tr key={m.key} className="border-t border-line">
                          <td className="px-4 py-2 text-ink-2">{m.label}</td>
                          {report.sites.map((site, i) => {
                            const v = site.values[m.key];
                            const isLeader = leader === i;
                            return (
                              <td key={site.requestedUrl} className={`px-3 py-2 text-right tabular-nums ${isLeader ? "font-semibold text-green" : "text-ink"} ${i === 0 ? "bg-accent-tint/40" : ""}`}>
                                <span className="inline-flex items-center gap-1">
                                  {isLeader && <Crown className="h-3 w-3" />}
                                  {format(v, m)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </Fragment>
              ))}
              <tr className="border-t border-line">
                <td className="px-4 py-2 text-ink-2">Schema types</td>
                {report.sites.map((site, i) => (
                  <td key={site.requestedUrl} className={`px-3 py-2 text-right text-[11.5px] text-ink ${i === 0 ? "bg-accent-tint/40" : ""}`}>
                    {site.schemaTypes.length ? site.schemaTypes.slice(0, 4).join(", ") + (site.schemaTypes.length > 4 ? "…" : "") : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line">
                <td className="px-4 py-2 text-ink-2">Top terms</td>
                {report.sites.map((site, i) => (
                  <td key={site.requestedUrl} className={`px-3 py-2 text-right text-[11.5px] text-ink ${i === 0 ? "bg-accent-tint/40" : ""}`}>
                    {site.keywords.length ? site.keywords.slice(0, 5).join(", ") : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {report.gaps.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-ink-2">{yours.ok ? "You lead or tie on every measured signal." : "Your page couldn't be fetched, so gaps can't be computed."}</p>
          ) : (
            <ul className="divide-y divide-line">
              {report.gaps.map((gap) => {
                const metric = report.metrics.find((m) => m.key === gap.key)!;
                return (
                  <li key={gap.key} className="flex items-center gap-3 px-4 py-2.5">
                    <Pill t="bad">behind</Pill>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink">{gap.label}</p>
                      <p className="text-[12px] text-ink-2">
                        You: {format(gap.yours, metric)} · Best: {format(gap.best, metric)} ({host(report.sites[gap.leader])})
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {report.missingKeywords.length > 0 && (
            <div className="border-t border-line px-4 py-3">
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Terms competitors use that you don&apos;t</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {report.missingKeywords.map((kw) => (
                  <span key={kw} className="rounded-control bg-field px-2 py-0.5 text-[12px] text-ink">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {yours.failing.length > 0 && (
            <div className="border-t border-line px-4 py-3">
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Your failing checks</p>
              <p className="mt-1 text-[12.5px] text-ink-2">{yours.failing.join(" · ")}</p>
            </div>
          )}
        </div>
      )}
      <Footnote icon={<Crown className="h-3 w-3" />}>Crown marks the leader per row. Same-type pages compare fairly; a homepage against a blog post doesn&apos;t.</Footnote>
    </div>
    <AgencyUpsell issues={report.gaps.length} noun="gap" />
    </>
  );
}
