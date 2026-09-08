"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { WorkflowCanvas } from "@/components/approvals-ui/workflow-canvas";
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
  const [fallback, setFallback] = useState<HTMLDivElement | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const hostStepRef = useRef<string | null>(null);

  const onWorkbenchHost = useCallback((stepId: string, el: HTMLElement | null) => {
    if (el) {
      hostStepRef.current = stepId;
      setHost(el);
      return;
    }
    if (hostStepRef.current === stepId) {
      hostStepRef.current = null;
      setHost(null);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.studio = "open";
    return () => {
      document.body.style.overflow = previous;
      delete document.body.dataset.studio;
    };
  }, []);

  const selectedId = run.delivered ? "deliver" : run.dockId;
  const target = host ?? fallback;

  return (
    <div className="fixed inset-0 z-[80] bg-background">
      <div
        ref={setFallback}
        hidden
        className="hidden"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        <Link
          href="/tools"
          className="pointer-events-auto inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm text-foreground shadow-sm hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Tools
        </Link>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setInfoOpen(true)}
            aria-label={`About ${tool.name}`}
          >
            <CircleHelp className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={run.reset}>
            Reset
          </Button>
        </div>
      </div>

      <WorkflowCanvas
        policy={run.policy}
        direction="LR"
        variant="studio"
        nodeSep={48}
        rankSep={160}
        selectedId={selectedId}
        workbenchStepId={run.dockId}
        onWorkbenchHost={onWorkbenchHost}
        statuses={run.statuses}
        onSelectStep={(id) => {
          if (!id) return;
          const status = run.statuses[id];
          if (status === "approved" || status === "pending") run.setDockId(id);
        }}
      />

      {target ? createPortal(children, target) : null}

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
