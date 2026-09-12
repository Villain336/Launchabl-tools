"use client";

import { useState } from "react";
import { Braces, CheckCircle2, CircleDashed, ExternalLink, XCircle } from "lucide-react";
import type { SchemaDeliverable } from "@/lib/ai/tools/marketing-kits";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, Pill, shorten, Tabs } from "@/components/tools/chat/bits";

export function SchemaArtifact({ data }: { data: SchemaDeliverable }) {
  const [tab, setTab] = useState<"json" | "snippet" | "checks">("json");
  const required = data.checks.filter((c) => c.level === "required");
  const missingRequired = required.filter((c) => !c.present);
  const recommended = data.checks.filter((c) => c.level === "recommended");
  const missingRecommended = recommended.filter((c) => !c.present);
  const hostname = (() => {
    try {
      return data.pageUrl ? new URL(data.pageUrl).hostname.replace(/^www\./, "") : "schema";
    } catch {
      return "schema";
    }
  })();

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <ArtifactHeader icon={<Braces className="h-4 w-4" />} title={data.types.length ? data.types.join(" + ") : "JSON-LD"} subtitle={data.pageUrl ? `Structured data for ${shorten(data.pageUrl, 50)}` : "Structured data"}>
        {data.valid ? <Pill t="good">valid</Pill> : <Pill t="bad">{missingRequired.length ? `${missingRequired.length} required missing` : "needs fixes"}</Pill>}
        <Tabs value={tab} onChange={setTab} options={[{ key: "json", label: "JSON-LD" }, { key: "snippet", label: "<script>" }, { key: "checks", label: `Checks (${data.checks.length})` }]} />
        <CopyButton text={tab === "snippet" ? data.snippet : data.jsonLd} />
        <DownloadButton content={data.jsonLd} filename={`${hostname}-${(data.types[0] ?? "schema").toLowerCase()}.jsonld`} type="application/ld+json" label=".jsonld" />
      </ArtifactHeader>

      {data.warnings.length > 0 && (
        <ul className="divide-y divide-line border-b border-line bg-orange-tint/40">
          {data.warnings.map((w) => (
            <li key={w} className="px-4 py-2 text-[12.5px] text-orange">
              {w}
            </li>
          ))}
        </ul>
      )}

      {tab === "checks" ? (
        <div>
          {(["required", "recommended"] as const).map((level) => {
            const list = level === "required" ? required : recommended;
            if (list.length === 0) return null;
            return (
              <div key={level}>
                <p className="bg-field/60 px-4 py-1.5 text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
                  {level} · {list.filter((c) => c.present).length}/{list.length} present
                </p>
                <ul className="grid gap-x-4 sm:grid-cols-2">
                  {list.map((c) => (
                    <li key={`${c.type}.${c.property}`} className="flex items-center gap-2 px-4 py-1.5 text-[12.5px]">
                      {c.present ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green" /> : level === "required" ? <XCircle className="h-3.5 w-3.5 shrink-0 text-red" /> : <CircleDashed className="h-3.5 w-3.5 shrink-0 text-ink-3" />}
                      <span className={c.present ? "text-ink" : "text-ink-2"}>
                        <span className="font-mono">{c.property}</span> <span className="text-ink-3">on {c.type}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {data.checks.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-ink-2">No property rules for these types — validate with the Rich Results Test.</p>}
        </div>
      ) : (
        <pre className="max-h-[460px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">{tab === "snippet" ? data.snippet : data.jsonLd}</pre>
      )}

      <div className="border-t border-line px-4 py-2.5 text-[12.5px] text-ink-2">{data.notes}</div>
      <Footnote icon={<ExternalLink className="h-3 w-3" />}>
        Paste the script in &lt;head&gt; or anywhere in the body, then test at{" "}
        <a className="underline hover:text-ink" href={`https://search.google.com/test/rich-results${data.pageUrl ? `?url=${encodeURIComponent(data.pageUrl)}` : ""}`} target="_blank" rel="noreferrer">
          search.google.com/test/rich-results
        </a>
        {missingRecommended.length > 0 && ` · ${missingRecommended.length} recommended propert${missingRecommended.length === 1 ? "y" : "ies"} still empty`}
      </Footnote>
    </div>
  );
}
