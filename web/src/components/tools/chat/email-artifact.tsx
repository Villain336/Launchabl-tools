"use client";

import { useState } from "react";
import { Check, Copy, Download, Mail, Monitor, Smartphone } from "lucide-react";
import type { EmailDeliverable } from "@/lib/ai/tools/newsletter";
import { OpenInEditorButton } from "@/components/tools/chat/bits";
import { downloadBlob } from "@/lib/download";

type View = "desktop" | "mobile" | "html" | "text";

function Counter({ label, value, ideal }: { label: string; value: string; ideal: [number, number] }) {
  const n = value.length;
  const t = n <= ideal[1] && n >= ideal[0] ? "text-green" : n > ideal[1] * 1.3 ? "text-red" : "text-orange";
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
        {label} <span className={`ml-1 tabular-nums ${t}`}>{n}</span>
      </p>
      <p className="mt-0.5 truncate text-[13px] text-ink" title={value}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${active ? "text-green" : "text-ink-3 hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

export function EmailArtifact({ email }: { email: EmailDeliverable }) {
  const [view, setView] = useState<View>("desktop");
  const [copied, setCopied] = useState<"html" | "text" | null>(null);
  const slug = email.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "newsletter";

  const copy = (kind: "html" | "text") => {
    navigator.clipboard.writeText(kind === "html" ? email.html : email.text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const preview = view === "desktop" || view === "mobile";

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-primary">
          <Mail className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{email.name}</p>
          <p className="truncate text-[12px] text-ink-2">{email.fromName ? `From ${email.fromName} · ` : ""}HTML + plain text</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-[8px] bg-field p-0.5">
          {(
            [
              ["desktop", <Monitor key="d" className="h-3.5 w-3.5" />],
              ["mobile", <Smartphone key="m" className="h-3.5 w-3.5" />],
              ["html", "HTML"],
              ["text", "Text"],
            ] as [View, React.ReactNode][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              onClick={() => setView(key)}
              className={`flex h-6 items-center rounded-[6px] px-2 text-[11.5px] font-medium transition-colors ${view === key ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <ActionButton onClick={() => copy("html")} active={copied === "html"}>
          {copied === "html" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === "html" ? "Copied" : "Copy HTML"}
        </ActionButton>
        <ActionButton onClick={() => downloadBlob(new Blob([email.html], { type: "text/html" }), `${slug}.html`)}>
          <Download className="h-3 w-3" /> .html
        </ActionButton>
        <ActionButton onClick={() => downloadBlob(new Blob([email.text], { type: "text/plain" }), `${slug}.txt`)}>
          <Download className="h-3 w-3" /> .txt
        </ActionButton>
        <OpenInEditorButton
          title={email.name}
          from="Newsletter writer"
          files={[
            { path: `emails/${slug}.html`, content: email.html },
            { path: `emails/${slug}.txt`, content: email.text },
          ]}
        />
      </div>

      <div className="grid gap-3 border-b border-line px-4 py-3 sm:grid-cols-2">
        <Counter label="Subject" value={email.subject} ideal={[20, 50]} />
        <Counter label="Preheader" value={email.preheader} ideal={[40, 100]} />
      </div>

      {preview ? (
        <div className="flex justify-center bg-field/60 px-4 py-4">
          <div
            className="overflow-hidden rounded-[10px] border border-line bg-white shadow-card transition-[width] duration-300"
            style={{ width: view === "mobile" ? 375 : "100%", maxWidth: view === "mobile" ? 375 : 680 }}
          >
            <iframe
              title={`${email.name} preview (${view})`}
              srcDoc={email.html}
              sandbox=""
              className="block h-[560px] w-full bg-white"
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute right-3 top-2">
            <ActionButton onClick={() => copy(view === "html" ? "html" : "text")} active={copied === view}>
              {copied === view ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === view ? "Copied" : "Copy"}
            </ActionButton>
          </div>
          <pre className="max-h-[560px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap break-words text-ink">
            {view === "html" ? email.html : email.text}
          </pre>
        </div>
      )}

      {email.notes && <p className="border-t border-line px-4 py-2.5 text-[12px] leading-relaxed text-ink-2">{email.notes}</p>}
    </div>
  );
}
