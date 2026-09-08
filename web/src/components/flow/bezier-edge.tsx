"use client";

import {
  BaseEdge,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";

export type FlowBezierEdge = Edge<{ lit?: boolean; pending?: boolean }>;

export function FlowBezierEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<FlowBezierEdge>) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const lit = Boolean(data?.lit);
  const pending = Boolean(data?.pending);

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: lit ? "var(--primary)" : "color-mix(in srgb, var(--border) 80%, var(--foreground))",
        strokeWidth: lit ? 1.6 : 1.25,
        strokeDasharray: pending ? "6 5" : undefined,
      }}
      className={pending ? "flow-edge-pending" : undefined}
    />
  );
}
