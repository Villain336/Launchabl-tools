"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/agency-button";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { SkillTimeline } from "@/components/tools/skill-timeline";
import { StudioCode } from "@/components/tools/studio-code";
import { StudioInsights } from "@/components/tools/studio-insights";
import { StudioThinking } from "@/components/tools/studio-thinking";
import { StudioTrigger } from "@/components/tools/studio-trigger";

export function AgentDock({
  intake,
  review,
  exportPanel,
}: {
  intake: ReactNode;
  review: ReactNode;
  exportPanel: ReactNode;
}) {
  const run = useDeliveryRunOrThrow();
  const phase = run.dockId;
  const canApprove = Boolean(run.deliverable) && run.gates.download === "locked";
  const hasCode = Boolean(run.deliverable?.artifacts.some((item) => item.text));

  if (phase === "submit") {
    return (
      <div className="bui space-y-4">
        <StudioTrigger />
        {intake}
      </div>
    );
  }

  if (phase === "scan") {
    return (
      <div className="bui space-y-4">
        <StudioThinking />
        <SkillTimeline log={run.skillLog} />
        {run.error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p>{run.error}</p>
            <Button className="mt-3" variant="secondary" size="sm" onClick={() => run.setDockId("submit")}>
              Try again
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (phase === "review") {
    return (
      <div className="bui space-y-4">
        {canApprove && (
          <Button className="sticky top-0 z-10 w-full" onClick={run.approve}>
            {run.agent?.approveLabel ?? "Approve result"}
          </Button>
        )}
        <StudioInsights />
        {hasCode && <StudioCode />}
        {review}
        {run.deliverable?.warnings.map((warning) => (
          <p key={warning} className="text-sm text-amber-800">
            {warning}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="bui space-y-4">
      {hasCode && <StudioCode />}
      {exportPanel}
    </div>
  );
}
