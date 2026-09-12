"use client";

import { useState } from "react";
import { Check, Copy, Download, FileText, RotateCcw } from "lucide-react";
import type { DocumentDeliverable } from "@/lib/ai/tools/documents";
import CodeBlock from "@/components/primitives/CodeBlock";
import { Markdown } from "@/components/tools/chat/markdown";
import { downloadBlob } from "@/lib/download";

const mimeFor: Record<DocumentDeliverable["language"], string> = {
  markdown: "text/markdown",
  mdx: "text/mdx",
  text: "text/plain",
  json: "application/json",
  yaml: "application/yaml",
  toml: "application/toml",
  csv: "text/csv",
  html: "text/html",
  xml: "application/xml",
};

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontMatter(content: string): { fields: [string, string][]; body: string } {
  const match = FRONT_MATTER.exec(content);
  if (!match) return { fields: [], body: content };
  const fields = match[1]
    .split(/\r?\n/)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx <= 0) return null;
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()] as [string, string];
    })
    .filter((f): f is [string, string] => f !== null);
  return { fields, body: content.slice(match[0].length) };
}

type DocTab = "preview" | "source" | "edit";

export function DocumentArtifact({ doc }: { doc: DocumentDeliverable }) {
  const renderable = doc.language === "markdown" || doc.language === "mdx";
  const [content, setContent] = useState(doc.content);
  const edited = content !== doc.content;
  const { fields, body } = renderable ? splitFrontMatter(content) : { fields: [], body: content };
  const [tab, setTab] = useState<DocTab>(renderable ? "preview" : "source");
  const [copied, setCopied] = useState(false);
  const lines = content.split("\n").length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const tabs: DocTab[] = renderable ? ["preview", "source", "edit"] : ["source", "edit"];

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <FileText className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[13px] font-semibold text-ink">{doc.filename}</p>
          <p className="truncate text-[12px] text-ink-2">
            {doc.summary} · {lines} lines · {words} words
            {edited && <span className="text-orange"> · edited</span>}
          </p>
        </div>
        {edited && (
          <button type="button" onClick={() => setContent(doc.content)} title="Back to the generated version" className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
        <div className="flex items-center rounded-[6px] bg-field p-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-[5px] px-2 py-[3px] text-[12px] font-medium capitalize ${tab === t ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(content).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([content], { type: mimeFor[doc.language] }), doc.filename.split("/").pop() ?? doc.filename)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> Download
        </button>
      </div>

      {tab === "preview" ? (
        <div className="max-h-[520px] overflow-y-auto px-5 py-4">
          {fields.length > 0 && (
            <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-control border border-line bg-field px-3 py-2 font-mono text-[12px]">
              {fields.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="text-ink-3">{key}</dt>
                  <dd className="min-w-0 break-words text-ink">{value.replace(/^["']|["']$/g, "")}</dd>
                </div>
              ))}
            </dl>
          )}
          <Markdown text={body} />
        </div>
      ) : tab === "edit" ? (
        <div className="p-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={renderable}
            rows={Math.min(30, Math.max(8, lines + 1))}
            className="block w-full resize-y rounded-[8px] border border-line bg-field px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-ink outline-none focus:border-primary"
            data-doc-editor
          />
          <p className="mt-1.5 text-[11.5px] text-ink-3">Edits stay in this card and go into Copy and Download. They aren&apos;t sent back to the model — say what to change in the chat for that.</p>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-y-auto p-3">
          <CodeBlock lines={content.split("\n")} code={content} filename={doc.filename.split("/").pop() ?? doc.filename} />
        </div>
      )}
    </div>
  );
}
