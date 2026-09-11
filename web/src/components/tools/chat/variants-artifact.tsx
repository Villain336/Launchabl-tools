"use client";

import { useState } from "react";
import { Check, Copy, Download, FlaskConical } from "lucide-react";
import type { VariantsDeliverable } from "@/lib/ai/tools/ab-copy-variants";
import { downloadBlob } from "@/lib/download";

function variantText(v: VariantsDeliverable["variants"][number]): string {
  return [v.headline, v.body, v.cta ? `CTA: ${v.cta}` : undefined].filter(Boolean).join("\n");
}

function csvCell(value: string | undefined): string {
  const text = value ?? "";
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(data: VariantsDeliverable): string {
  const rows = [
    ["label", "angle", "headline", "body", "cta", "why"],
    ...(data.control ? [["Control", "current", data.control, "", "", "What you have today"]] : []),
    ...data.variants.map((v) => [v.label, v.angle, v.headline, v.body ?? "", v.cta ?? "", v.why]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${
        copied ? "text-green" : "text-ink-3 hover:text-ink"
      }`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export function VariantsArtifact({ data }: { data: VariantsDeliverable }) {
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <FlaskConical className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">
            {data.variants.length} variants · {data.asset}
          </p>
          <p className="truncate text-[12px] text-ink-2">For {data.audience}</p>
        </div>
        <CopyButton
          text={data.variants.map((v) => `${v.label}\n${variantText(v)}`).join("\n\n")}
          label="Copy all"
        />
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([toCsv(data)], { type: "text/csv" }), "ab-copy-variants.csv")}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> CSV
        </button>
      </div>

      <div className="divide-y divide-line">
        {data.control && (
          <div className="flex items-start gap-3 bg-field/60 px-4 py-3">
            <span className="mt-0.5 shrink-0 rounded-full border border-line px-2 py-[1px] text-[11px] font-medium text-ink-2">
              Control
            </span>
            <p className="min-w-0 flex-1 text-[13.5px] text-ink-2">{data.control}</p>
            <CopyButton text={data.control} />
          </div>
        )}
        {data.variants.map((v, i) => (
          <div key={`${v.label}-${i}`} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-[1px] text-[11px] font-medium text-primary">
                {v.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-ink">{v.headline}</p>
                {v.body && <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{v.body}</p>}
                {v.cta && (
                  <span className="mt-2 inline-flex rounded-[8px] bg-ink px-3 py-1 text-[12.5px] font-medium text-surface">
                    {v.cta}
                  </span>
                )}
                <p className="mt-2 text-[12px] text-ink-3">
                  <span className="font-medium text-ink-2">{v.angle}.</span> {v.why}
                </p>
              </div>
              <CopyButton text={variantText(v)} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 border-t border-line bg-field/40 px-4 py-3 text-[12.5px] sm:grid-cols-3">
        <div>
          <p className="font-medium text-ink">Measure</p>
          <p className="mt-0.5 text-ink-2">{data.testPlan.metric}</p>
          {data.testPlan.guardrail && <p className="mt-1 text-ink-3">Guardrail: {data.testPlan.guardrail}</p>}
        </div>
        <div>
          <p className="font-medium text-ink">Traffic</p>
          <p className="mt-0.5 text-ink-2">{data.testPlan.sampleSizeHint}</p>
        </div>
        <div>
          <p className="font-medium text-ink">Run for</p>
          <p className="mt-0.5 text-ink-2">{data.testPlan.duration}</p>
        </div>
      </div>
    </div>
  );
}
