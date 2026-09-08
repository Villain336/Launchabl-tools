"use client";

import { useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import type { AuditResult } from "@/lib/site-audit";
import { downloadBlob } from "@/lib/download";
import { liveFetchSource, sourcesFromLog } from "@/lib/deliverable";
import { requestSiteAudit } from "@/lib/skills/fetch-site-audit";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

export function WebsiteAuditReport() {
  const run = useDeliveryRunOrThrow();
  const [url, setUrl] = useState("");
  const result = (run.output as AuditResult | null) ?? null;

  const start = async () => {
    if (!url.trim()) return;
    let audit: AuditResult | null = null;
    await run.runScan(
      async (skill) => {
        if (skill.id === "fetch-page") {
          const rows = await requestSiteAudit({ url });
          const first = rows[0];
          if (!first?.ok || !first.result) throw new Error(first?.error ?? "Could not audit that URL.");
          audit = first.result;
          const source = liveFetchSource(audit.url, audit.fetchedAt);
          return { payload: audit, sources: [source], detail: audit.url };
        }
        if (!audit) throw new Error("No page fetched.");
        const source = liveFetchSource(audit.url, audit.fetchedAt);
        if (skill.id === "score-page") {
          return {
            payload: { score: audit.score },
            sources: [source],
            detail: `${audit.score}/100`,
          };
        }
        if (skill.id === "cite-source") {
          if (!audit.url || !audit.fetchedAt) throw new Error("No live fetch to cite.");
          return { sources: [source], detail: "Sourced from live fetch" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: audit,
        deliverable: {
          kind: "report",
          title: `Website audit — ${audit!.url}`,
          artifacts: [{ name: "website-audit.txt", mime: "text/plain", text: auditText(audit!) }],
          sources: sourcesFromLog(log),
          warnings: [],
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start()}
              placeholder="https://yourbrand.com"
              className="w-full rounded-full border border-border py-2.5 pr-4 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <Button onClick={start} disabled={run.scanning}>
            Run audit
          </Button>
        </div>
      }
      review={result ? <AuditReview result={result} /> : <p className="text-sm text-muted-foreground">No report yet.</p>}
      exportPanel={
        result ? (
          <Button
            onClick={() => downloadBlob(new Blob([auditText(result)], { type: "text/plain" }), "website-audit.txt")}
          >
            Download report
          </Button>
        ) : null
      }
    />
  );
}

function auditText(result: AuditResult) {
  return [
    `Website audit — ${result.url}`,
    `Fetched: ${result.fetchedAt}`,
    `Source: live fetch`,
    `Score: ${result.score}/100`,
    "",
    ...result.findings.map((f) => `${f.passed ? "PASS" : "FAIL"} ${f.label}: ${f.detail}`),
  ].join("\n");
}

export function AuditReview({ result }: { result: AuditResult }) {
  const source = liveFetchSource(result.url, result.fetchedAt);
  return (
    <div>
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 sm:flex-row sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Audited</p>
          <p className="font-medium text-foreground">{result.url}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.loadTimeMs}ms response · {result.pageSizeKb}KB · {result.wordCount} words
          </p>
          <div className="mt-2">
            <SourceChip source={source} />
          </div>
        </div>
        <ScoreDial score={result.score} />
      </div>
      <ul className="mt-6 space-y-3">
        {result.findings.map((f) => (
          <li key={f.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
            {f.passed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
            ) : (
              <XCircle
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${f.severity === "critical" ? "text-red-500" : "text-amber-500"}`}
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{f.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
              <div className="mt-2">
                <SourceChip source={source} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScoreDial({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="flex flex-col items-center">
      <div className={`text-4xl font-extrabold ${color}`}>{score}</div>
      <p className="text-xs text-muted-foreground">out of 100</p>
    </div>
  );
}
