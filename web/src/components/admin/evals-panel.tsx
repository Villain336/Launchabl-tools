"use client";

import { useCallback, useEffect, useState } from "react";
import { FlaskConical, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EvalRun } from "@/lib/evals/run";
import { getToolBySlug } from "@/lib/site-config";

type EvalsPayload = {
  cases: { id: string; slug: string; cost: "cheap" | "model" | "media"; expectTools: string[] }[];
  latest: EvalRun | null;
  runs: Array<Pick<EvalRun, "id" | "startedAt" | "summary">>;
};

const labelFor = (slug: string) => (slug === "agent" ? "Agent" : getToolBySlug(slug)?.name ?? slug);
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  const tone = score >= 80 ? "text-green-700" : score >= 60 ? "text-amber-600" : "text-red-600";
  return <span className={`font-medium tabular-nums ${tone}`}>{score}</span>;
}

/**
 * Golden-brief evals: every case runs the production runtime and is scored
 * by the reviewer model. Shows the latest result per case and lets you
 * re-run one case or the whole suite. Runs cost real model calls.
 */
export function EvalsPanel({ token }: { token: string }) {
  const [data, setData] = useState<EvalsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string[] | "all" | null>(null);

  const headers = useCallback(() => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), [token]);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/evals", { headers: headers(), cache: "no-store" });
      const body = (await response.json()) as EvalsPayload & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      setData(body);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't load evals.");
    }
  }, [headers]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const run = async (ids?: string[]) => {
    setRunning(ids ?? "all");
    try {
      const response = await fetch("/api/admin/evals", { method: "POST", headers: headers(), body: JSON.stringify({ ids, concurrency: 3 }) });
      const body = (await response.json()) as EvalRun & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Run failed.");
    } finally {
      setRunning(null);
    }
  };

  const latestById = new Map((data?.latest?.results ?? []).map((r) => [r.id, r]));
  const summary = data?.latest?.summary;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white" data-evals-panel>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
            Quality evals
          </h2>
          <p className="text-xs text-muted-foreground">
            Golden briefs run through the real runtimes and scored by the reviewer model. Pass = expected tools ran and score ≥ 80.
            {summary && data?.latest && (
              <>
                {" "}
                Last run {when(data.latest.finishedAt)}: <span className="font-medium text-foreground">{summary.passed}/{summary.cases}</span> passed · avg{" "}
                <span className="font-medium text-foreground">{summary.avgScore ?? "—"}</span> · tool hit {(summary.toolHitRate * 100).toFixed(0)}%
                {summary.errors ? <span className="text-red-600"> · {summary.errors} errors</span> : null}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={running !== null}>
            <RefreshCw data-icon="inline-start" className={running ? "animate-spin" : ""} aria-hidden="true" />
            Refresh
          </Button>
          <Button type="button" size="sm" onClick={() => void run()} disabled={running !== null} title="Runs every case — a dozen real model jobs">
            <Play data-icon="inline-start" aria-hidden="true" />
            {running === "all" ? "Running…" : "Run all"}
          </Button>
        </div>
      </div>

      {error && <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

      {!data ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Case</th>
              <th className="px-4 py-2 text-left font-medium">Tool</th>
              <th className="px-4 py-2 text-right font-medium">Score</th>
              <th className="px-4 py-2 text-left font-medium">Tools</th>
              <th className="px-4 py-2 text-left font-medium">Top issue</th>
              <th className="px-4 py-2 text-right font-medium">Time</th>
              <th className="px-4 py-2 text-right font-medium">Model</th>
              <th className="px-4 py-2 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.cases.map((c) => {
              const r = latestById.get(c.id);
              const busy = running === "all" || (Array.isArray(running) && running.includes(c.id));
              return (
                <tr key={c.id} className={r && !r.passed ? "bg-red-50/40" : undefined} data-eval-case={c.id}>
                  <td className="px-4 py-2 font-mono text-xs text-foreground">{c.id}</td>
                  <td className="px-4 py-2 text-foreground">{labelFor(c.slug)}</td>
                  <td className="px-4 py-2 text-right">
                    {r ? r.ok ? <ScoreCell score={r.score} /> : <span className="text-xs text-red-600">error</span> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {r ? (
                      r.missingTools.length ? (
                        <span className="text-red-600">missing {r.missingTools.join(", ")}</span>
                      ) : (
                        <span className="text-green-700">{r.toolsCalled.length} ran</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">{c.expectTools.join(", ")}</span>
                    )}
                  </td>
                  <td className="max-w-[26rem] truncate px-4 py-2 text-xs text-muted-foreground" title={r?.issues.join("\n") ?? r?.error ?? ""}>
                    {r?.error ?? r?.issues[0] ?? ""}
                  </td>
                  <td className="px-4 py-2 text-right text-xs tabular-nums text-muted-foreground">{r ? `${(r.durationMs / 1000).toFixed(0)}s` : ""}</td>
                  <td className="max-w-[10rem] truncate px-4 py-2 text-right text-xs text-muted-foreground" title={r?.model ?? ""}>
                    {r?.model?.split("/").pop() ?? ""}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => void run([c.id])} disabled={running !== null} aria-label={`Run ${c.id}`}>
                      {busy ? <RefreshCw className="animate-spin" aria-hidden="true" /> : <Play aria-hidden="true" />}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {data && data.runs.length > 1 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <span>History:</span>
          {data.runs.slice(0, 8).map((run) => (
            <span key={run.id} className="rounded-md border border-border px-2 py-0.5">
              {when(run.startedAt)} · {run.summary.passed}/{run.summary.cases} · avg {run.summary.avgScore ?? "—"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
