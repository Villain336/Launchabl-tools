import { mix } from "@/components/flow/tokens";
import type { StepKind } from "@/components/flow/step-kind";

export function KindPill({ kind }: { kind: StepKind }) {
  return (
    <span
      className="inline-flex h-6 items-center rounded-[6px] px-2 text-[11.5px] font-medium"
      style={{
        background: mix(kind.hue, 14, "var(--background)"),
        color: mix(kind.hue, 80, "var(--foreground)"),
      }}
    >
      {kind.label}
    </span>
  );
}
