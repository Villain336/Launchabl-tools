"use client";

import { useDeliveryRun } from "@/components/tools/delivery-run";
import { cn } from "@/lib/utils";

export function ScanChips() {
  const run = useDeliveryRun();
  const log = run?.skillLog ?? [];
  if (log.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-3 pb-2.5">
      {log.map((skill) => (
        <span
          key={skill.id}
          className={cn(
            "inline-flex h-6 items-center rounded-[6px] px-1.5 text-[11px] font-medium",
            skill.status === "done" && "bg-emerald-50 text-emerald-800",
            skill.status === "running" && "bg-primary/10 text-primary",
            skill.status === "failed" && "bg-red-50 text-red-700",
            skill.status === "queued" && "bg-muted text-muted-foreground"
          )}
        >
          {skill.label}
        </span>
      ))}
    </div>
  );
}
