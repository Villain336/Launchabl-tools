"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Copy, Download, Info, XCircle } from "lucide-react";
import { downloadBlob } from "@/lib/download";

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
