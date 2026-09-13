import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";
import { isTrade, type Trade } from "./profile";
import { getCustomer } from "./customer";
import { getLead, updateLead } from "./lead";
import { cleanText, newId, readMinutes, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const JOB_STATUSES = ["scheduled", "in_progress", "completed", "canceled"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export const isJobStatus = (value: unknown): value is JobStatus => typeof value === "string" && (JOB_STATUSES as readonly string[]).includes(value);

export type Job = {
  id: string;
  orgId: string;
  customerId: string;
  leadId: string | null;
  title: string;
  serviceType: Trade | "";
  status: JobStatus;
  assignedUid: string | null;
  scheduledFor: string | null;
  /** On-site work length. Defaults to 60 when omitted on older records. */
  durationMinutes: number;
  /** Minutes blocked before the start for the drive to the job. */
  driveMinutes: number;
  address: string;
  notes: string;
  estimateId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobInput = {
  customerId?: string;
  leadId?: string | null;
  title?: string;
  serviceType?: Trade | "";
  status?: JobStatus;
  assignedUid?: string | null;
  scheduledFor?: string | null;
  durationMinutes?: number;
  driveMinutes?: number;
  address?: string;
  notes?: string;
  estimateId?: string | null;
  /** Save even if the assignee already has an overlapping job. */
  allowOverlap?: boolean;
};

export type JobWindow = { start: Date; end: Date };

const jobKey = (orgId: string, id: string) => `job:${orgId}:${id}`;
const jobIndexKey = (orgId: string) => `job:${orgId}:all`;

export function normalizeJob(job: Job): Job {
  return {
    ...job,
    durationMinutes: typeof job.durationMinutes === "number" && job.durationMinutes > 0 ? job.durationMinutes : 60,
    driveMinutes: typeof job.driveMinutes === "number" && job.driveMinutes >= 0 ? job.driveMinutes : 0,
    address: typeof job.address === "string" ? job.address : "",
  };
}

/** Blocked window including drive time before the scheduled start. */
export function jobWindow(job: Pick<Job, "scheduledFor" | "durationMinutes" | "driveMinutes">): JobWindow | null {
  if (!job.scheduledFor) return null;
  const startMs = Date.parse(job.scheduledFor);
  if (!Number.isFinite(startMs)) return null;
  const duration = typeof job.durationMinutes === "number" && job.durationMinutes > 0 ? job.durationMinutes : 60;
  const drive = typeof job.driveMinutes === "number" && job.driveMinutes >= 0 ? job.driveMinutes : 0;
  return { start: new Date(startMs - drive * 60_000), end: new Date(startMs + duration * 60_000) };
}

export function windowsOverlap(a: JobWindow, b: JobWindow): boolean {
  return a.start < b.end && b.start < a.end;
}

export function listJobsOnCalendar(jobs: Job[], from: Date, to: Date): Job[] {
  return jobs
    .filter((job) => {
      const window = jobWindow(job);
      return Boolean(window && window.start < to && from < window.end);
    })
    .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
}

export async function findScheduleConflicts(
  orgId: string,
  candidate: Pick<Job, "id" | "assignedUid" | "scheduledFor" | "durationMinutes" | "driveMinutes" | "status">,
  store: KeyValueStore = getStore(),
): Promise<Job[]> {
  if (!candidate.assignedUid || !candidate.scheduledFor) return [];
  if (candidate.status === "canceled" || candidate.status === "completed") return [];
  const window = jobWindow(candidate);
  if (!window) return [];
  const jobs = await listJobs(orgId, store);
  return jobs.filter((other) => {
    if (other.id === candidate.id) return false;
    if (other.assignedUid !== candidate.assignedUid) return false;
    if (other.status === "canceled" || other.status === "completed") return false;
    const otherWindow = jobWindow(other);
    return Boolean(otherWindow && windowsOverlap(window, otherWindow));
  });
}

export async function getJob(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<Job | null> {
  const raw = await store.get(jobKey(orgId, id));
  return raw ? normalizeJob(JSON.parse(raw) as Job) : null;
}

export async function listJobs(orgId: string, store: KeyValueStore = getStore()): Promise<Job[]> {
  const ids = await store.smembers(jobIndexKey(orgId));
  const jobs: Job[] = [];
  for (const id of ids) {
    const job = await getJob(orgId, id, store);
    if (job) jobs.push(normalizeJob(job));
    else await store.srem(jobIndexKey(orgId), id);
  }
  return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createJob(orgId: string, actingUid: string, input: JobInput, store: KeyValueStore = getStore()): Promise<Job | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const customerId = cleanText(input.customerId, 40);
  if (!customerId) return { error: "A job needs a customer." };
  const customer = await getCustomer(orgId, customerId, store);
  if (!customer) return { error: "Customer not found." };
  if (input.assignedUid) {
    const assignee = await getUser(input.assignedUid, store);
    if (!assignee || assignee.orgId !== orgId) return { error: "Assigned staff must be on this team." };
  }
  const now = new Date().toISOString();
  const job: Job = {
    id: newId("job"),
    orgId,
    customerId,
    leadId: input.leadId ?? null,
    title: cleanText(input.title, 160) || "Job",
    serviceType: input.serviceType && isTrade(input.serviceType) ? input.serviceType : "",
    status: isJobStatus(input.status) ? input.status : "scheduled",
    assignedUid: input.assignedUid ?? null,
    scheduledFor: input.scheduledFor ? cleanText(input.scheduledFor, 40) : null,
    durationMinutes: readMinutes(input.durationMinutes, 60),
    driveMinutes: readMinutes(input.driveMinutes, 0),
    address: cleanText(input.address, 200),
    notes: cleanText(input.notes, 2000),
    estimateId: input.estimateId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  if (!input.allowOverlap) {
    const conflicts = await findScheduleConflicts(orgId, job, store);
    if (conflicts.length) {
      return { error: `That crew member is already booked (${conflicts[0].title}).` };
    }
  }
  await store.set(jobKey(orgId, job.id), JSON.stringify(job), RECORD_TTL);
  await store.sadd(jobIndexKey(orgId), job.id, RECORD_TTL);
  if (job.leadId) await updateLead(orgId, actingUid, job.leadId, { status: "quoted", customerId }, store);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "job.created", target: job.id, detail: { customerId, leadId: job.leadId } }, store);
  return job;
}

export async function updateJob(orgId: string, actingUid: string, id: string, input: JobInput, store: KeyValueStore = getStore()): Promise<Job | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getJob(orgId, id, store);
  if (!existing) return { error: "Job not found." };
  if (input.assignedUid) {
    const assignee = await getUser(input.assignedUid, store);
    if (!assignee || assignee.orgId !== orgId) return { error: "Assigned staff must be on this team." };
  }
  const updated: Job = {
    ...existing,
    title: input.title !== undefined ? cleanText(input.title, 160) || existing.title : existing.title,
    serviceType: input.serviceType !== undefined ? (input.serviceType && isTrade(input.serviceType) ? input.serviceType : "") : existing.serviceType,
    status: input.status !== undefined && isJobStatus(input.status) ? input.status : existing.status,
    assignedUid: input.assignedUid !== undefined ? input.assignedUid : existing.assignedUid,
    scheduledFor: input.scheduledFor !== undefined ? (input.scheduledFor ? cleanText(input.scheduledFor, 40) : null) : existing.scheduledFor,
    durationMinutes: input.durationMinutes !== undefined ? readMinutes(input.durationMinutes, existing.durationMinutes) : existing.durationMinutes,
    driveMinutes: input.driveMinutes !== undefined ? readMinutes(input.driveMinutes, existing.driveMinutes) : existing.driveMinutes,
    address: input.address !== undefined ? cleanText(input.address, 200) : existing.address,
    notes: input.notes !== undefined ? cleanText(input.notes, 2000) : existing.notes,
    estimateId: input.estimateId !== undefined ? input.estimateId : existing.estimateId,
    updatedAt: new Date().toISOString(),
  };
  if (!input.allowOverlap) {
    const conflicts = await findScheduleConflicts(orgId, updated, store);
    if (conflicts.length) {
      return { error: `That crew member is already booked (${conflicts[0].title}).` };
    }
  }
  await store.set(jobKey(orgId, id), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "job.updated", target: id, detail: { status: updated.status } }, store);
  return updated;
}

export async function createJobFromLead(orgId: string, actingUid: string, leadId: string, store: KeyValueStore = getStore()): Promise<Job | DomainError> {
  const lead = await getLead(leadId, store);
  if (!lead || lead.orgId !== orgId) return { error: "Lead not found." };
  const { createCustomer } = await import("./customer");
  let customerId = lead.customerId;
  if (!customerId) {
    const customer = await createCustomer(
      orgId,
      actingUid,
      { name: lead.name, phone: lead.phone, email: lead.email, addresses: [lead.city], source: "marketplace-lead", notes: lead.description },
      store,
    );
    if ("error" in customer) return customer;
    customerId = customer.id;
    await updateLead(orgId, actingUid, leadId, { customerId, status: "quoted" }, store);
  }
  return createJob(orgId, actingUid, {
    customerId,
    leadId,
    title: `${lead.trade} — ${lead.city}`,
    serviceType: lead.trade,
    notes: lead.description,
  }, store);
}
