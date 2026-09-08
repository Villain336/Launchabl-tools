"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import type { AuditResult } from "@/lib/site-audit";
import { downloadBlob } from "@/lib/download";
import { useDeliveryPhase } from "@/components/tools/delivery-run";
import { ApproveGate } from "@/components/tools/approve-gate";

export function WebsiteAuditReport() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  useDeliveryPhase(busy ? "scan" : result ? "review" : "submit");

  const runAudit = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/site-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      const first = data.results?.[0];
      if (!first?.ok) {
        setError(first?.error ?? "Could not audit that URL. Check it's publicly reachable.");
        return;
      }
      setResult(first.result);
    } catch {
      setError("Something went wrong reaching that URL.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAudit()}
            placeholder="https://yourbrand.com"
            className="w-full rounded-full border border-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Button onClick={runAudit} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run audit"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Audited</p>
              <p className="font-medium text-foreground">{result.url}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.loadTimeMs}ms response · {result.pageSizeKb}KB · {result.wordCount} words
              </p>
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
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <ApproveGate ready={Boolean(result)} label="Approve report">
            <Button
              onClick={() => {
                if (!result) return;
                const body = [
                  `Website audit — ${result.url}`,
                  `Score: ${result.score}/100`,
                  "",
                  ...result.findings.map(
                    (f) => `${f.passed ? "PASS" : "FAIL"} ${f.label}: ${f.detail}`,
                  ),
                ].join("\n");
                downloadBlob(new Blob([body], { type: "text/plain" }), "website-audit.txt");
              }}
            >
              Download report
            </Button>
          </ApproveGate>
        </div>
      )}
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
