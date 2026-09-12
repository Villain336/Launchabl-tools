/**
 * Scheduled runs: a saved brief that a tool (or the agent) executes on a
 * cadence without anyone in the chat, producing a report page and an
 * email with the link. Pure types and date maths live here; storage and
 * the runner are separate so this stays unit-testable.
 */

export type Cadence = "daily" | "weekly" | "monthly";

export type Schedule = {
  id: string;
  ownerUid: string;
  /** Where the report link goes. Defaults to the account email. */
  email: string;
  /** Display name for the report's "Prepared by". */
  preparedBy: string | null;
  projectId: string | null;
  slug: string;
  title: string;
  prompt: string;
  cadence: Cadence;
  /** Hour of day in UTC, 0–23. */
  hourUtc: number;
  /** 0 (Sunday) – 6, weekly only. */
  weekday: number;
  /** 1–28, monthly only (kept ≤ 28 so every month has the day). */
  dayOfMonth: number;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
  lastStatus: "ok" | "error" | null;
  lastError: string | null;
  lastReportId: string | null;
  runs: number;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleInput = Partial<Pick<Schedule, "email" | "projectId" | "slug" | "title" | "prompt" | "cadence" | "hourUtc" | "weekday" | "dayOfMonth" | "enabled">>;

export const SCHEDULE_LIMITS = { perUser: 12, prompt: 3_000, title: 90 } as const;
export const CADENCES: Cadence[] = ["daily", "weekly", "monthly"];

export const isScheduleId = (id: string) => /^sc_[A-Za-z0-9_-]{12}$/.test(id);

const clampInt = (value: unknown, min: number, max: number, fallback: number) => {
  const n = typeof value === "number" ? Math.trunc(value) : typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/**
 * The first run strictly after `from` that matches the cadence. Weekly and
 * monthly runs land on the configured day at `hourUtc`; daily runs at the
 * next `hourUtc`.
 */
export function nextRunAfter(schedule: Pick<Schedule, "cadence" | "hourUtc" | "weekday" | "dayOfMonth">, from: Date): Date {
  const at = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d, schedule.hourUtc, 0, 0, 0));
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const d = from.getUTCDate();
  if (schedule.cadence === "daily") {
    const today = at(y, m, d);
    return today > from ? today : at(y, m, d + 1);
  }
  if (schedule.cadence === "weekly") {
    const delta = (schedule.weekday - from.getUTCDay() + 7) % 7;
    const candidate = at(y, m, d + delta);
    return candidate > from ? candidate : at(y, m, d + delta + 7);
  }
  const thisMonth = at(y, m, schedule.dayOfMonth);
  return thisMonth > from ? thisMonth : at(y, m + 1, schedule.dayOfMonth);
}

/** Validate and merge user input over an existing schedule (or defaults for a new one). */
export function normaliseSchedule(input: ScheduleInput, base: Schedule, now: Date): Schedule | { error: string } {
  const prompt = (input.prompt ?? base.prompt).trim().replace(/\s+\n/g, "\n");
  if (prompt.length < 10) return { error: "Describe the job in at least a sentence." };
  if (prompt.length > SCHEDULE_LIMITS.prompt) return { error: `Keep the brief under ${SCHEDULE_LIMITS.prompt} characters.` };
  const slug = (input.slug ?? base.slug).trim();
  if (!slug) return { error: "Pick a tool." };
  const email = (input.email ?? base.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email for the report link." };
  const cadence = input.cadence && CADENCES.includes(input.cadence) ? input.cadence : base.cadence;
  const title = (input.title ?? base.title).trim().slice(0, SCHEDULE_LIMITS.title) || prompt.replace(/\s+/g, " ").slice(0, 60);
  const next: Schedule = {
    ...base,
    email,
    projectId: input.projectId === undefined ? base.projectId : input.projectId,
    slug,
    title,
    prompt,
    cadence,
    hourUtc: clampInt(input.hourUtc, 0, 23, base.hourUtc),
    weekday: clampInt(input.weekday, 0, 6, base.weekday),
    dayOfMonth: clampInt(input.dayOfMonth, 1, 28, base.dayOfMonth),
    enabled: input.enabled === undefined ? base.enabled : Boolean(input.enabled),
    updatedAt: now.toISOString(),
  };
  const cadenceChanged =
    next.cadence !== base.cadence || next.hourUtc !== base.hourUtc || next.weekday !== base.weekday || next.dayOfMonth !== base.dayOfMonth || !base.nextRunAt;
  if (cadenceChanged || (next.enabled && !base.enabled)) next.nextRunAt = nextRunAfter(next, now).toISOString();
  return next;
}

export function emptySchedule(id: string, ownerUid: string, email: string, preparedBy: string | null, now: Date): Schedule {
  return {
    id,
    ownerUid,
    email,
    preparedBy,
    projectId: null,
    slug: "agent",
    title: "",
    prompt: "",
    cadence: "weekly",
    hourUtc: 8,
    weekday: 1,
    dayOfMonth: 1,
    enabled: true,
    nextRunAt: "",
    lastRunAt: null,
    lastStatus: null,
    lastError: null,
    lastReportId: null,
    runs: 0,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** "Every Monday at 08:00 UTC" — for lists and the confirmation email. */
export function describeCadence(schedule: Pick<Schedule, "cadence" | "hourUtc" | "weekday" | "dayOfMonth">): string {
  const hour = `${String(schedule.hourUtc).padStart(2, "0")}:00 UTC`;
  if (schedule.cadence === "daily") return `Every day at ${hour}`;
  if (schedule.cadence === "weekly") return `Every ${WEEKDAYS[schedule.weekday]} at ${hour}`;
  const n = schedule.dayOfMonth;
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `Monthly on the ${n}${suffix} at ${hour}`;
}

/** "in 3 h", "in 2 d", "tomorrow 08:00 UTC" — for the next-run column. */
export function untilText(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (!Number.isFinite(diff)) return "";
  if (diff <= 0) return "due now";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `in ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 14) return `in ${days} d`;
  return `on ${new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`;
}
