import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-800",
    info: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ToolStatusBadge({ status }: { status: "live" | "beta" | "coming-soon" }) {
  if (status === "live") return <Badge tone="success">Live</Badge>;
  if (status === "beta") return <Badge tone="info">Beta</Badge>;
  return <Badge tone="warning">Coming soon</Badge>;
}
