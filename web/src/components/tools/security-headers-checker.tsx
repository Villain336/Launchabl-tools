"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { ScoreDial } from "@/components/tools/website-audit-report";
import type { SecurityHeadersResult } from "@/lib/security-headers";

export function SecurityHeadersChecker() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SecurityHeadersResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/security-headers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not check that page.");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong reaching that page.");
    } finally {
      setBusy(false);
    }
  };

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
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check headers"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Security headers for</p>
              <p className="font-medium text-slate-900">{result.url}</p>
            </div>
            <ScoreDial score={result.score} />
          </div>

          <ul className="mt-6 space-y-3">
            {result.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                {c.present ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <XCircle
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${c.severity === "critical" ? "text-red-500" : "text-amber-500"}`}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{c.label}</p>
                  <p className="mt-0.5 break-words text-sm text-slate-600">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
