"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Lock, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SslResult } from "@/lib/ssl-checker";

export function SslCertificateChecker() {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SslResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!domain.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ssl-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data: SslResult = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong reaching that domain.");
    } finally {
      setBusy(false);
    }
  };

  const status =
    result && result.valid && (result.daysRemaining ?? 0) > 14
      ? "good"
      : result && result.valid
        ? "warning"
        : "bad";

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="yourbrand.com"
            className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check certificate"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div
          className={`mt-8 rounded-2xl border p-6 ${
            status === "good"
              ? "border-emerald-200 bg-emerald-50"
              : status === "warning"
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-3">
            {status === "good" ? (
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            ) : status === "warning" ? (
              <Lock className="h-8 w-8 text-amber-600" />
            ) : (
              <ShieldAlert className="h-8 w-8 text-red-600" />
            )}
            <div>
              <p className="font-semibold text-slate-900">{result.host}</p>
              <p className="text-sm text-slate-600">
                {result.connected
                  ? result.valid
                    ? "Certificate is valid"
                    : "Certificate has a problem"
                  : "Could not connect"}
              </p>
            </div>
          </div>

          {result.connected ? (
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-slate-500">Issuer</dt>
                <dd className="font-medium text-slate-900">{result.issuer ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Issued to</dt>
                <dd className="font-medium text-slate-900">{result.subject ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Expires</dt>
                <dd className="font-medium text-slate-900">
                  {result.validTo ? new Date(result.validTo).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Days remaining</dt>
                <dd className="font-medium text-slate-900">{result.daysRemaining ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-red-700">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
