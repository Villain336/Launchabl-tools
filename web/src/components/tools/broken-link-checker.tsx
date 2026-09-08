"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BrokenLinkReport } from "@/lib/link-checker";

export function BrokenLinkChecker() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<BrokenLinkReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/broken-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not check that page.");
        return;
      }
      setReport(data);
    } catch {
      setError("Something went wrong reaching that page.");
    } finally {
      setBusy(false);
    }
  };

  const sorted = report ? [...report.links].sort((a, b) => Number(a.ok) - Number(b.ok)) : [];

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="https://yourbrand.com"
            className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check links"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {report && (
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Checked</p>
              <p className="font-medium text-slate-900">{report.pageUrl}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{report.totalLinksChecked}</p>
                <p className="text-xs text-slate-500">links checked</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${report.brokenCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {report.brokenCount}
                </p>
                <p className="text-xs text-slate-500">broken</p>
              </div>
            </div>
          </div>

          <ul className="mt-6 space-y-2">
            {sorted.map((link) => (
              <li
                key={link.url}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
              >
                <span className="truncate text-slate-700">{link.url}</span>
                {link.ok ? (
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> {link.status}
                  </span>
                ) : (
                  <span className="flex flex-shrink-0 items-center gap-1.5 text-red-600">
                    <XCircle className="h-4 w-4" /> {link.status ?? link.error ?? "Failed"}
                  </span>
                )}
              </li>
            ))}
            {sorted.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No checkable links found on this page.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
