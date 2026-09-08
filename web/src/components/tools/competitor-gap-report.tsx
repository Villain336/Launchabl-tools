"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import type { AuditResult } from "@/lib/site-audit";
import { downloadBlob } from "@/lib/download";
import { liveFetchSource, sourcesFromLog } from "@/lib/deliverable";
import { requestSiteAudit, type SiteAuditRow } from "@/lib/skills/fetch-site-audit";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";
import { extractUrls } from "@/lib/studio-triggers";

const metrics: { key: keyof AuditResult; label: string; format: (v: unknown) => string }[] = [
  { key: "score", label: "Overall score", format: (v) => `${v}/100` },
  { key: "wordCount", label: "Word count", format: (v) => String(v) },
  { key: "loadTimeMs", label: "Load time", format: (v) => `${v}ms` },
  { key: "schemaTypes", label: "Schema types found", format: (v) => (Array.isArray(v) && v.length ? v.join(", ") : "None") },
  { key: "h1Count", label: "H1 count", format: (v) => String(v) },
];

export function CompetitorGapReport() {
  const delivery = useDeliveryRunOrThrow();
  const [you, setYou] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const rows = (delivery.output as SiteAuditRow[] | null) ?? null;
  const found = extractUrls(delivery.brief);
  const filledYou = you || found[0] || "";
  const filledCompetitors = competitors.map((value, index) => value || found[index + 1] || "");

  const start = async () => {
    const urls = [filledYou, ...filledCompetitors].map((u) => u.trim()).filter(Boolean);
    if (urls.length < 2) return;
    let nextRows: SiteAuditRow[] = [];
    await delivery.runScan(
      async (skill) => {
        if (skill.id === "fetch-competitors") {
          nextRows = await requestSiteAudit({ urls });
          const ok = nextRows.filter((row) => row.ok && row.result);
          if (ok.length === 0) throw new Error("Could not fetch those URLs.");
          return {
            payload: nextRows,
            sources: ok.map((row) => liveFetchSource(row.result!.url, row.result!.fetchedAt)),
            detail: `${ok.length} site(s)`,
          };
        }
        const ok = nextRows.filter((row) => row.ok && row.result);
        const sources = ok.map((row) => liveFetchSource(row.result!.url, row.result!.fetchedAt));
        if (skill.id === "score-page") {
          return { payload: ok.map((row) => row.result!.score), sources, detail: "Same signals, side by side" };
        }
        if (skill.id === "cite-source") {
          if (sources.length === 0) throw new Error("No live fetch to cite.");
          return { sources, detail: "Sourced from live fetch" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: nextRows,
        deliverable: {
          kind: "report",
          title: "Competitor gap",
          artifacts: [{ name: "competitor-gap.txt", mime: "text/plain", text: gapText(nextRows) }],
          sources: sourcesFromLog(log),
          warnings: nextRows.filter((row) => !row.ok).map((row) => `${row.url}: ${row.error ?? "failed"}`),
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
        <div className="space-y-3">
          <input
            value={filledYou}
            onChange={(e) => setYou(e.target.value)}
            placeholder="Your URL — https://yourbrand.com"
            className="w-full rounded-lg border-2 border-indigo-200 px-3 py-2 text-sm outline-none focus:border-ring"
          />
          {filledCompetitors.map((c, i) => (
            <input
              key={i}
              value={c}
              onChange={(e) => {
                const next = [...competitors];
                next[i] = e.target.value;
                setCompetitors(next);
              }}
              placeholder={`Competitor ${i + 1} URL (optional)`}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          ))}
          <Button onClick={start} disabled={delivery.scanning}>
            Compare
          </Button>
        </div>
      }
      review={
        rows ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border py-2 pr-4 text-left font-medium text-muted-foreground">Metric</th>
                  {rows.map((r) => (
                    <th key={r.url} className="border-b border-border py-2 pr-4 text-left font-medium text-foreground">
                      {r.ok && r.result ? new URL(r.result.url).hostname : r.url}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.key}>
                    <td className="border-b border-slate-100 py-2 pr-4 text-muted-foreground">{m.label}</td>
                    {rows.map((r) => (
                      <td key={r.url + m.key} className="border-b border-slate-100 py-2 pr-4 text-foreground">
                        {r.ok && r.result ? m.format(r.result[m.key]) : <span className="text-red-500">Failed</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground">HTTPS</td>
                  {rows.map((r) => (
                    <td key={r.url + "https"} className="py-2 pr-4">
                      {r.ok && r.result ? (
                        r.result.isHttps ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-red-500" />
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rows
                .filter((r) => r.ok && r.result)
                .map((r) => (
                  <SourceChip key={r.url} source={liveFetchSource(r.result!.url, r.result!.fetchedAt)} />
                ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No comparison yet.</p>
        )
      }
      exportPanel={
        rows ? (
          <Button onClick={() => downloadBlob(new Blob([gapText(rows)], { type: "text/plain" }), "competitor-gap.txt")}>
            Download comparison
          </Button>
        ) : null
      }
    />
  );
}

function gapText(rows: SiteAuditRow[]) {
  const header = ["Metric", ...rows.map((r) => r.url)].join("\t");
  const lines = metrics.map((m) =>
    [m.label, ...rows.map((r) => (r.ok && r.result ? m.format(r.result[m.key]) : "Failed"))].join("\t"),
  );
  return [header, ...lines].join("\n");
}
