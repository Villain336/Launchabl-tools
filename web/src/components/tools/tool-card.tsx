import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/site-config";

export function ToolCard({ tool, highlight = false }: { tool: Tool; highlight?: boolean }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="group block h-full">
      <CardSpotlight
        className={cn(
          "flex h-full flex-col justify-between p-6",
          highlight && "ring-1 ring-primary/40",
        )}
      >
        <div className="relative z-20">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
              {tool.name}
            </h3>
            <ToolStatusBadge status={tool.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{tool.shortDescription}</p>
        </div>
        <span className="relative z-20 mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open tool <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </CardSpotlight>
    </Link>
  );
}
