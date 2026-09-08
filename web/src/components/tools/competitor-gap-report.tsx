"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import type { AuditResult } from "@/lib/site-audit";
import { downloadBlob } from "@/lib/download";
import { useDeliveryPhase } from "@/components/tools/delivery-run";
import { ApproveGate } from "@/components/tools/approve-gate";

type Row = { url: string; ok: boolean; result?: AuditResult; error?: string };

const metrics: { key: keyof AuditResult; label: string; format: (v: unknown) => string }[] = [
  { key: "score", label: "Overall score", format: (v) => `${v}/100` },
  { key: "wordCount", label: "Word count", format: (v) => String(v) },
  { key: "loadTimeMs", label: "Load time", format: (v) => `${v}ms` },
  { key: "schemaTypes", label: "Schema types found", format: (v) => (Array.isArray(v) && v.length ? v.join(", ") : "None") },
  { key: "h1Count", label: "H1 count", format: (v) => String(v) },
];

export function CompetitorGapReport() {
  const [you, setYou] = useState("");
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  useDeliveryPhase(busy ? "scan" : rows ? "review" : "submit");

  const run = async () => {
    const urls = [you, ...competitors].map((u) => u.trim()).filter(Boolean);
    if (urls.length < 2) {
      setError("Enter your URL and at least one competitor.");
      return;
    }
    setBusy(true);
    setError(null);
    setRows(null);
    try {
      const res = await fetch("/api/site-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      setRows(data.results);
    } catch {
      setError("Something went wrong running this comparison.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        <input
          value={you}
          onChange={(e) => setYou(e.target.value)}
          placeholder="Your URL — https://yourbrand.com"
          className="rounded-lg border-2 border-indigo-200 px-3 py-2 text-sm outline-none focus:border-ring"
        />
        {competitors.map((c, i) => (
          <input
            key={i}
            value={c}
            onChange={(e) => {
              const next = [...competitors];
              next[i] = e.target.value;
              setCompetitors(next);
            }}
            placeholder={`Competitor ${i + 1} URL (optional)`}
            className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        ))}
      </div>

      <Button className="mt-4" onClick={run} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Compare"}
      </Button>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {rows && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border py-2 pr-4 text-left font-medium text-muted-foreground">Metric</th>
                {rows.map((r) => (
                  <th key={r.url} className="border-b border-border py-2 pr-4 text-left font-medium text-foreground">
                    {r.ok ? new URL(r.result!.url).hostname : r.url}
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
                      {r.ok ? m.format(r.result![m.key]) : <span className="text-red-500">Failed</span>}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-4 text-muted-foreground">HTTPS</td>
                {rows.map((r) => (
                  <td key={r.url + "https"} className="py-2 pr-4">
                    {r.ok ? (
                      r.result!.isHttps ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <ApproveGate ready={Boolean(rows)} label="Approve comparison">
            <Button
              className="mt-4"
              onClick={() => {
                if (!rows) return;
                const header = ["Metric", ...rows.map((r) => r.url)].join("\t");
                const lines = metrics.map((m) =>
                  [
                    m.label,
                    ...rows.map((r) => (r.ok ? m.format(r.result![m.key]) : "Failed")),
                  ].join("\t"),
                );
                downloadBlob(
                  new Blob([[header, ...lines].join("\n")], { type: "text/plain" }),
                  "competitor-gap.txt",
                );
              }}
            >
              Download comparison
            </Button>
          </ApproveGate>
        </div>
      )}
    </div>
  );
}
