"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, FileDiff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { diffStats, type AppliedEdit } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

const DiffView = dynamic(() => import("@/components/ide/diff-view"), { ssr: false, loading: () => <div className="p-3 text-[12px] text-muted-foreground">Loading diff…</div> });

export type ReviewDecision = "pending" | "accepted" | "rejected";

export type Review = {
  summary: string;
  edits: AppliedEdit[];
  decisions: Record<string, ReviewDecision>;
};

type Props = {
  review: Review;
  onDecide: (paths: string[], decision: "accepted" | "rejected") => void;
  onOpenFile?: (path: string) => void;
};

function kindOf(edit: AppliedEdit): { label: string; className: string } {
  if (edit.before === null) return { label: "new", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
  if (edit.after === null) return { label: "delete", className: "bg-red-500/10 text-red-700 dark:text-red-400" };
  return { label: "edit", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
}

/**
 * Diff-first review of what the assistant proposed. Each file is accepted or
 * rejected on its own; nothing touches the workspace until Accept.
 */
export function EditReview({ review, onDecide, onOpenFile }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const valid = review.edits.filter((e) => e.ok);
  const pending = valid.filter((e) => review.decisions[e.path] === "pending" || !review.decisions[e.path]);
  const failed = review.edits.filter((e) => !e.ok);

  return (
    <div className="not-prose overflow-hidden rounded-lg border border-border bg-card text-[12.5px]" data-ide-review data-pending={pending.length}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <FileDiff className="size-4 text-primary" />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{review.summary}</span>
        {pending.length > 1 && (
          <div className="flex items-center gap-1">
            <Button type="button" size="xs" variant="outline" onClick={() => onDecide(pending.map((e) => e.path), "rejected")} data-ide-reject-all>
              <X className="size-3" /> Reject all
            </Button>
            <Button type="button" size="xs" onClick={() => onDecide(pending.map((e) => e.path), "accepted")} data-ide-accept-all>
              <Check className="size-3" /> Accept all ({pending.length})
            </Button>
          </div>
        )}
      </div>
      <ul className="divide-y divide-border">
        {valid.map((edit) => {
          const decision = review.decisions[edit.path] ?? "pending";
          const kind = kindOf(edit);
          const stats = diffStats(edit.before, edit.after);
          const expanded = open[edit.path] ?? decision === "pending";
          return (
            <li key={edit.path} data-ide-review-file={edit.path} data-decision={decision}>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button type="button" onClick={() => setOpen((o) => ({ ...o, [edit.path]: !expanded }))} className="rounded p-0.5 text-muted-foreground hover:bg-muted" aria-label={expanded ? "Collapse" : "Expand"}>
                  {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
                <span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold uppercase", kind.className)}>{kind.label}</span>
                <button type="button" onClick={() => onOpenFile?.(edit.path)} className="min-w-0 flex-1 truncate text-left font-mono text-[12px] text-foreground hover:underline" title="Open in editor">
                  {edit.path}
                </button>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                  <span className="text-emerald-600">+{stats.added}</span> <span className="text-red-600">−{stats.removed}</span>
                </span>
                {decision === "pending" ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" size="xs" variant="ghost" onClick={() => onDecide([edit.path], "rejected")} aria-label={`Reject ${edit.path}`} data-ide-reject>
                      <X className="size-3" /> Reject
                    </Button>
                    <Button type="button" size="xs" onClick={() => onDecide([edit.path], "accepted")} aria-label={`Accept ${edit.path}`} data-ide-accept>
                      <Check className="size-3" /> Accept
                    </Button>
                  </div>
                ) : (
                  <span className={cn("shrink-0 text-[11.5px] font-medium", decision === "accepted" ? "text-emerald-600" : "text-muted-foreground")}>{decision === "accepted" ? "Accepted" : "Rejected"}</span>
                )}
              </div>
              {expanded && (
                <div className="border-t border-border">
                  <DiffView path={edit.path} before={edit.before} after={edit.after} />
                </div>
              )}
            </li>
          );
        })}
        {failed.map((edit) => (
          <li key={`${edit.path}-failed`} className="flex items-start gap-2 px-3 py-2 text-[12px]" data-ide-review-failed={edit.path}>
            <X className="mt-0.5 size-3.5 shrink-0 text-red-600" />
            <span>
              <span className="font-mono text-foreground">{edit.path}</span> <span className="text-muted-foreground">— {edit.error}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
