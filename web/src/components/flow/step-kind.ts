import {
  GitBranch,
  PackageCheck,
  Radar,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { FLOW_HUES } from "@/components/flow/tokens";

export type StepKindId = "trigger" | "process" | "condition" | "deliver";

export type StepKind = {
  id: StepKindId;
  label: string;
  hue: string;
  Icon: LucideIcon;
};

export const STEP_KINDS: Record<StepKindId, StepKind> = {
  trigger: { id: "trigger", label: "Trigger", hue: FLOW_HUES.trigger, Icon: Zap },
  process: { id: "process", label: "Process", hue: FLOW_HUES.process, Icon: Radar },
  condition: { id: "condition", label: "If / Else", hue: FLOW_HUES.condition, Icon: GitBranch },
  deliver: { id: "deliver", label: "Deliver", hue: FLOW_HUES.deliver, Icon: PackageCheck },
};

export function kindForStepId(stepId: string, terminal = false): StepKind {
  if (terminal || stepId === "deliver") return STEP_KINDS.deliver;
  if (stepId === "submit") return STEP_KINDS.trigger;
  if (stepId === "scan") return STEP_KINDS.process;
  if (stepId === "review") return STEP_KINDS.condition;
  return terminal ? STEP_KINDS.deliver : STEP_KINDS.process;
}
