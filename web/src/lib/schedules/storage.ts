import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { emptySchedule, isScheduleId, normaliseSchedule, SCHEDULE_LIMITS, type Schedule, type ScheduleInput } from "@/lib/schedules/schedule";

/**
 * Keys:
 *   schedule:<id>            the record
 *   user:<uid>:schedules     set of ids
 *   schedules:all            set of every id — what the cron scans
 *   schedule:<id>:lock       short-lived claim so two cron ticks don't double-run
 */

const TTL_SECONDS = 400 * 24 * 60 * 60;
const LOCK_SECONDS = 15 * 60;

export function newScheduleId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return `sc_${Buffer.from(bytes).toString("base64url")}`;
}

export async function loadSchedule(id: string, store: KeyValueStore = getStore()): Promise<Schedule | null> {
  if (!isScheduleId(id)) return null;
  const raw = await store.get(`schedule:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Schedule;
  } catch {
    return null;
  }
}

export async function saveSchedule(schedule: Schedule, store: KeyValueStore = getStore()): Promise<void> {
  await store.set(`schedule:${schedule.id}`, JSON.stringify(schedule), TTL_SECONDS);
  await store.sadd(`user:${schedule.ownerUid}:schedules`, schedule.id, TTL_SECONDS);
  await store.sadd("schedules:all", schedule.id, TTL_SECONDS);
}

export async function listSchedules(uid: string, store: KeyValueStore = getStore()): Promise<Schedule[]> {
  const ids = await store.smembers(`user:${uid}:schedules`);
  const out: Schedule[] = [];
  for (const id of ids) {
    const schedule = await loadSchedule(id, store);
    if (!schedule || schedule.ownerUid !== uid) {
      await store.srem(`user:${uid}:schedules`, id);
      continue;
    }
    out.push(schedule);
  }
  return out.sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt));
}

export async function createSchedule(
  owner: { uid: string; email: string; name: string | null },
  input: ScheduleInput,
  store: KeyValueStore = getStore(),
  now = new Date(),
): Promise<Schedule | { error: string }> {
  const existing = await store.smembers(`user:${owner.uid}:schedules`);
  if (existing.length >= SCHEDULE_LIMITS.perUser) return { error: `You can keep up to ${SCHEDULE_LIMITS.perUser} automations. Delete one to add another.` };
  const base = emptySchedule(newScheduleId(), owner.uid, owner.email, owner.name, now);
  const schedule = normaliseSchedule(input, base, now);
  if ("error" in schedule) return schedule;
  await saveSchedule(schedule, store);
  return schedule;
}

export async function updateSchedule(id: string, uid: string, input: ScheduleInput, store: KeyValueStore = getStore(), now = new Date()): Promise<Schedule | { error: string } | null> {
  const current = await loadSchedule(id, store);
  if (!current || current.ownerUid !== uid) return null;
  const next = normaliseSchedule(input, current, now);
  if ("error" in next) return next;
  await saveSchedule(next, store);
  return next;
}

export async function deleteSchedule(id: string, uid: string, store: KeyValueStore = getStore()): Promise<boolean> {
  const current = await loadSchedule(id, store);
  if (!current || current.ownerUid !== uid) return false;
  await store.del(`schedule:${id}`);
  await store.srem(`user:${uid}:schedules`, id);
  await store.srem("schedules:all", id);
  return true;
}

/** Enabled schedules whose next run is at or before `now`, soonest first. */
export async function listDueSchedules(now: Date, store: KeyValueStore = getStore()): Promise<Schedule[]> {
  const ids = await store.smembers("schedules:all");
  const due: Schedule[] = [];
  for (const id of ids) {
    const schedule = await loadSchedule(id, store);
    if (!schedule) {
      await store.srem("schedules:all", id);
      continue;
    }
    if (schedule.enabled && schedule.nextRunAt && schedule.nextRunAt <= now.toISOString()) due.push(schedule);
  }
  return due.sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt));
}

/** Claim a schedule for one run; false when another worker holds it. */
export async function claimSchedule(id: string, store: KeyValueStore = getStore()): Promise<boolean> {
  return (await store.incr(`schedule:${id}:lock`, LOCK_SECONDS)) === 1;
}

export async function releaseSchedule(id: string, store: KeyValueStore = getStore()): Promise<void> {
  await store.del(`schedule:${id}:lock`);
}
