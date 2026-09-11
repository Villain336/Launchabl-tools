"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { clsx } from "clsx";
import { tools, type ToolStatus } from "@/lib/site-config";
import { ToolCard } from "@/components/tools/tool-card";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | ToolStatus;

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All tools" },
  { value: "live", label: "Live" },
  { value: "beta", label: "Beta" },
  { value: "coming-soon", label: "Coming soon" },
];

const statusOrder: Record<ToolStatus, number> = { live: 0, beta: 1, "coming-soon": 2 };

export function ToolsExplorer() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools
      .filter((tool) => {
        const matchesStatus = status === "all" || tool.status === status;
        const matchesQuery =
          q.length === 0 ||
          tool.name.toLowerCase().includes(q) ||
          tool.shortDescription.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [query, status]);

  const available = statusFilters.filter(
    (f) => f.value === "all" || tools.some((tool) => tool.status === f.value),
  );

  return (
    <div id="toolbox" className="mt-10 scroll-mt-28">
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
          {available.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              className={clsx(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                status === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              {filter.label}
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
            No tools match &ldquo;{query}&rdquo;. Try a different search.
          </p>
        )}
      </div>
    </div>
  );
}
