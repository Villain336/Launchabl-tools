"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { clsx } from "clsx";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { toolClusters, tools } from "@/lib/site-config";

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCluster("all")}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              activeCluster === "all" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
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
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {cluster.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <Link
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            className="group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all hover:border-indigo-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">{tool.name}</h3>
              <ToolStatusBadge status={tool.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{tool.shortDescription}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
              Open tool <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}

        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-slate-500">
            No tools match &ldquo;{query}&rdquo;. Try a different search or cluster.
          </p>
        )}
      </div>
    </div>
  );
}
