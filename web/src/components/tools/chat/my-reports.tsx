"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, FileText, Trash2 } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { relativeTime } from "@/lib/chat/history";
import { getToolBySlug } from "@/lib/site-config";
import type { ReportSummary } from "@/lib/reports/storage";

/**
 * "Reports" in the chat header: every client report the signed-in user has
 * shared, across tools. Open, copy the link, or take one down.
 */

type State = { phase: "idle" } | { phase: "loading" } | { phase: "ready"; reports: ReportSummary[] } | { phase: "error" };

function toolLabel(slug: string): string {
  if (slug === "agent") return "Agent";
  return getToolBySlug(slug)?.name ?? slug;
}

export function MyReportsMenu() {
  const session = useSession();
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = openedAt !== null;
  const [state, setState] = useState<State>({ phase: "idle" });
  const [copied, setCopied] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenedAt(null);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpenedAt(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (session.status !== "ready" || !session.user) return null;

  const load = async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { reports: ReportSummary[] };
      setState({ phase: "ready", reports: body.reports });
    } catch {
      setState({ phase: "error" });
    }
  };

  const toggle = () => {
    if (open) {
      setOpenedAt(null);
      return;
    }
    setOpenedAt(Date.now());
    void load();
  };

  const remove = async (id: string) => {
    if (state.phase !== "ready") return;
    const remaining = state.reports.filter((r) => r.id !== id);
    setState({ phase: "ready", reports: remaining });
    const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
    if (!res.ok) void load();
  };

  const copy = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${id}`).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const now = openedAt ?? 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="My client reports"
        title="Reports you've shared"
        onClick={toggle}
        className={`flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium transition-colors duration-100 hover:bg-hover ${
          open ? "text-ink" : "text-ink-3 hover:text-ink"
        }`}
        data-my-reports
      >
        <FileText className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Reports</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="My reports"
          className="absolute right-0 top-full z-20 mt-1 w-[340px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-card"
          style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">Shared reports</span>
            {state.phase === "ready" && <span className="text-[11.5px] text-ink-3">{state.reports.length} live</span>}
          </div>
          {state.phase === "loading" || state.phase === "idle" ? (
            <p className="px-3 py-4 text-[12.5px] text-ink-3" role="status">
              Loading…
            </p>
          ) : state.phase === "error" ? (
            <div className="flex items-center justify-between px-3 py-4">
              <p className="text-[12.5px] text-red">Couldn&apos;t load your reports.</p>
              <button type="button" onClick={() => void load()} className="text-[12px] font-medium text-ink hover:underline">
                Retry
              </button>
            </div>
          ) : state.reports.length === 0 ? (
            <p className="px-3 py-4 text-[12.5px] leading-relaxed text-ink-3">
              Nothing shared yet. Run a tool, then use <span className="font-medium text-ink-2">Share</span> to turn the deliverables into a client-ready page.
            </p>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1" data-my-reports-list>
              {state.reports.map((report) => (
                <li key={report.id} className="group flex items-stretch">
                  <a
                    href={`/r/${report.id}`}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors duration-100 hover:bg-hover"
                  >
                    <span className="flex w-full items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{report.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-ink-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
                    </span>
                    <span className="w-full truncate text-[11.5px] text-ink-3">
                      {toolLabel(report.slug)} · {relativeTime(Date.parse(report.createdAt), now)} · {report.items} deliverable{report.items === 1 ? "" : "s"} · {report.views} view
                      {report.views === 1 ? "" : "s"}
                    </span>
                  </a>
                  <button
                    type="button"
                    aria-label={copied === report.id ? "Copied" : `Copy link to “${report.title}”`}
                    title="Copy link"
                    onClick={() => copy(report.id)}
                    className={`flex w-8 shrink-0 items-center justify-center transition-opacity duration-100 focus-visible:opacity-100 ${
                      copied === report.id ? "text-green opacity-100" : "text-ink-3 opacity-0 group-hover:opacity-100 hover:text-ink"
                    }`}
                  >
                    {copied === report.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Take down “${report.title}”`}
                    title="Take down"
                    onClick={() => void remove(report.id)}
                    className="flex w-8 shrink-0 items-center justify-center pr-1 text-ink-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100 hover:text-red focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-ink-3">Links stay live for 90 days. Taking one down stops the link immediately.</p>
        </div>
      )}
    </div>
  );
}
