"use client";

import type { SkillSource } from "@/lib/deliverable";

export function SourceChip({ source }: { source: SkillSource }) {
  const label = source.href ? `${source.kind} · ${source.note}` : `${source.kind} · ${source.note}`;
  return (
    <span
      title={`${source.kind}${source.href ? ` — ${source.href}` : ""} · ${new Date(source.retrievedAt).toLocaleString()}`}
      className="inline-flex max-w-full items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
