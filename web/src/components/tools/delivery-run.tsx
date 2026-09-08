"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";
import type { StepStatus } from "@/components/approvals-ui/approval-node";
import { statusesForPhase } from "@/lib/tool-delivery";

type DeliveryRunValue = {
  policy: ApprovalPolicy;
  currentId: string;
  delivered: boolean;
  statuses: Record<string, StepStatus>;
  setPhase: (id: string) => void;
  approve: () => void;
  reset: () => void;
};

const DeliveryRunContext = createContext<DeliveryRunValue | null>(null);

export function DeliveryRunProvider({
  policy,
  children,
}: {
  policy: ApprovalPolicy;
  children: ReactNode;
}) {
  const root = policy.roots[0];
  const [currentId, setCurrentId] = useState(root);
  const [delivered, setDelivered] = useState(false);

  const setPhase = useCallback((nextId: string) => {
    setCurrentId((prev) => {
      if (prev !== nextId) setDelivered(false);
      return nextId;
    });
  }, []);

  const approve = useCallback(() => setDelivered(true), []);
  const reset = useCallback(() => {
    setDelivered(false);
    setCurrentId(root);
  }, [root]);

  const statuses = useMemo(
    () => statusesForPhase(policy, currentId, delivered),
    [policy, currentId, delivered],
  );

  const value = useMemo(
    () => ({ policy, currentId, delivered, statuses, setPhase, approve, reset }),
    [policy, currentId, delivered, statuses, setPhase, approve, reset],
  );

  return <DeliveryRunContext.Provider value={value}>{children}</DeliveryRunContext.Provider>;
}

export function useDeliveryRun(): DeliveryRunValue | null {
  return useContext(DeliveryRunContext);
}

export function useDeliveryPhase(id: string) {
  const setPhase = useDeliveryRun()?.setPhase;
  useEffect(() => {
    setPhase?.(id);
  }, [id, setPhase]);
}
