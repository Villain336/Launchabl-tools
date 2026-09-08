import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/site-config";

export function ToolCard({ tool, highlight = false }: { tool: Tool; highlight?: boolean }) {
  return (
    <Link href={`/tools/${tool.slug}`} className="group block h-full">
      <Card
        className={cn(
          "h-full justify-between p-6 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30",
          highlight && "ring-primary/20 bg-primary/[0.03]",
        )}
      >
        <CardHeader className="gap-2 p-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold transition-colors group-hover:text-primary">
              {tool.name}
            </CardTitle>
            <ToolStatusBadge status={tool.status} />
          </div>
          <CardDescription>{tool.shortDescription}</CardDescription>
        </CardHeader>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open tool <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Card>
    </Link>
  );
}
