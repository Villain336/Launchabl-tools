"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { ScoreDial } from "@/components/tools/website-audit-report";

type Check = { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string };

export function DnsEmailHealth() {
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!domain.trim()) return;
    setBusy(true);
    setError(null);
    setChecks(null);
    try {
      const res = await fetch("/api/dns-health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not check this domain.");
        return;
      }
      setChecks(data.checks);
      setScore(data.score);
    } catch {
      setError("Something went wrong checking this domain.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="yourbrand.com"
          className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check domain"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {checks && (
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Email deliverability health for</p>
              <p className="font-medium text-foreground">{domain}</p>
            </div>
            <ScoreDial score={score} />
          </div>

          <ul className="mt-6 space-y-3">
            {checks.map((c) => (
              <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-4">
                {c.status === "pass" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : c.status === "warn" ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{c.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
