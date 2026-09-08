"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { toolClusters, tools } from "@/lib/site-config";
import { ToolCard } from "@/components/tools/tool-card";
import { Input } from "@/components/ui/input";

export function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [activeCluster, setActiveCluster] = useState<string | "all">("all");

  useEffect(() => {
    // One-time sync from the URL hash (an external system unavailable during SSR),
    // e.g. deep links from the homepage like /tools#audits-reports.
    const hash = window.location.hash.replace("#", "");
    if (hash && toolClusters.some((c) => c.slug === hash)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCluster(hash);
    }
  }, []);

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      const matchesCluster = activeCluster === "all" || tool.cluster === activeCluster;
      const matchesQuery =
        query.trim().length === 0 ||
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.shortDescription.toLowerCase().includes(query.toLowerCase());
      return matchesCluster && matchesQuery;
    });
  }, [query, activeCluster]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="rounded-full pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCluster("all")}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCluster === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
            )}
          >
            All tools
          </button>
          {toolClusters.map((cluster) => (
            <button
              key={cluster.slug}
              onClick={() => setActiveCluster(cluster.slug)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                activeCluster === cluster.slug
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {cluster.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
            No tools match &ldquo;{query}&rdquo;. Try a different search or cluster.
          </p>
        )}
      </div>
    </div>
  );
}
