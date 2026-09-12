"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Code2, Copy, Download, Info, Pencil, XCircle } from "lucide-react";
import { downloadBlob } from "@/lib/download";
import { handoffUrl, stageHandoff, type HandoffFile } from "@/lib/ide/handoff";

/** Shared primitives for chat artifacts so every card reads the same. */

export const tone = {
  good: { text: "text-green", bg: "bg-green-tint", icon: CheckCircle2 },
  warn: { text: "text-orange", bg: "bg-orange-tint", icon: AlertTriangle },
  bad: { text: "text-red", bg: "bg-red-tint", icon: XCircle },
  info: { text: "text-accent-ink", bg: "bg-accent-tint", icon: Info },
  muted: { text: "text-ink-3", bg: "bg-field", icon: Info },
} as const;

export type Tone = keyof typeof tone;

export function Pill({ t, children, className = "" }: { t: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex h-[20px] items-center gap-1 rounded-[5px] px-1.5 text-[11px] font-medium ${tone[t].text} ${tone[t].bg} ${className}`}>{children}</span>;
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
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

/**
 * Text the user can fix in place before copying or downloading. Shows as
 * prose; a pencil switches to a textarea that grows with the content.
 * `original` lets the caller offer a reset and mark the block as edited.
 */
export function EditableText({
  value,
  original,
  onChange,
  className = "",
  editLabel = "Edit",
  actions,
}: {
  value: string;
  original?: string;
  onChange: (next: string) => void;
  className?: string;
  editLabel?: string;
  /** Extra buttons (Copy, Download) for the footer row, left of Edit. */
  actions?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const edited = original !== undefined && original !== value;
  const rows = Math.min(28, Math.max(3, value.split("\n").length + Math.ceil(value.length / 90)));
  return (
    <div className="group/edit relative" data-editable={editing ? "editing" : edited ? "edited" : "view"}>
      {editing ? (
        <textarea
          autoFocus
          value={value}
          rows={rows}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          className={`block w-full resize-y rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none focus:border-primary ${className}`}
        />
      ) : (
        <p className={`text-[13px] leading-relaxed whitespace-pre-wrap text-ink ${className}`}>{value}</p>
      )}
      <div className="mt-1 flex items-center justify-end gap-1">
        {actions && <span className="mr-auto flex items-center gap-1">{actions}</span>}
        {edited && (
          <>
            <span className="text-[10.5px] font-medium text-orange">edited</span>
            <button type="button" onClick={() => onChange(original)} className="h-6 rounded-[6px] px-1.5 text-[11px] text-ink-3 transition-colors hover:bg-hover hover:text-ink">
              Reset
            </button>
          </>
        )}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setEditing((v) => !v)}
          className={`inline-flex h-6 items-center gap-1 rounded-[6px] px-1.5 text-[11px] font-medium transition-colors hover:bg-hover hover:text-ink ${editing ? "text-ink" : "text-ink-3 opacity-60 group-hover/edit:opacity-100"}`}
        >
          <Pencil className="h-3 w-3" /> {editing ? "Done" : editLabel}
        </button>
      </div>
    </div>
  );
}

export function DownloadButton({ content, filename, type, label }: { content: string; filename: string; type: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadBlob(new Blob([content], { type }), filename)}
      className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
    >
      <Download className="h-3 w-3" /> {label}
    </button>
  );
}

/**
 * Hands the artifact's files to the code editor in a new tab, where they show
 * up as a diff review against the open project (or seed a new one).
 */
export function OpenInEditorButton({ title, from, files, label = "Open in editor" }: { title: string; from: string; files: HandoffFile[]; label?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      title="Review these files in the Launchabl code editor"
      onClick={() => {
        const id = stageHandoff({ title, from, files });
        if (!id) {
          setFailed(true);
          setTimeout(() => setFailed(false), 2000);
          return;
        }
        window.open(handoffUrl(id), "_blank", "noopener");
      }}
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${failed ? "text-red" : "text-ink-3 hover:text-ink"}`}
      data-open-in-editor
    >
      <Code2 className="h-3 w-3" /> {failed ? "Too large" : label}
    </button>
  );
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[] }) {
  return (
    <div className="flex items-center gap-0.5 rounded-[8px] bg-field p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`h-6 rounded-[6px] px-2 text-[11.5px] font-medium whitespace-nowrap transition-colors ${value === o.key ? "bg-surface text-ink shadow-card" : "text-ink-3 hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const t: Tone = score >= 80 ? "good" : score >= 55 ? "warn" : "bad";
  const r = size * 0.39;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={size * 0.09} className="stroke-line" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={size * 0.09} strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} className={tone[t].text} stroke="currentColor" />
      </svg>
      <span className={`font-semibold tabular-nums ${tone[t].text}`} style={{ fontSize: size * 0.29 }}>
        {score}
      </span>
    </div>
  );
}

export const shorten = (url: string, max = 70) => {
  const s = url.replace(/^https?:\/\//, "");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
};

export function ArtifactHeader({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-ink">{title}</p>
        <p className="truncate text-[12px] text-ink-2">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Footnote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-center gap-1.5 border-t border-line px-4 py-2 text-[11.5px] text-ink-3">
      {icon} {children}
    </p>
  );
}
