"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

import { FLOW_HUES } from "@/components/flow/tokens";
import { cn } from "@/lib/utils";

export type ChipItem = { name: string; tag?: string };

function ChipMenu({
  items,
  value,
  width,
  align,
  onPick,
}: {
  items: ChipItem[];
  value: string;
  width: string;
  align: "left" | "right";
  onPick: (name: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const valueIndex = items.findIndex((item) => item.name === value);

  useLayoutEffect(() => {
    const row = rowRefs.current[hovered ?? valueIndex];
    if (row) setBox({ top: row.offsetTop, height: row.offsetHeight });
  }, [hovered, valueIndex]);

  return (
    <div
      data-ui
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "absolute bottom-full z-20 mb-1.5 rounded-[10px] bg-card p-1 shadow-[0_8px_28px_rgba(0,0,0,0.12),0_0_0_1px_var(--border)]",
        width,
        align === "right" ? "right-0" : "left-0"
      )}
      style={{
        animation: "flow-pop 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: align === "right" ? "bottom right" : "bottom left",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-muted"
        style={{
          top: box?.top ?? 0,
          height: box?.height ?? 0,
          opacity: box && hovered !== null ? 1 : 0,
          transition:
            "top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease",
        }}
      />
      {items.map((item, i) => (
        <button
          key={item.name}
          type="button"
          ref={(el) => {
            rowRefs.current[i] = el;
          }}
          onMouseEnter={() => setHovered(i)}
          onClick={() => onPick(item.name)}
          className="relative z-10 flex h-8 w-full cursor-pointer items-center gap-2 rounded-[6px] px-2 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
            {item.name}
          </span>
          {item.tag && <span className="shrink-0 text-[11px] text-muted-foreground">{item.tag}</span>}
          <span className={cn("shrink-0 text-foreground", item.name !== value && "invisible")}>
            <Check className="size-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}

export function SelectChip({
  id,
  value,
  dot,
  items,
  width,
  align = "left",
  open,
  onToggle,
  onPick,
}: {
  id: string;
  value: string;
  dot?: boolean;
  items: ChipItem[];
  width: string;
  align?: "left" | "right";
  open: boolean;
  onToggle: (id: string) => void;
  onPick: (id: string, name: string) => void;
}) {
  return (
    <span data-ui className="relative inline-flex min-w-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onToggle(id)}
        className={cn(
          "inline-flex h-6 min-w-0 cursor-pointer items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium text-foreground transition-colors duration-100",
          open ? "bg-muted" : "bg-background hover:bg-muted"
        )}
      >
        {dot && (
          <span className="size-1.5 shrink-0 rounded-full" style={{ background: FLOW_HUES.condition }} />
        )}
        <span className="min-w-0 truncate">{value}</span>
        <ChevronDown className="size-2.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <ChipMenu
          items={items}
          value={value}
          width={width}
          align={align}
          onPick={(name) => onPick(id, name)}
        />
      )}
    </span>
  );
}

export function SourceChip({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <span
      data-ui
      className="inline-flex h-6 shrink-0 items-center gap-1 rounded-[6px] bg-card px-1.5 text-[12px] font-medium text-foreground shadow-[0_0_0_1px_var(--border)]"
    >
      {icon && <span className="text-muted-foreground">{icon}</span>}
      {label}
    </span>
  );
}
