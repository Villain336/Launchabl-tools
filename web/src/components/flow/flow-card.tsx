import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FlowCard({
  active,
  dimmed,
  wide,
  children,
  className,
}: {
  active?: boolean;
  dimmed?: boolean;
  wide?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] bg-card text-left transition-shadow duration-150",
        wide ? "w-[32rem] max-w-[min(32rem,calc(100vw-2rem))]" : "w-[280px]",
        dimmed && "opacity-45",
        active
          ? "shadow-[0_0_0_1.5px_var(--primary),0_2px_10px_rgba(0,0,0,0.045)]"
          : "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_var(--border)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06),0_0_0_1px_var(--border)]",
        className
      )}
    >
      {children}
    </div>
  );
}
