"use client";

import { useState } from "react";
import { CheckCircle2, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { ScoreDial } from "@/components/tools/website-audit-report";
import type { AuditResult } from "@/lib/site-audit";
import { downloadBlob } from "@/lib/download";
import { liveFetchSource, sourcesFromLog } from "@/lib/deliverable";
import { requestSiteAudit } from "@/lib/skills/fetch-site-audit";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

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

type GradeOutput = { result: AuditResult; grade: { checks: ConversionCheck[]; score: number } };

export function LandingPageGrader() {
  const delivery = useDeliveryRunOrThrow();
  const [url, setUrl] = useState("");
  const packed = (delivery.output as GradeOutput | null) ?? null;
  const grade = packed?.grade ?? null;
  const result = packed?.result ?? null;

  const start = async () => {
    if (!url.trim()) return;
    let audit: AuditResult | null = null;
    await delivery.runScan(
      async (skill) => {
        if (skill.id === "fetch-page") {
          const rows = await requestSiteAudit({ url });
          const first = rows[0];
          if (!first?.ok || !first.result) throw new Error(first?.error ?? "Could not grade that page.");
          audit = first.result;
          return { payload: audit, sources: [liveFetchSource(audit.url, audit.fetchedAt)], detail: audit.url };
        }
        if (!audit) throw new Error("No page fetched.");
        const source = liveFetchSource(audit.url, audit.fetchedAt);
        if (skill.id === "score-landing") {
          const next = gradeConversion(audit);
          return { payload: next, sources: [source], detail: `${next.score}/100` };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Sourced from live fetch" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => {
        const next = gradeConversion(audit!);
        return {
          output: { result: audit, grade: next },
          deliverable: {
            kind: "report",
            title: `Landing page grade — ${audit!.url}`,
            artifacts: [{ name: "landing-page-grade.txt", mime: "text/plain", text: gradeText(audit!, next) }],
            sources: sourcesFromLog(log),
            warnings: [],
            gates: { download: "locked" },
          },
        };
      },
    );
  };

  const source = result ? liveFetchSource(result.url, result.fetchedAt) : null;

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
              placeholder="https://yourbrand.com/landing-page"
              className="w-full rounded-full border border-border py-2.5 pr-4 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <Button onClick={start} disabled={delivery.scanning}>
            Grade page
          </Button>
        </div>
      }
      review={
        grade && result && source ? (
          <div>
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-muted p-6 sm:flex-row sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion grade for</p>
                <p className="font-medium text-foreground">{result.url}</p>
                <div className="mt-2">
                  <SourceChip source={source} />
                </div>
              </div>
              <ScoreDial score={grade.score} />
            </div>
            <ul className="mt-6 space-y-3">
              {grade.checks.map((c) => (
                <li key={c.label} className="flex items-start gap-3 rounded-lg border border-border p-4">
                  {c.passed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{c.detail}</p>
                    <div className="mt-2">
                      <SourceChip source={source} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No grade yet.</p>
        )
      }
      exportPanel={
        grade && result ? (
          <Button onClick={() => downloadBlob(new Blob([gradeText(result, grade)], { type: "text/plain" }), "landing-page-grade.txt")}>
            Download grade
          </Button>
        ) : null
      }
    />
  );
}

function gradeText(result: AuditResult, grade: { checks: ConversionCheck[]; score: number }) {
  return [
    `Landing page grade — ${result.url}`,
    `Fetched: ${result.fetchedAt}`,
    `Source: live fetch`,
    `Score: ${grade.score}/100`,
    "",
    ...grade.checks.map((c) => `${c.passed ? "PASS" : "FAIL"} ${c.label}: ${c.detail}`),
  ].join("\n");
}
