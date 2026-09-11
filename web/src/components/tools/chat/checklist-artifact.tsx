"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Bot, Check, CheckCircle2, Copy, Download, FileText, Info, Mic, Scale, ShieldCheck, XCircle } from "lucide-react";
import type { Check as ChecklistCheck, ChecklistReport, CheckStatus } from "@/lib/web/checklist";
import type { CrawlerStatus, LlmReadabilityReport } from "@/lib/web/llm-readability";
import type { FaqSchemaDeliverable } from "@/lib/ai/tools/site-checks";
import { downloadBlob } from "@/lib/download";

const tone = {
  good: { text: "text-green", bg: "bg-green-tint", icon: CheckCircle2 },
  warn: { text: "text-orange", bg: "bg-orange-tint", icon: AlertTriangle },
  bad: { text: "text-red", bg: "bg-red-tint", icon: XCircle },
  info: { text: "text-accent-ink", bg: "bg-accent-tint", icon: Info },
  muted: { text: "text-ink-3", bg: "bg-field", icon: Info },
} as const;

type Tone = keyof typeof tone;
const statusTone: Record<CheckStatus, Tone> = { pass: "good", warn: "warn", fail: "bad", info: "info" };

function Pill({ t, children }: { t: Tone; children: ReactNode }) {
  return <span className={`inline-flex h-[20px] items-center gap-1 rounded-[5px] px-1.5 text-[11px] font-medium ${tone[t].text} ${tone[t].bg}`}>{children}</span>;
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ScoreRing({ score }: { score: number }) {
  const t: Tone = score >= 80 ? "good" : score >= 55 ? "warn" : "bad";
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex size-14 shrink-0 items-center justify-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-line" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} className={tone[t].text} stroke="currentColor" />
      </svg>
      <span className={`text-[16px] font-semibold tabular-nums ${tone[t].text}`}>{score}</span>
    </div>
  );
}

const shorten = (url: string, max = 70) => {
  const s = url.replace(/^https?:\/\//, "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

const KIND: Record<ChecklistReport["kind"], { title: string; icon: ReactNode; caveat: string }> = {
  "voice-search": { title: "Voice search readiness", icon: <Mic className="h-4 w-4" />, caveat: "static read of the HTML" },
  compliance: { title: "Compliance scan", icon: <Scale className="h-4 w-4" />, caveat: "technical signals, not legal advice" },
  "llm-readability": { title: "LLM readability", icon: <Bot className="h-4 w-4" />, caveat: "page + robots.txt + llms.txt" },
};

function CheckRow({ check }: { check: ChecklistCheck }) {
  const T = tone[statusTone[check.status]];
  const Icon = T.icon;
  return (
    <li className="flex gap-3 px-4 py-2.5">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${T.text}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink">{check.title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed break-words text-ink-2">{check.detail}</p>
        {check.fix && (
          <p className="mt-1 text-[12.5px] leading-relaxed break-words text-ink">
            <span className="font-medium">Fix:</span> {check.fix}
          </p>
        )}
      </div>
    </li>
  );
}

const ACCESS: Record<CrawlerStatus["access"], { t: Tone; label: string }> = {
  allowed: { t: "good", label: "allowed" },
  restricted: { t: "warn", label: "partly" },
  blocked: { t: "bad", label: "blocked" },
};

const PURPOSE: Record<CrawlerStatus["purpose"], string> = { training: "training", search: "AI search", "user-fetch": "on request" };

function CrawlerTable({ crawlers, robotsUrl }: { crawlers: CrawlerStatus[]; robotsUrl: string }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">AI crawler access · robots.txt</p>
        <a href={robotsUrl} target="_blank" rel="noreferrer" className="text-[11.5px] text-ink-3 hover:text-ink hover:underline">
          view file
        </a>
      </div>
      <div className="mt-2 grid gap-1 sm:grid-cols-2">
        {crawlers.map((c) => (
          <div key={c.agent} className="flex items-center gap-2 rounded-control bg-field px-2.5 py-1.5 text-[12px]">
            <Pill t={ACCESS[c.access].t}>{ACCESS[c.access].label}</Pill>
            <span className="min-w-0 flex-1 truncate font-mono text-ink" title={`${c.agent} · ${c.vendor}`}>
              {c.agent}
            </span>
            <span className="shrink-0 text-ink-3">{c.vendor.split(" (")[0]} · {PURPOSE[c.purpose]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChecklistArtifact({ report }: { report: ChecklistReport | LlmReadabilityReport }) {
  const [showPass, setShowPass] = useState(false);
  const meta = KIND[report.kind];
  const issues = report.checks.filter((c) => c.status !== "pass");
  const passes = report.checks.filter((c) => c.status === "pass");
  const verdict: Tone = report.summary.fail ? "bad" : report.summary.warn ? "warn" : "good";
  const verdictLabel = report.summary.fail
    ? `${report.summary.fail} to fix`
    : report.summary.warn
      ? `${report.summary.warn} warning${report.summary.warn > 1 ? "s" : ""}`
      : "All clear";
  const visible = showPass ? report.checks : issues;
  const groups = Array.from(new Set(visible.map((c) => c.group ?? "Checks")));
  const llm = "crawlers" in report ? report : null;

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-primary">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{meta.title}</p>
          <p className="truncate text-[12px] text-ink-2">
            {shorten(report.finalUrl)} · {meta.caveat}
          </p>
        </div>
        <Pill t={verdict}>{verdictLabel}</Pill>
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }), `${report.kind}-${new URL(report.finalUrl).hostname}.json`)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> JSON
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line px-4 py-3">
        <ScoreRing score={report.score} />
        <div className="grid flex-1 grid-cols-3 gap-2">
          <div className="rounded-control bg-field px-3 py-2">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Passed</p>
            <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-green">{report.summary.pass}</p>
          </div>
          <div className="rounded-control bg-field px-3 py-2">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Warnings</p>
            <p className={`mt-0.5 text-[15px] font-semibold tabular-nums ${report.summary.warn ? "text-orange" : "text-ink"}`}>{report.summary.warn}</p>
          </div>
          <div className="rounded-control bg-field px-3 py-2">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">To fix</p>
            <p className={`mt-0.5 text-[15px] font-semibold tabular-nums ${report.summary.fail ? "text-red" : "text-ink"}`}>{report.summary.fail}</p>
          </div>
        </div>
      </div>

      {llm && <CrawlerTable crawlers={llm.crawlers} robotsUrl={llm.robotsTxt.url} />}

      {visible.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-ink-2">Everything checked passes.</p>
      ) : (
        groups.map((group) => (
          <div key={group}>
            {groups.length > 1 && <p className="bg-field/60 px-4 py-1.5 text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{group}</p>}
            <ul className="divide-y divide-line">
              {visible.filter((c) => (c.group ?? "Checks") === group).map((c) => <CheckRow key={c.id} check={c} />)}
            </ul>
          </div>
        ))
      )}

      {passes.length > 0 && (
        <button type="button" onClick={() => setShowPass((v) => !v)} className="w-full border-t border-line px-4 py-2 text-[12px] font-medium text-ink-3 hover:bg-hover hover:text-ink">
          {showPass ? "Hide" : "Show"} {passes.length} passing check{passes.length > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

export function FaqSchemaArtifact({ data }: { data: FaqSchemaDeliverable }) {
  const [tab, setTab] = useState<"qa" | "html" | "jsonld">("qa");
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-primary">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">FAQ section + FAQPage schema</p>
          <p className="truncate text-[12px] text-ink-2">
            {data.items.length} questions for {shorten(data.pageUrl)}
          </p>
        </div>
        <div className="flex items-center gap-0.5 rounded-[8px] bg-field p-0.5">
          {(["qa", "html", "jsonld"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`h-6 rounded-[6px] px-2 text-[11.5px] font-medium transition-colors ${tab === key ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}
            >
              {key === "qa" ? "Q&A" : key === "html" ? "HTML" : "JSON-LD"}
            </button>
          ))}
        </div>
        <CopyButton text={tab === "jsonld" ? data.jsonLd : tab === "html" ? data.html : data.items.map((i) => `${i.question}\n${i.answer}`).join("\n\n")} />
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([data.html], { type: "text/html" }), "faq-section.html")}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> HTML
        </button>
      </div>
      {tab === "qa" ? (
        <dl className="divide-y divide-line">
          {data.items.map((item) => (
            <div key={item.question} className="px-4 py-3">
              <dt className="text-[13px] font-medium text-ink">{item.question}</dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                {item.answer} <span className="text-ink-3">· {item.answer.split(/\s+/).length} words</span>
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <pre className="max-h-[420px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">{tab === "html" ? data.html : data.jsonLd}</pre>
      )}
      <p className="flex items-center gap-1.5 border-t border-line px-4 py-2 text-[11.5px] text-ink-3">
        <FileText className="h-3 w-3" /> Paste the HTML where the FAQ belongs; the JSON-LD can sit anywhere in the page.
      </p>
    </div>
  );
}
