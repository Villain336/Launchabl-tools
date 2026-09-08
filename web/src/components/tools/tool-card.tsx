import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { Button } from "@/components/ui/button";
import { artForTool } from "@/lib/marquee-art";
import type { Tool } from "@/lib/site-config";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/tools/${tool.slug}`}
        className="relative block aspect-[16/10] bg-white"
        aria-hidden="true"
        tabIndex={-1}
      >
        <Image
          src={artForTool(tool)}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-contain p-5"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">{tool.name}</h3>
          <ToolStatusBadge status={tool.status} />
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{tool.shortDescription}</p>
        <Button
          render={<Link href={`/tools/${tool.slug}`} />}
          nativeButton={false}
          className="mt-4 w-full"
        >
          Launch
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
