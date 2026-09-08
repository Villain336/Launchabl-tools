"use client";

import { useMemo, useState } from "react";
import ThinkingState, { type ThinkingRow } from "@/components/primitives/ThinkingState";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";

const TABS = ["Steps", "Reasoning", "Search", "Coding"] as const;

export function StudioThinking() {
  const run = useDeliveryRunOrThrow();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Steps");

  const rows = useMemo(() => {
    const skills: ThinkingRow[] = run.skillLog.map((skill) => ({
      primary: skill.label,
      secondary: skill.detail,
      mono: tab === "Coding",
    }));
    if (tab === "Search") {
      return run.skillLog.flatMap((skill) =>
        skill.sources.map((source) => ({
          primary: source.kind,
          secondary: source.note,
          href: source.href,
        })),
      );
    }
    if (tab === "Reasoning") {
      return run.skillLog.map((skill) => ({
        primary: skill.detail
          ? `${skill.label}: ${skill.detail}`
          : `${skill.label} is ${skill.status}.`,
      }));
    }
    if (tab === "Coding") {
      return run.skillLog.map((skill) => ({
        primary: "Run",
        secondary: skill.id,
        mono: true,
      }));
    }
    return skills;
  }, [run.skillLog, tab]);

  const query = run.brief || run.deliverable?.title;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={tab === item}
            onClick={() => setTab(item)}
            className={`rounded-[6px] px-2 py-[3px] text-[12px] ${
              tab === item ? "bg-field text-ink" : "text-ink-3 hover:text-ink"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <ThinkingState
        key={`${tab}-${run.skillLog.length}`}
        variant={tab}
        rows={rows.length > 0 ? rows : undefined}
        query={tab === "Search" ? query : undefined}
        active={run.scanning ? tab : undefined}
        done={run.scanning ? undefined : `${tab} settled`}
      />
    </div>
  );
}
