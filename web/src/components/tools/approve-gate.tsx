"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeliveryRun } from "@/components/tools/delivery-run";

export function ApproveGate({
  ready,
  label = "Approve result",
  children,
}: {
  ready: boolean;
  label?: string;
  children: ReactNode;
}) {
  const run = useDeliveryRun();
  if (!ready) return null;
  if (!run) return <>{children}</>;
  if (!run.delivered) {
    return (
      <Button onClick={run.approve} className="mt-4">
        {label}
      </Button>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
        <Check className="h-4 w-4" /> Approved — result unlocked
      </p>
      <div>{children}</div>
    </div>
  );
}
