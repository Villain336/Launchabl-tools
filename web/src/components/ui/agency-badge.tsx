import type { ReactNode } from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";

type Tone = "default" | "success" | "warning" | "info";

const toneVariant: Record<Tone, "secondary" | "success" | "warning" | "info"> = {
  default: "secondary",
  success: "success",
  warning: "warning",
  info: "info",
};

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <ShadcnBadge variant={toneVariant[tone]} className={className}>
      {children}
    </ShadcnBadge>
  );
}

export function ToolStatusBadge({ status }: { status: "live" | "beta" | "coming-soon" }) {
  if (status === "live") return <Badge tone="success">Live</Badge>;
  if (status === "beta") return <Badge tone="info">Beta</Badge>;
  return <Badge tone="warning">Coming soon</Badge>;
}
