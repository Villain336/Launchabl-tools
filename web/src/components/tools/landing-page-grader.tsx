"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { ScoreDial } from "@/components/tools/website-audit-report";
import type { AuditResult } from "@/lib/site-audit";

type ConversionCheck = {
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
};

function gradeConversion(result: AuditResult): { checks: ConversionCheck[]; score: number } {
  const checks: ConversionCheck[] = [
    {
      label: "Has a clear call to action",
      passed: result.ctaKeywordCount > 0,
      detail:
        result.ctaKeywordCount > 0
          ? `Found ${result.ctaKeywordCount} CTA-style phrase(s) on the page.`
          : "No common CTA phrasing (e.g. \"Get Started\", \"Book a Call\") detected.",
      weight: 25,
    },
    {
      label: "Has a way to capture a lead",
      passed: result.forms > 0,
      detail: result.forms > 0 ? `Found ${result.forms} form(s) on the page.` : "No <form> elements detected.",
      weight: 20,
    },
    {
      label: "Shows a phone number",
      passed: result.hasPhoneNumber,
      detail: result.hasPhoneNumber
        ? "A phone number pattern was found — good for trust and local/service businesses."
        : "No phone number pattern detected. Not required for every business, but worth a deliberate decision.",
      weight: 10,
    },
    {
      label: "Shows trust/social proof signals",
      passed: result.hasTestimonialSignal,
      detail: result.hasTestimonialSignal
        ? "Found testimonial/review-style language on the page."
        : "No obvious testimonial or review language detected.",
      weight: 15,
    },
    {
      label: "Loads fast",
      passed: result.loadTimeMs < 1200,
      detail: `Server responded in ${result.loadTimeMs}ms — every 100ms of delay measurably hurts conversion rate.`,
      weight: 15,
    },
    {
      label: "Mobile-ready",
      passed: result.hasViewportMeta,
      detail: result.hasViewportMeta
        ? "Viewport meta tag found."
        : "No viewport meta tag — likely a broken experience on mobile, where most traffic lands.",
      weight: 15,
    },
  ];

  const maxScore = checks.reduce((a, c) => a + c.weight, 0);
  const rawScore = checks.reduce((a, c) => a + (c.passed ? c.weight : 0), 0);
  return { checks, score: Math.round((rawScore / maxScore) * 100) };
}

export function LandingPageGrader() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grade = useMemo(() => (result ? gradeConversion(result) : null), [result]);

  const run = async () => {
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
        setError(first?.error ?? "Could not grade that page. Check it's publicly reachable.");
        return;
      }
      setResult(first.result);
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
            placeholder="https://yourbrand.com/landing-page"
            className="w-full rounded-full border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grade page"}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {grade && (
        <div className="mt-8">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">Conversion grade for</p>
              <p className="font-medium text-slate-900">{result?.url}</p>
            </div>
            <ScoreDial score={grade.score} />
          </div>

          <ul className="mt-6 space-y-3">
            {grade.checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                {c.passed ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-900">{c.label}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
