"use client";

import { useState } from "react";
import { Check, Copy, Download, Globe, Search, Share2 } from "lucide-react";
import type { MetaTagSet } from "@/lib/ai/tools/meta-tags";
import CodeBlock from "@/components/primitives/CodeBlock";
import { OpenInEditorButton } from "@/components/tools/chat/bits";
import { downloadBlob } from "@/lib/download";

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function metaTagsHtml(tags: MetaTagSet): string {
  const lines = [
    `<title>${escapeHtml(tags.title)}</title>`,
    `<meta name="description" content="${escapeHtml(tags.description)}" />`,
  ];
  if (tags.robots) lines.push(`<meta name="robots" content="${escapeHtml(tags.robots)}" />`);
  if (tags.canonical) lines.push(`<link rel="canonical" href="${escapeHtml(tags.canonical)}" />`);
  lines.push(
    "",
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(tags.ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(tags.ogDescription)}" />`,
  );
  if (tags.pageUrl) lines.push(`<meta property="og:url" content="${escapeHtml(tags.pageUrl)}" />`);
  lines.push(
    `<meta property="og:image" content="https://YOUR-DOMAIN/og-image.png" />`,
    "",
    `<meta name="twitter:card" content="${tags.twitterCard}" />`,
    `<meta name="twitter:title" content="${escapeHtml(tags.ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(tags.ogDescription)}" />`,
    `<meta name="twitter:image" content="https://YOUR-DOMAIN/og-image.png" />`,
  );
  return lines.join("\n");
}

function Counter({ value, ideal, hard }: { value: number; ideal: [number, number]; hard: number }) {
  const tone = value > hard ? "text-red" : value < ideal[0] || value > ideal[1] ? "text-orange" : "text-green";
  return (
    <span className={`font-mono text-[11px] tabular-nums ${tone}`}>
      {value} chars{value > hard ? " · will be cut off" : value < ideal[0] ? " · short" : value > ideal[1] ? " · long" : ""}
    </span>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
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

function displayUrl(url?: string): string {
  if (!url) return "yourdomain.com › page";
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname === "/" ? "" : " › " + u.pathname.split("/").filter(Boolean).join(" › ")}`;
  } catch {
    return url;
  }
}

export function MetaTagsArtifact({ tags }: { tags: MetaTagSet }) {
  const [tab, setTab] = useState<"preview" | "html">("preview");
  const html = metaTagsHtml(tags);

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Search className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">Meta tags{tags.pageUrl ? ` · ${displayUrl(tags.pageUrl)}` : ""}</p>
          <p className="truncate text-[12px] text-ink-2">
            Targets: {tags.keywords.length ? tags.keywords.join(", ") : "—"}
          </p>
        </div>
        <div className="flex items-center rounded-[6px] bg-field p-0.5">
          {(["preview", "html"] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-[5px] px-2 py-[3px] text-[12px] font-medium capitalize ${tab === t ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}
            >
              {t === "html" ? "HTML" : "Preview"}
            </button>
          ))}
        </div>
        <CopyButton text={html} label="Copy HTML" />
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([html], { type: "text/html" }), "meta-tags.html")}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> .html
        </button>
        <OpenInEditorButton title={`Meta tags${tags.pageUrl ? ` for ${displayUrl(tags.pageUrl)}` : ""}`} from="Meta tag generator" files={[{ path: "meta-tags.html", content: html }]} />
      </div>

      {tab === "html" ? (
        <div className="p-3">
          <CodeBlock lines={html.split("\n")} code={html} filename="head.html" />
        </div>
      ) : (
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {/* SERP */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">
              <Globe className="h-3 w-3" /> Search result
            </p>
            <div className="rounded-[10px] border border-line bg-white p-4 dark:bg-[#1f1f1f]">
              <p className="text-[12px] text-[#4d5156] dark:text-[#bdc1c6]">{displayUrl(tags.pageUrl)}</p>
              <p className="mt-1 text-[18px] leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">{tags.title}</p>
              <p className="mt-1 text-[13px] leading-snug text-[#4d5156] dark:text-[#bdc1c6]">{tags.description}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-ink-2">Title</span> <Counter value={tags.title.length} ideal={[50, 60]} hard={65} />
              <CopyButton text={tags.title} label="Copy" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-ink-2">Description</span> <Counter value={tags.description.length} ideal={[140, 155]} hard={160} />
              <CopyButton text={tags.description} label="Copy" />
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">
              <Share2 className="h-3 w-3" /> Share card
            </p>
            <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
              <div className="flex aspect-[1.91/1] items-center justify-center bg-gradient-to-br from-primary/15 via-field to-primary/5 p-6 text-center">
                <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Image brief:</span> {tags.ogImageBrief}
                </p>
              </div>
              <div className="border-t border-line p-3">
                <p className="text-[11px] tracking-wide text-ink-3 uppercase">{displayUrl(tags.pageUrl).split(" › ")[0]}</p>
                <p className="mt-0.5 text-[14px] font-semibold text-ink">{tags.ogTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-2">{tags.ogDescription}</p>
              </div>
            </div>
          </div>

          {tags.alternatives.length > 0 && (
            <div className="lg:col-span-2">
              <p className="text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">Alternatives to test</p>
              <div className="mt-2 divide-y divide-line rounded-[10px] border border-line">
                {tags.alternatives.map((alt, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="mt-0.5 shrink-0 rounded-full bg-primary/10 px-2 py-[1px] text-[11px] font-medium text-primary">{alt.angle}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink">{alt.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-ink-2">{alt.description}</p>
                    </div>
                    <CopyButton text={`${alt.title}\n${alt.description}`} label="Copy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[12.5px] leading-relaxed text-ink-2 lg:col-span-2">{tags.rationale}</p>
        </div>
      )}
    </div>
  );
}
