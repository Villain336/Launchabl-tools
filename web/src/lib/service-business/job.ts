import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";
import { isTrade, type Trade } from "./profile";
import { getCustomer } from "./customer";
import { getLead, updateLead } from "./lead";
import { cleanText, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

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
  notes?: string;
  estimateId?: string | null;
};

const jobKey = (orgId: string, id: string) => `job:${orgId}:${id}`;
const jobIndexKey = (orgId: string) => `job:${orgId}:all`;

export async function getJob(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<Job | null> {
  const raw = await store.get(jobKey(orgId, id));
  return raw ? (JSON.parse(raw) as Job) : null;
}

export async function listJobs(orgId: string, store: KeyValueStore = getStore()): Promise<Job[]> {
  const ids = await store.smembers(jobIndexKey(orgId));
  const jobs: Job[] = [];
  for (const id of ids) {
    const job = await getJob(orgId, id, store);
    if (job) jobs.push(job);
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
    notes: cleanText(input.notes, 2000),
    estimateId: input.estimateId ?? null,
    createdAt: now,
    updatedAt: now,
  };
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
    notes: input.notes !== undefined ? cleanText(input.notes, 2000) : existing.notes,
    estimateId: input.estimateId !== undefined ? input.estimateId : existing.estimateId,
    updatedAt: new Date().toISOString(),
  };
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
