"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Globe } from "lucide-react";

import { FlowGrip } from "@/components/flow/grip";
import { SelectChip, SourceChip, type ChipItem } from "@/components/flow/select-chip";

export type ConditionLine = {
  join: "If" | "and" | "else";
  source: string;
  sourceIcon?: ReactNode;
  fieldId: string;
  fieldItems: ChipItem[];
  valueId: string;
  valueItems: ChipItem[];
};

export function ConditionRows({
  lines,
  values,
  onChange,
}: {
  lines: ConditionLine[];
  values: Record<string, string>;
  onChange: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest("[data-ui]")) setOpen(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const toggle = (id: string) => setOpen((current) => (current === id ? null : id));
  const pick = (id: string, name: string) => {
    onChange(id, name);
    setOpen(null);
  };

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5">
      {lines.map((line) => (
        <div key={line.fieldId} className="flex min-w-0 flex-wrap items-center gap-1.5">
          <FlowGrip />
          <span className="w-7 text-[12.5px] text-muted-foreground">{line.join}</span>
          <SourceChip
            label={line.source}
            icon={line.sourceIcon ?? <Globe className="size-3" />}
          />
          <SelectChip
            id={line.fieldId}
            value={values[line.fieldId] ?? line.fieldItems[0]?.name ?? ""}
            items={line.fieldItems}
            width="w-36"
            open={open === line.fieldId}
            onToggle={toggle}
            onPick={pick}
          />
          <span className="text-[12.5px] text-muted-foreground">is</span>
          <SelectChip
            id={line.valueId}
            value={values[line.valueId] ?? line.valueItems[0]?.name ?? ""}
            items={line.valueItems}
            width="w-52"
            align="right"
            dot
            open={open === line.valueId}
            onToggle={toggle}
            onPick={pick}
          />
        </div>
      ))}
    </div>
  );
}
