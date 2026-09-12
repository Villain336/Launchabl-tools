"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { useProjects } from "@/lib/projects/use-projects";
import { CADENCES, describeCadence, type Cadence, type Schedule, type ScheduleInput } from "@/lib/schedules/schedule";
import { getToolBySlug, tools } from "@/lib/site-config";

/**
 * Create or edit an automation: which tool, the standing brief, the cadence
 * and where the report link goes. Used from the chat header ("Schedule",
 * prefilled with the current conversation's brief) and from /automations.
 */

const label = "text-[12px] font-medium text-ink-2";
const field = "h-8 w-full rounded-control border border-line bg-field px-2.5 text-[13px] text-ink outline-none placeholder:text-ink-3 focus:border-line-strong";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const schedulable = tools.filter((t) => t.status === "live" && t.processing === "server").sort((a, b) => a.name.localeCompare(b.name));

export type ScheduleFormProps = {
  schedule?: Schedule | null;
  defaults?: Partial<Pick<ScheduleInput, "slug" | "prompt" | "title" | "projectId">>;
  onClose: () => void;
  onSaved?: (schedule: Schedule) => void;
};

export function ScheduleForm({ schedule, defaults, onClose, onSaved }: ScheduleFormProps) {
  const session = useSession();
  const projects = useProjects(true);
  const localHour = new Date().getTimezoneOffset();
  const [draft, setDraft] = useState<Required<Pick<ScheduleInput, "slug" | "prompt" | "title" | "cadence" | "hourUtc" | "weekday" | "dayOfMonth" | "email">> & { projectId: string | null }>(() => ({
    slug: schedule?.slug ?? defaults?.slug ?? "agent",
    prompt: schedule?.prompt ?? defaults?.prompt ?? "",
    title: schedule?.title ?? defaults?.title ?? "",
    cadence: schedule?.cadence ?? "weekly",
    hourUtc: schedule?.hourUtc ?? 8,
    weekday: schedule?.weekday ?? 1,
    dayOfMonth: schedule?.dayOfMonth ?? 1,
    email: schedule?.email ?? "",
    projectId: schedule?.projectId ?? defaults?.projectId ?? null,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const email = draft.email || session.user?.email || "";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body: ScheduleInput = { ...draft, email, projectId: draft.projectId };
    const res = await fetch(schedule ? `/api/schedules/${schedule.id}` : "/api/schedules", {
      method: schedule ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { schedule?: Schedule; error?: string };
    setSaving(false);
    if (!res.ok || !data.schedule) {
      setError(data.error ?? "Couldn't save the automation.");
      return;
    }
    onSaved?.(data.schedule);
    onClose();
  };

  const toolName = draft.slug === "agent" ? "Launchabl Agent" : getToolBySlug(draft.slug)?.name ?? draft.slug;
  const localNote = localHour === 0 ? "" : ` (${String((((draft.hourUtc - localHour / 60) % 24) + 24) % 24).padStart(2, "0")}:00 your time)`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 p-4 pt-[6vh] backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={schedule ? "Edit automation" : "Schedule this job"} data-schedule-form>
      <form onSubmit={submit} className="w-full max-w-[640px] rounded-[14px] border border-line bg-surface shadow-card" style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <p className="text-[14px] font-semibold text-ink">{schedule ? "Edit automation" : "Schedule this job"}</p>
            <p className="text-[12px] text-ink-3">Runs on its own, produces a report page each time and emails you the link.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-7 items-center justify-center rounded-[6px] text-ink-3 hover:bg-hover hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="sf-title">Name</label>
            <input id="sf-title" className={`${field} mt-1`} value={draft.title} onChange={(e) => set("title", e.target.value)} placeholder="Weekly site health check" autoFocus />
          </div>
          <div>
            <label className={label} htmlFor="sf-slug">Tool</label>
            <select id="sf-slug" className={`${field} mt-1`} value={draft.slug} onChange={(e) => set("slug", e.target.value)}>
              <option value="agent">Launchabl Agent (any skill)</option>
              {schedulable.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="sf-project">Project</label>
            <select id="sf-project" className={`${field} mt-1`} value={draft.projectId ?? ""} onChange={(e) => set("projectId", e.target.value || null)}>
              <option value="">No project</option>
              {projects.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="sf-prompt">Standing brief for {toolName}</label>
            <textarea
              id="sf-prompt"
              className="mt-1 min-h-[110px] w-full resize-y rounded-control border border-line bg-field px-2.5 py-2 text-[13px] leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-line-strong"
              value={draft.prompt}
              onChange={(e) => set("prompt", e.target.value)}
              placeholder="Audit https://acme.io, check security headers and SSL, and give me one prioritised list of what changed since last time."
            />
            <p className="mt-1 text-[11.5px] text-ink-3">Write it as if you were typing it into the chat. Nobody will be there to answer questions, so include URLs, audience and constraints.</p>
          </div>
          <div>
            <label className={label} htmlFor="sf-cadence">Cadence</label>
            <select id="sf-cadence" className={`${field} mt-1`} value={draft.cadence} onChange={(e) => set("cadence", e.target.value as Cadence)}>
              {CADENCES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {draft.cadence === "weekly" && (
            <div>
              <label className={label} htmlFor="sf-weekday">Day</label>
              <select id="sf-weekday" className={`${field} mt-1`} value={draft.weekday} onChange={(e) => set("weekday", Number(e.target.value))}>
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
          {draft.cadence === "monthly" && (
            <div>
              <label className={label} htmlFor="sf-dom">Day of month</label>
              <select id="sf-dom" className={`${field} mt-1`} value={draft.dayOfMonth} onChange={(e) => set("dayOfMonth", Number(e.target.value))}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className={draft.cadence === "daily" ? "" : "sm:col-span-2"}>
            <label className={label} htmlFor="sf-hour">Time (UTC){localNote}</label>
            <select id="sf-hour" className={`${field} mt-1`} value={draft.hourUtc} onChange={(e) => set("hourUtc", Number(e.target.value))}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="sf-email">Send the report link to</label>
            <input id="sf-email" className={`${field} mt-1`} value={email} onChange={(e) => set("email", e.target.value)} inputMode="email" placeholder="you@company.com" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <p className="text-[12px] text-ink-3">
            {describeCadence(draft)} ·{" "}
            <Link href="/automations" className="font-medium text-ink-2 hover:text-ink hover:underline">
              Manage automations
            </Link>
          </p>
          <div className="flex items-center gap-2">
            {error && <p className="text-[12px] text-red">{error}</p>}
            <button type="button" onClick={onClose} className="h-8 rounded-control px-3 text-[13px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="h-8 rounded-control bg-ink px-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50" data-schedule-save>
              {saving ? "Saving…" : schedule ? "Save changes" : "Schedule"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
