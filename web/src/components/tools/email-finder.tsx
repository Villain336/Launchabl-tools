"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Loader2, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import type { EmailFinderResult } from "@/lib/email-finder";

export function EmailFinder() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmailFinderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = async () => {
    if (!name.trim() || !domain.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/email-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not generate candidates.");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const copy = (email: string) => {
    navigator.clipboard?.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied((c) => (c === email ? null : c)), 1500);
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name, e.g. Jamie Rivera"
          className="rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="Company domain, e.g. acme.com"
          className="rounded-full border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find pattern"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        This ranks likely email patterns and confirms the domain accepts mail — it does not verify a specific mailbox
        exists. Use responsibly and follow anti-spam law for any outreach.
      </p>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm">
            {result.hasMx ? (
              <>
                <Mail className="h-4 w-4 text-emerald-600" />
                <span className="text-slate-700">
                  <strong className="text-emerald-700">{result.domain}</strong> accepts mail (MX: {result.mxRecords[0]})
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-slate-700">
                  <strong>{result.domain}</strong> has no MX records — this domain may not receive email.
                </span>
              </>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {result.candidates.map((c, i) => (
              <li
                key={c.email}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${i === 0 ? "text-indigo-600" : "text-slate-400"}`}>
                    {i === 0 ? "MOST LIKELY" : `#${i + 1}`}
                  </span>
                  <span className="font-mono text-slate-800">{c.email}</span>
                </div>
                <button
                  onClick={() => copy(c.email)}
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                >
                  {copied === c.email ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
