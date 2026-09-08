"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WorkflowCanvas } from "@/components/approvals-ui/workflow-canvas";
import { Button } from "@/components/ui/button";
import { toolboxHrefForStep, toolboxPolicy } from "@/lib/tools-workflow";

export function ToolsWorkflowCanvas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => toolboxPolicy.steps.find((step) => step.id === selectedId) ?? null,
    [selectedId],
  );
  const href = selectedId ? toolboxHrefForStep(selectedId) : null;

  return (
    <section className="border-b border-border bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Toolbox map</p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            How a job moves through Launchabl
          </h2>
          <p className="mt-3 text-muted-foreground">
            Pick a job, enter a cluster, use a free tool, then keep going free or graduate to the
            unlimited plan. Click any node to inspect it.
          </p>
        </div>

        <div className="mt-10 h-[min(78vh,760px)] overflow-hidden rounded-2xl border border-border bg-white">
          <WorkflowCanvas
            policy={toolboxPolicy}
            direction="LR"
            nodeSep={56}
            rankSep={90}
            selectedId={selectedId}
            onSelectStep={setSelectedId}
          />
        </div>

        {selected && (
          <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm text-foreground">
              <span className="font-semibold">{selected.label}</span>
              {selected.kind === "approval" && selected.approvers[0]?.title ? (
                <span className="text-muted-foreground"> — {selected.approvers[0].title}</span>
              ) : null}
            </p>
            {href && (
              <Button render={<Link href={href} />} nativeButton={false} size="sm">
                Open
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
