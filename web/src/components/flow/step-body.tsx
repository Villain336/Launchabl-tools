import type { StepKind } from "@/components/flow/step-kind";
import { mix } from "@/components/flow/tokens";

export function StepBody({
  kind,
  title,
  caption,
}: {
  kind: StepKind;
  title: string;
  caption?: string;
}) {
  const Icon = kind.Icon;
  return (
    <div className="flex items-center gap-2.5 p-2.5">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-[8px]"
        style={{
          background: mix(kind.hue, 12),
          color: kind.hue,
          boxShadow: `0 0 0 1px ${mix(kind.hue, 20)}`,
        }}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
          {title}
        </span>
        {caption && (
          <span className="mt-0.5 block truncate text-[12px] leading-snug text-muted-foreground">
            {caption}
          </span>
        )}
      </span>
    </div>
  );
}
