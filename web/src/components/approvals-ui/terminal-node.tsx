"use client";

import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { CircleCheck, CircleX } from "lucide-react";
import type { StepChange } from "@/lib/approvals-ui/diff";
import type { TerminalStep } from "@/lib/approvals-ui/policy";
import type { IssueSeverity } from "@/lib/approvals-ui/validate";

import { stateRing, type StepStatus } from "@/components/approvals-ui/approval-node";
import { kindForStepId } from "@/components/flow/step-kind";
import { StudioStep } from "@/components/flow/studio-step";
import { cn } from "@/lib/utils";

export type TerminalNodeData = {
  step: TerminalStep;
  change?: StepChange["kind"];
  issue?: IssueSeverity;
  status?: StepStatus;
  selected?: boolean;
  vertical?: boolean;
  studio?: boolean;
  workbenchActive?: boolean;
  onWorkbenchHost?: (stepId: string, el: HTMLElement | null) => void;
  [key: string]: unknown;
};

export type TerminalFlowNode = Node<TerminalNodeData, "terminal">;

export const TerminalNode = ({ data }: NodeProps<TerminalFlowNode>) => {
  const { step } = data;
  const isVertical = data.vertical !== false;
  const isApproved = step.outcome === "approved";
  const workbenchActive = Boolean(data.workbenchActive);
  const onWorkbenchHost = data.onWorkbenchHost;
  const studio = Boolean(data.studio);

  if (studio) {
    return (
      <StudioStep
        kind={kindForStepId(step.id, true)}
        title={step.label}
        caption={isApproved ? "Ready to export" : "Locked until you approve"}
        active={Boolean(data.selected) || workbenchActive}
        dimmed={data.status === "skipped"}
        workbench={workbenchActive}
        onHost={(el) => {
          if (!el) {
            onWorkbenchHost?.(step.id, null);
            return;
          }
          onWorkbenchHost?.(step.id, el);
          return () => onWorkbenchHost?.(step.id, null);
        }}
        isVertical={isVertical}
        hasOutgoing={false}
      />
    );
  }

  if (workbenchActive) {
    return (
      <div
        className={cn(
          "bg-card text-card-foreground w-[32rem] max-w-[min(32rem,calc(100vw-2rem))] cursor-pointer rounded-xl border shadow-sm",
          data.status === "skipped" && "opacity-45",
          stateRing(data)
        )}
      >
        <Handle
          type="target"
          position={isVertical ? Position.Top : Position.Left}
          className="!bg-border !size-2 !border-none"
        />
        <div className="flex items-center gap-2 px-3.5 py-3">
          {isApproved ? (
            <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CircleX className="size-4 shrink-0 text-red-600 dark:text-red-400" />
          )}
          <span className="text-sm leading-tight font-medium">{step.label}</span>
        </div>
        <div
          ref={(el) => {
            if (!el) return;
            onWorkbenchHost?.(step.id, el);
            return () => onWorkbenchHost?.(step.id, null);
          }}
          className="nowheel nodrag nopan max-h-[62vh] overflow-y-auto border-t border-border px-3.5 py-3"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 shadow-sm",
        data.status === "skipped" && "opacity-45",
        stateRing(data)
      )}
    >
      <Handle
        type="target"
        position={isVertical ? Position.Top : Position.Left}
        className="!bg-border !size-2 !border-none"
      />
      {isApproved ? (
        <CircleCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleX className="size-4 shrink-0 text-red-600 dark:text-red-400" />
      )}
      <span className="text-sm leading-none font-medium">{step.label}</span>
    </div>
  );
};
