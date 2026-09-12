"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Link2, Printer, Sparkles } from "lucide-react";
import { ArtifactSessionProvider } from "@/components/tools/chat/artifact-session";
import { artifactRenderers, type ToolPart } from "@/components/tools/chat/artifact-registry";
import { Markdown } from "@/components/tools/chat/markdown";
import type { Report, ReportItem } from "@/lib/reports/extract";

/**
 * Public rendering of a saved report. Same artifact components as the
 * chat, wrapped in a light document frame: title, who prepared it, the
 * briefs and deliverables in order, and a hand-off to the agency plan.
 */

function toToolPart(item: Extract<ReportItem, { kind: "tool" }>): ToolPart {
  return {
    type: `tool-${item.tool}`,
    toolCallId: item.toolCallId,
    state: "output-available",
    input: item.input,
    output: item.output,
  } as unknown as ToolPart;
}

/** Fixed locale and zone so server and client render the same string. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(window.location.href).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2.5 text-[12.5px] font-medium transition-colors duration-100 hover:bg-hover ${copied ? "text-green" : "text-ink-2"}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}

export function ReportView({ report, price }: { report: Report; price: string }) {
  const deliverables = report.items.filter((item) => item.kind === "tool").length;
  const date = formatDate(report.createdAt);

  return (
    <ArtifactSessionProvider slug={report.slug}>
      <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12" data-report={report.id}>
        <header className="border-b border-line pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-ink-3 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Client report
            </span>
            <div className="flex items-center gap-1.5 print:hidden">
              <CopyLinkButton />
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink-2 transition-colors duration-100 hover:bg-hover"
              >
                <Printer className="h-3.5 w-3.5" /> Print / PDF
              </button>
            </div>
          </div>
          <h1 className="mt-4 text-[26px] leading-tight font-semibold tracking-tight text-ink sm:text-[32px]">{report.title}</h1>
          <p className="mt-2 text-[13.5px] text-ink-3">
            {report.preparedBy ? `Prepared by ${report.preparedBy} · ` : ""}
            {date} · {deliverables} {deliverables === 1 ? "deliverable" : "deliverables"} · made with{" "}
            <Link href="/agent" className="text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink">
              Launchabl Agent
            </Link>
          </p>
          {report.trimmed && (
            <p className="mt-2 text-[12.5px] text-ink-3">Some generated images were left out to keep this report small; the prompts are included.</p>
          )}
        </header>

        <div className="flex flex-col gap-6 py-8">
          {report.items.map((item, index) => {
            if (item.kind === "prompt") {
              return (
                <section key={index} className="rounded-[12px] border border-line bg-field/60 px-4 py-3">
                  <p className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">Brief</p>
                  <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap text-ink">{item.text}</p>
                </section>
              );
            }
            if (item.kind === "text") {
              return (
                <section key={index}>
                  <Markdown text={item.text} />
                </section>
              );
            }
            const render = artifactRenderers[item.tool];
            if (!render) return null;
            return (
              <section key={item.toolCallId || index} className="min-w-0">
                {render(toToolPart(item))}
              </section>
            );
          })}
        </div>

        <footer className="rounded-[14px] border border-line bg-surface p-5 shadow-card sm:p-6 print:hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <p className="text-[15px] font-semibold text-ink">Want this done for you, end to end?</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
                Launchabl&apos;s agency plan is {price} one time for unlimited brand, website, content and SEO requests. No retainer. The tools stay free either way.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href="/pricing"
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-semibold text-white transition-transform duration-150 hover:brightness-95 active:scale-[0.98]"
              >
                See the plan <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/agent"
                className="inline-flex h-9 items-center rounded-[8px] border border-line bg-surface px-3.5 text-[13px] font-medium text-ink transition-colors duration-100 hover:bg-hover"
              >
                Make your own — free
              </Link>
            </div>
          </div>
        </footer>
        <p className="mt-4 text-center text-[11.5px] text-ink-3 print:hidden">AI-assisted output. Check claims before you publish.</p>
      </article>
    </ArtifactSessionProvider>
  );
}
