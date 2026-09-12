"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ExternalLink, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { useSession } from "@/lib/auth/use-session";
import { relativeTime } from "@/lib/chat/history";
import { describeCadence, untilText, type Schedule } from "@/lib/schedules/schedule";
import { getToolBySlug } from "@/lib/site-config";

/**
 * /automations — every scheduled job the signed-in user owns: cadence,
 * next and last run, the last report, and controls to run now, pause,
 * edit or delete.
 */

type State = { phase: "loading" } | { phase: "ready"; schedules: Schedule[]; emailEnabled: boolean } | { phase: "anon" } | { phase: "error" };

const toolName = (slug: string) => (slug === "agent" ? "Launchabl Agent" : getToolBySlug(slug)?.name ?? slug);

function StatusPill({ schedule }: { schedule: Schedule }) {
  if (!schedule.enabled) return <span className="rounded-full bg-field px-2 py-0.5 text-[11px] font-medium text-ink-3">Paused</span>;
  if (schedule.lastStatus === "error") return <span className="rounded-full bg-red/10 px-2 py-0.5 text-[11px] font-medium text-red">Last run failed</span>;
  if (schedule.lastStatus === "ok") return <span className="rounded-full bg-green/10 px-2 py-0.5 text-[11px] font-medium text-green">Healthy</span>;
  return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Scheduled</span>;
}

export function AutomationsList() {
  const session = useSession();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ phase: "loading" });
  const [editing, setEditing] = useState<Schedule | null | "new">(null);
  const [running, setRunning] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/schedules", { cache: "no-store" });
      if (res.status === 401) {
        setState({ phase: "anon" });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { schedules: Schedule[]; emailEnabled: boolean };
      setState({ phase: "ready", schedules: body.schedules, emailEnabled: body.emailEnabled });
    } catch {
      setState({ phase: "error" });
    }
  }, []);

  useEffect(() => {
    if (session.status !== "ready") return;
    if (!session.user) {
      queueMicrotask(() => setState({ phase: "anon" }));
      return;
    }
    queueMicrotask(() => void load());
  }, [session.status, session.user, load]);

  const patch = async (schedule: Schedule, input: Partial<Schedule>) => {
    const res = await fetch(`/api/schedules/${schedule.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (res.ok) void load();
  };

  const remove = async (schedule: Schedule) => {
    if (!window.confirm(`Delete "${schedule.title}"? Its past reports stay in My reports.`)) return;
    const res = await fetch(`/api/schedules/${schedule.id}`, { method: "DELETE" });
    if (res.ok || res.status === 404) void load();
  };

  const runNow = async (schedule: Schedule) => {
    setRunning(schedule.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/schedules/${schedule.id}/run`, { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { outcome?: { ok: boolean; reportId?: string; error?: string; emailed?: boolean }; error?: string };
      if (body.outcome?.ok) {
        setNotice(`Done — report ready${body.outcome.emailed ? " and emailed" : ""}.`);
      } else {
        setNotice(body.outcome?.error ?? body.error ?? "The run failed.");
      }
    } catch {
      setNotice("The run failed.");
    } finally {
      setRunning(null);
      void load();
    }
  };

  if (state.phase === "anon") {
    return (
      <div className="rounded-card border border-line bg-surface p-8 text-center shadow-card">
        <CalendarClock className="mx-auto h-6 w-6 text-primary" />
        <p className="mt-3 text-[15px] font-medium text-ink">Sign in to schedule jobs</p>
        <p className="mx-auto mt-1 max-w-md text-[13.5px] text-ink-2">Automations run on their own, produce a report page each time and email you the link.</p>
        <Link href={`/sign-in?next=${encodeURIComponent(pathname ?? "/automations")}&source=page:automations`} className="mt-4 inline-flex h-9 items-center rounded-control bg-ink px-4 text-[13px] font-medium text-white hover:opacity-90">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div data-automations>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-2">
          {state.phase === "ready" && !state.emailEnabled ? "Email delivery is off on this deployment; reports still appear under My reports." : "Each run creates a report page and emails you the link."}
        </p>
        <button type="button" onClick={() => setEditing("new")} className="inline-flex h-8 items-center gap-1.5 rounded-control bg-ink px-3 text-[13px] font-medium text-white hover:opacity-90" data-new-automation>
          <Plus className="h-3.5 w-3.5" /> New automation
        </button>
      </div>

      {notice && (
        <p className="mt-3 rounded-control border border-line bg-field px-3 py-2 text-[12.5px] text-ink-2" role="status">
          {notice}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-card border border-line bg-surface shadow-card">
        {state.phase === "loading" ? (
          <p className="px-4 py-8 text-center text-[13px] text-ink-3">Loading…</p>
        ) : state.phase === "error" ? (
          <p className="px-4 py-8 text-center text-[13px] text-red">Couldn&apos;t load your automations.</p>
        ) : state.schedules.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[14px] font-medium text-ink">No automations yet</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-ink-2">
              Open any tool, run the job once, then use <span className="font-medium text-ink">Schedule</span> in the chat header — or start one here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line" data-automations-list>
            {state.schedules.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center" data-automation={s.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-medium text-ink">{s.title}</p>
                    <StatusPill schedule={s} />
                  </div>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink-3">
                    {toolName(s.slug)} · {describeCadence(s)} · {s.runs} run{s.runs === 1 ? "" : "s"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-3">
                    {s.enabled ? `Next run ${untilText(s.nextRunAt)}` : "Not scheduled"}
                    {s.lastRunAt && <> · last {relativeTime(new Date(s.lastRunAt).getTime())}</>}
                    {s.lastStatus === "error" && s.lastError && <span className="text-red"> · {s.lastError}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {s.lastReportId && (
                    <a href={`/r/${s.lastReportId}`} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
                      <ExternalLink className="h-3.5 w-3.5" /> Last report
                    </a>
                  )}
                  <button type="button" onClick={() => void runNow(s)} disabled={running !== null} className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink disabled:opacity-50" data-run-now>
                    <Play className={`h-3.5 w-3.5 ${running === s.id ? "animate-pulse text-primary" : ""}`} /> {running === s.id ? "Running…" : "Run now"}
                  </button>
                  <button type="button" onClick={() => void patch(s, { enabled: !s.enabled })} aria-label={s.enabled ? "Pause" : "Resume"} title={s.enabled ? "Pause" : "Resume"} className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-hover hover:text-ink">
                    {s.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => setEditing(s)} aria-label="Edit" title="Edit" className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-hover hover:text-ink">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => void remove(s)} aria-label="Delete" title="Delete" className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-hover hover:text-red">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && <ScheduleForm schedule={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => void load()} />}
    </div>
  );
}
