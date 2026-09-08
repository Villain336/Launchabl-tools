"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { WorkflowCanvas } from "@/components/approvals-ui/workflow-canvas";
import { Button } from "@/components/ui/button";
import { toolboxPolicy, toolboxStepDetail } from "@/lib/tools-workflow";

export function ToolsWorkflowCanvas() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const previewId = hoveredId ?? selectedId;
  const detail = useMemo(() => (previewId ? toolboxStepDetail(previewId) : null), [previewId]);

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
            unlimited plan. Hover a node for the full picture — click to pin it.
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
            onHoverStep={setHoveredId}
          />
        </div>

        {detail && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
            <div className="grid gap-0 sm:grid-cols-[220px_1fr]">
              <div className="relative min-h-[160px] bg-white">
                <Image
                  src={detail.image}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-contain p-4"
                />
              </div>
              <div className="flex flex-col justify-between gap-4 border-t border-border p-5 sm:border-t-0 sm:border-l">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                    {detail.kind === "cluster"
                      ? "Outcome cluster"
                      : detail.kind === "tool"
                        ? "Free tool"
                        : detail.kind === "terminal"
                          ? "Next step"
                          : "Toolbox"}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{detail.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{detail.blurb}</p>
                  {detail.tools.length > 0 && (
                    <p className="mt-3 text-sm text-foreground">
                      <span className="font-medium">
                        {detail.kind === "cluster" ? "Tools in this cluster: " : "Also in this cluster: "}
                      </span>
                      <span className="text-muted-foreground">
                        {detail.tools.map((tool) => tool.name).join(" · ")}
                      </span>
                    </p>
                  )}
                </div>
                {detail.href && (
                  <Button
                    render={<Link href={detail.href} />}
                    nativeButton={false}
                    className="w-fit"
                  >
                    {detail.cta}
                    <ArrowRight data-icon="inline-end" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
