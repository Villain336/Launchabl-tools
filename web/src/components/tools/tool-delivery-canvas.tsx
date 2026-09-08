"use client";

import { WorkflowCanvas } from "@/components/approvals-ui/workflow-canvas";
import { useDeliveryRun } from "@/components/tools/delivery-run";

export function ToolDeliveryCanvas() {
  const run = useDeliveryRun();
  if (!run) return null;

  return (
    <div className="mb-8">
      <div className="mb-3">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Delivery flow</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This tool ships a result through an approval chain. Complete each gate, then approve to
          unlock the download.
        </p>
      </div>
      <div className="h-[280px] overflow-hidden rounded-2xl border border-border bg-white sm:h-[320px]">
        <WorkflowCanvas
          policy={run.policy}
          direction="LR"
          nodeSep={36}
          rankSep={72}
          selectedId={run.delivered ? "deliver" : run.currentId}
          statuses={run.statuses}
        />
      </div>
    </div>
  );
}
