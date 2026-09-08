"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";
import type { StepStatus } from "@/components/approvals-ui/approval-node";
import { statusesForPhase } from "@/lib/tool-delivery";
import type { Deliverable, GateState, SkillResult } from "@/lib/deliverable";
import { runSkillSequence, type SkillExecutor } from "@/lib/skills/runtime";
import type { ToolAgent } from "@/lib/tool-agents";

export type DeliveryRunValue = {
  policy: ApprovalPolicy;
  agent: ToolAgent | null;
  currentId: string;
  dockId: string;
  delivered: boolean;
  statuses: Record<string, StepStatus>;
  skillLog: SkillResult[];
  output: unknown;
  deliverable: Deliverable | null;
  error: string | null;
  scanning: boolean;
  gates: { download: GateState; push?: GateState; publish?: GateState };
  brief: string;
  setBrief: (brief: string) => void;
  setPhase: (id: string) => void;
  setDockId: (id: string) => void;
  approve: () => void;
  reset: () => void;
  runScan: (
    execute: SkillExecutor,
    finish: (log: SkillResult[]) => { deliverable: Deliverable; output?: unknown },
  ) => Promise<boolean>;
};

const DeliveryRunContext = createContext<DeliveryRunValue | null>(null);

export function DeliveryRunProvider({
  policy,
  agent = null,
  children,
}: {
  policy: ApprovalPolicy;
  agent?: ToolAgent | null;
  children: ReactNode;
}) {
  const root = policy.roots[0];
  const [currentId, setCurrentId] = useState(root);
  const [dockId, setDockId] = useState(root);
  const [delivered, setDelivered] = useState(false);
  const [skillLog, setSkillLog] = useState<SkillResult[]>([]);
  const [output, setOutput] = useState<unknown>(null);
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [gates, setGates] = useState<{ download: GateState; push?: GateState; publish?: GateState }>({
    download: "locked",
  });
  const [brief, setBrief] = useState("");

  const setPhase = useCallback((nextId: string) => {
    setCurrentId((prev) => {
      if (prev !== nextId) setDelivered(false);
      return nextId;
    });
    setDockId(nextId);
  }, []);

  const approve = useCallback(() => {
    setDelivered(true);
    setGates((prev) => ({ ...prev, download: "ready" }));
    setCurrentId("deliver");
    setDockId("deliver");
    setDeliverable((prev) =>
      prev ? { ...prev, gates: { ...prev.gates, download: "ready" } } : prev,
    );
  }, []);

  const reset = useCallback(() => {
    setDelivered(false);
    setCurrentId(root);
    setDockId(root);
    setSkillLog([]);
    setOutput(null);
    setDeliverable(null);
    setError(null);
    setScanning(false);
    setGates({ download: "locked" });
    setBrief("");
  }, [root]);

  const runScan = useCallback(
    async (
      execute: SkillExecutor,
      finish: (log: SkillResult[]) => { deliverable: Deliverable; output?: unknown },
    ) => {
      if (!agent) return false;
      setScanning(true);
      setError(null);
      setOutput(null);
      setDeliverable(null);
      setDelivered(false);
      setGates({ download: "locked" });
      setCurrentId("scan");
      setDockId("scan");

      const result = await runSkillSequence({
        skills: agent.skills,
        requiredAccuracy: agent.requiredAccuracy,
        execute,
        onLog: setSkillLog,
      });

      setScanning(false);
      if (!result.ok) {
        setError(result.error ?? "Scan failed.");
        return false;
      }
      const finished = finish(result.log);
      setOutput(finished.output ?? finished.deliverable);
      setDeliverable(finished.deliverable);
      setCurrentId("review");
      setDockId("review");
      return true;
    },
    [agent],
  );

  const statuses = useMemo(
    () => statusesForPhase(policy, currentId, delivered),
    [policy, currentId, delivered],
  );

  const value = useMemo(
    () => ({
      policy,
      agent,
      currentId,
      dockId,
      delivered,
      statuses,
      skillLog,
      output,
      deliverable,
      error,
      scanning,
      gates,
      brief,
      setBrief,
      setPhase,
      setDockId,
      approve,
      reset,
      runScan,
    }),
    [
      policy,
      agent,
      currentId,
      dockId,
      delivered,
      statuses,
      skillLog,
      output,
      deliverable,
      error,
      scanning,
      gates,
      brief,
      setPhase,
      approve,
      reset,
      runScan,
    ],
  );

  return <DeliveryRunContext.Provider value={value}>{children}</DeliveryRunContext.Provider>;
}

export function useDeliveryRun(): DeliveryRunValue | null {
  return useContext(DeliveryRunContext);
}

export function useDeliveryRunOrThrow(): DeliveryRunValue {
  const run = useContext(DeliveryRunContext);
  if (!run) throw new Error("useDeliveryRunOrThrow must be used inside DeliveryRunProvider");
  return run;
}
