"use client";

import { Handle, Position } from "@xyflow/react";
import type { ReactNode } from "react";

import { FlowCard } from "@/components/flow/flow-card";
import { KindPill } from "@/components/flow/kind-pill";
import { StepBody } from "@/components/flow/step-body";
import type { StepKind } from "@/components/flow/step-kind";

export function StudioStep({
  kind,
  title,
  caption,
  active,
  dimmed,
  workbench,
  extra,
  onHost,
  isVertical,
  hasIncoming,
  hasOutgoing,
}: {
  kind: StepKind;
  title: string;
  caption?: string;
  active?: boolean;
  dimmed?: boolean;
  workbench?: boolean;
  extra?: ReactNode;
  onHost?: (el: HTMLElement | null) => void | (() => void);
  isVertical: boolean;
  hasIncoming?: boolean;
  hasOutgoing?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {hasIncoming !== false && (
        <Handle
          type="target"
          position={isVertical ? Position.Top : Position.Left}
          className="!bg-border !size-2 !border-none"
        />
      )}
      <KindPill kind={kind} />
      <FlowCard active={active} dimmed={dimmed} wide={workbench}>
        {workbench ? (
          <>
            <StepBody kind={kind} title={title} caption={caption} />
            {extra}
            <div
              ref={(el) => {
                if (!el) return;
                const cleanup = onHost?.(el);
                return () => {
                  if (typeof cleanup === "function") cleanup();
                  else onHost?.(null);
                };
              }}
              className="nowheel nodrag nopan max-h-[58vh] overflow-y-auto border-t border-border px-3 py-3"
            />
          </>
        ) : (
          <StepBody kind={kind} title={title} caption={caption} />
        )}
      </FlowCard>
      {hasOutgoing !== false && (
        <Handle
          type="source"
          position={isVertical ? Position.Bottom : Position.Right}
          className="!bg-border !size-2 !border-none"
        />
      )}
    </div>
  );
}
