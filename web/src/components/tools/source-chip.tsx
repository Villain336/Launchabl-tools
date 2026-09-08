"use client";

import type { SkillSource } from "@/lib/deliverable";

export function SourceChip({ source }: { source: SkillSource }) {
  return (
    <span
      title={`${source.kind}${source.href ? ` — ${source.href}` : ""} · ${new Date(source.retrievedAt).toLocaleString()}`}
      className="inline-flex h-6 max-w-full items-center gap-1 rounded-[6px] bg-background px-1.5 text-[12px] font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
      <span className="truncate">{source.kind}</span>
      {source.note && <span className="truncate text-muted-foreground">{source.note}</span>}
    </span>
  );
}
