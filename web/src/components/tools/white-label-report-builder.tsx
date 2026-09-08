"use client";

import { useState } from "react";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";
import { operatorSource, sourcesFromLog } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

type Finding = { title: string; detail: string; severity: "critical" | "warning" | "info" };

const severityColor: Record<Finding["severity"], string> = {
  critical: "#DC2626",
  warning: "#D97706",
  info: "#2563EB",
};

function buildReportHtml(opts: {
  agencyName: string;
  accentColor: string;
  clientName: string;
  reportTitle: string;
  summary: string;
  score: string;
  findings: Finding[];
  recommendations: string;
}) {
  const findingsHtml = opts.findings
    .map(
      (f) => `
      <div style="border-left:4px solid ${severityColor[f.severity]}; padding:12px 16px; margin-bottom:12px; background:#f8fafc; border-radius:6px;">
        <p style="margin:0; font-weight:600; color:#0f172a;">${escapeHtml(f.title)}</p>
        <p style="margin:4px 0 0; color:#475569; font-size:14px;">${escapeHtml(f.detail)}</p>
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(opts.reportTitle)} — ${escapeHtml(opts.clientName)}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 48px; color: #0f172a; }
  .header { border-bottom: 4px solid ${opts.accentColor}; padding-bottom: 16px; margin-bottom: 32px; }
  .agency { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: ${opts.accentColor}; font-weight: 700; }
  h1 { font-size: 28px; margin: 8px 0 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin: 0; }
  .score { display: inline-block; margin-top: 24px; padding: 16px 24px; background: ${opts.accentColor}1a; border-radius: 12px; }
  .score .value { font-size: 36px; font-weight: 800; color: ${opts.accentColor}; }
  h2 { font-size: 18px; margin-top: 40px; }
  .recs { white-space: pre-line; color: #334155; font-size: 14px; line-height: 1.6; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="header">
    <p class="agency">${escapeHtml(opts.agencyName || "Your Agency")}</p>
    <h1>${escapeHtml(opts.reportTitle || "Marketing Report")}</h1>
    <p class="subtitle">Prepared for ${escapeHtml(opts.clientName || "Client")}</p>
  </div>
  ${opts.summary ? `<p style="font-size:15px; color:#334155; line-height:1.6;">${escapeHtml(opts.summary)}</p>` : ""}
  ${opts.score ? `<div class="score"><div class="value">${escapeHtml(opts.score)}</div></div>` : ""}
  ${opts.findings.length ? `<h2>Key findings</h2>${findingsHtml}` : ""}
  ${opts.recommendations ? `<h2>Recommendations</h2><div class="recs">${escapeHtml(opts.recommendations)}</div>` : ""}
</body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function WhiteLabelReportBuilder() {
  const run = useDeliveryRunOrThrow();
  const [agencyName, setAgencyName] = useState("");
  const [accentColor, setAccentColor] = useState("#FF6600");
  const [clientName, setClientName] = useState("");
  const [reportTitle, setReportTitle] = useState("Marketing Audit Report");
  const [summary, setSummary] = useState("");
  const [score, setScore] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [findings, setFindings] = useState<Finding[]>([{ title: "", detail: "", severity: "warning" }]);
  const html = (run.output as string | null) ?? "";
  const source = operatorSource("Agency, client, and findings from this run");
  const filledSummary = summary || run.brief.trim();

  const compose = () =>
    buildReportHtml({
      agencyName,
      accentColor,
      clientName,
      reportTitle,
      summary: filledSummary,
      score,
      findings: findings.filter((f) => f.title.trim()),
      recommendations,
    });

  const start = async () => {
    const branded = Boolean(agencyName.trim() || clientName.trim());
    const hasContent = Boolean(filledSummary.trim() || recommendations.trim() || score.trim() || findings.some((f) => f.title.trim()));
    if (!branded || !hasContent) return;
    const next = compose();
    await run.runScan(
      async (skill) => {
        if (skill.id === "compose-report") {
          return { payload: { clientName, reportTitle }, sources: [source], detail: clientName || "Client" };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Operator-provided findings" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: next,
        deliverable: {
          kind: "report",
          title: reportTitle,
          artifacts: [{ name: "report.html", mime: "text/html", text: next }],
          sources: sourcesFromLog(log),
          warnings: [],
          gates: { download: "locked" },
        },
      }),
    );
  };

  const printReport = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <AgentDock
      intake={
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your agency name" value={agencyName} onChange={setAgencyName} />
            <div>
              <label className="text-sm font-medium text-foreground">Accent color</label>
              <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Client name" value={clientName} onChange={setClientName} />
            <Field label="Report title" value={reportTitle} onChange={setReportTitle} />
          </div>
          <Field label="Executive summary" value={filledSummary} onChange={setSummary} textarea />
          <Field label="Headline score (optional, e.g. 72/100)" value={score} onChange={setScore} />
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Key findings</label>
              <button
                type="button"
                onClick={() => setFindings([...findings, { title: "", detail: "", severity: "warning" }])}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Add finding
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {findings.map((f, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex gap-2">
                    <input
                      value={f.title}
                      placeholder="Finding title"
                      onChange={(e) => {
                        const next = [...findings];
                        next[i] = { ...next[i], title: e.target.value };
                        setFindings(next);
                      }}
                      className="flex-1 rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-ring"
                    />
                    <select
                      value={f.severity}
                      onChange={(e) => {
                        const next = [...findings];
                        next[i] = { ...next[i], severity: e.target.value as Finding["severity"] };
                        setFindings(next);
                      }}
                      className="rounded-md border border-border px-2 py-1.5 text-xs outline-none"
                    >
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                    <button onClick={() => setFindings(findings.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={f.detail}
                    placeholder="Detail / explanation"
                    onChange={(e) => {
                      const next = [...findings];
                      next[i] = { ...next[i], detail: e.target.value };
                      setFindings(next);
                    }}
                    className="mt-2 w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-ring"
                  />
                </div>
              ))}
            </div>
          </div>
          <Field label="Recommendations" value={recommendations} onChange={setRecommendations} textarea rows={5} />
          <Button onClick={start} disabled={run.scanning}>
            Compose report
          </Button>
        </div>
      }
      review={
        html ? (
          <div>
            <SourceChip source={source} />
            <iframe title="Report preview" srcDoc={html} className="mt-3 h-[480px] w-full rounded-xl border border-border bg-white" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No report yet.</p>
        )
      }
      exportPanel={
        html ? (
          <div className="flex gap-3">
            <Button onClick={printReport}>
              <Printer className="h-4 w-4" /> Print / Save as PDF
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                downloadBlob(
                  new Blob([html], { type: "text/html" }),
                  `${(clientName || "report").toLowerCase().replace(/\s+/g, "-")}-report.html`,
                )
              }
            >
              <Download className="h-4 w-4" /> Download .html
            </Button>
          </div>
        ) : null
      }
    />
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      )}
    </div>
  );
}
