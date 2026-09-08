"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { WorkflowCanvas } from "@/components/approvals-ui/workflow-canvas";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { Button } from "@/components/ui/agency-button";
import { LinkButton } from "@/components/ui/agency-button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import FaqsBlock from "@/components/blocks/faqs-1";
import type { Tool } from "@/lib/site-config";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";

const processingLabel: Record<Tool["processing"], string> = {
  client: "in-browser",
  server: "server",
  partner: "partner",
};

export function AgentStudio({
  tool,
  about,
  children,
}: {
  tool: Tool;
  about: ReactNode;
  children: ReactNode;
}) {
  const run = useDeliveryRunOrThrow();
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const selectedId = run.delivered ? "deliver" : run.dockId;

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col bg-background">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Tools
        </Link>
        <h1 className="text-sm font-semibold text-foreground sm:text-base">{tool.name}</h1>
        <ToolStatusBadge status={tool.status} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {processingLabel[tool.processing]}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setInfoOpen(true)} aria-label="About this tool">
            <CircleHelp className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">About</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={run.reset}>
            Reset
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[58%_42%]">
        <div className="h-[280px] border-b border-border md:h-auto md:border-r md:border-b-0">
          <WorkflowCanvas
            policy={run.policy}
            direction="LR"
            nodeSep={36}
            rankSep={72}
            selectedId={selectedId}
            statuses={run.statuses}
            onSelectStep={(id) => {
              if (!id) return;
              const status = run.statuses[id];
              if (status === "approved" || status === "pending") run.setDockId(id);
            }}
          />
        </div>
        <div className="min-h-[320px] overflow-y-auto p-4 sm:p-6">
          <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {run.policy.steps.find((step) => step.id === run.dockId)?.label ?? "Run"}
          </p>
          {children}
        </div>
      </div>

      <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{tool.name}</SheetTitle>
            <SheetDescription>{tool.shortDescription}</SheetDescription>
          </SheetHeader>
          <div className="space-y-8 px-4 pb-8">
            <div className="prose prose-slate max-w-none text-sm text-muted-foreground">{about}</div>
            {tool.faq.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">FAQ</h3>
                <div className="mt-3">
                  <FaqsBlock items={tool.faq} compact />
                </div>
              </div>
            )}
            <Card className="bg-primary p-5 text-primary-foreground">
              <h3 className="font-semibold">{tool.upsell.headline}</h3>
              <p className="mt-2 text-sm text-primary-foreground/80">{tool.upsell.body}</p>
              <LinkButton
                href="/pricing"
                variant="secondary"
                size="sm"
                className="mt-4 bg-background text-foreground hover:bg-background/90"
              >
                See the unlimited plan
              </LinkButton>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
