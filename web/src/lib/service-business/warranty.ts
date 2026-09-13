/**
 * Warranty / maintenance records (`docs/STRATEGY.md` §25.3). Linked to a
 * customer and optionally a job. A due-soon list drives the dashboard and
 * the warranty_reminder automation — same quality of reminder at every tier.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getCustomer } from "./customer";
import { getJob } from "./job";
import { cleanText, dateOnly, newId, readMinutes, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export type WarrantyRecord = {
  id: string;
  orgId: string;
  customerId: string;
  jobId: string | null;
  coverage: string;
  startOn: string;
  endOn: string;
  reminderDaysBefore: number;
  lastRemindedAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type WarrantyInput = {
  customerId?: string;
  jobId?: string | null;
  coverage?: string;
  startOn?: string;
  endOn?: string;
  reminderDaysBefore?: number;
  notes?: string;
};

const warrantyKey = (orgId: string, id: string) => `warranty:${orgId}:${id}`;
const warrantyIndexKey = (orgId: string) => `warranty:${orgId}:all`;

export async function getWarranty(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<WarrantyRecord | null> {
  const raw = await store.get(warrantyKey(orgId, id));
  return raw ? (JSON.parse(raw) as WarrantyRecord) : null;
}

export async function listWarranties(orgId: string, store: KeyValueStore = getStore()): Promise<WarrantyRecord[]> {
  const ids = await store.smembers(warrantyIndexKey(orgId));
  const records: WarrantyRecord[] = [];
  for (const id of ids) {
    const record = await getWarranty(orgId, id, store);
    if (record) records.push(record);
    else await store.srem(warrantyIndexKey(orgId), id);
  }
  return records.sort((a, b) => a.endOn.localeCompare(b.endOn));
}

export function warrantyIsOpen(record: WarrantyRecord, today = dateOnly(new Date().toISOString())): boolean {
  return record.endOn >= today;
}

export function warrantyDueSoon(record: WarrantyRecord, today = dateOnly(new Date().toISOString())): boolean {
  if (!warrantyIsOpen(record, today)) return false;
  const remindFrom = new Date(`${record.endOn}T00:00:00.000Z`);
  remindFrom.setUTCDate(remindFrom.getUTCDate() - Math.max(0, record.reminderDaysBefore));
  return dateOnly(remindFrom.toISOString()) <= today;
}

export async function listWarrantiesDueSoon(orgId: string, store: KeyValueStore = getStore(), today = dateOnly(new Date().toISOString())): Promise<WarrantyRecord[]> {
  return (await listWarranties(orgId, store)).filter((record) => warrantyDueSoon(record, today));
}

export async function createWarranty(orgId: string, actingUid: string, input: WarrantyInput, store: KeyValueStore = getStore()): Promise<WarrantyRecord | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const customerId = cleanText(input.customerId, 40);
  if (!customerId) return { error: "A warranty needs a customer." };
  if (!(await getCustomer(orgId, customerId, store))) return { error: "Customer not found." };
  if (input.jobId && !(await getJob(orgId, input.jobId, store))) return { error: "Job not found." };
  const startOn = dateOnly(input.startOn) || dateOnly(new Date().toISOString());
  const endOn = dateOnly(input.endOn);
  if (!endOn) return { error: "Set a warranty end date." };
  if (endOn < startOn) return { error: "The end date has to be on or after the start date." };
  const now = new Date().toISOString();
  const record: WarrantyRecord = {
    id: newId("warr"),
    orgId,
    customerId,
    jobId: input.jobId ?? null,
    coverage: cleanText(input.coverage, 200) || "Workmanship",
    startOn,
    endOn,
    reminderDaysBefore: Math.min(365, readMinutes(input.reminderDaysBefore, 14, 365) || 14),
    lastRemindedAt: null,
    notes: cleanText(input.notes, 2000),
    createdAt: now,
    updatedAt: now,
  };
  await store.set(warrantyKey(orgId, record.id), JSON.stringify(record), RECORD_TTL);
  await store.sadd(warrantyIndexKey(orgId), record.id, RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "warranty.created", target: record.id, detail: { customerId, endOn } }, store);
  return record;
}

export async function updateWarranty(orgId: string, actingUid: string, id: string, input: WarrantyInput & { lastRemindedAt?: string | null }, store: KeyValueStore = getStore()): Promise<WarrantyRecord | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getWarranty(orgId, id, store);
  if (!existing) return { error: "Warranty not found." };
  const startOn = input.startOn !== undefined ? dateOnly(input.startOn) || existing.startOn : existing.startOn;
  const endOn = input.endOn !== undefined ? dateOnly(input.endOn) || existing.endOn : existing.endOn;
  if (endOn < startOn) return { error: "The end date has to be on or after the start date." };
  const updated: WarrantyRecord = {
    ...existing,
    coverage: input.coverage !== undefined ? cleanText(input.coverage, 200) || existing.coverage : existing.coverage,
    startOn,
    endOn,
    reminderDaysBefore: input.reminderDaysBefore !== undefined ? Math.min(365, readMinutes(input.reminderDaysBefore, existing.reminderDaysBefore, 365) || existing.reminderDaysBefore) : existing.reminderDaysBefore,
    lastRemindedAt: input.lastRemindedAt !== undefined ? input.lastRemindedAt : existing.lastRemindedAt,
    notes: input.notes !== undefined ? cleanText(input.notes, 2000) : existing.notes,
    jobId: input.jobId !== undefined ? input.jobId : existing.jobId,
    updatedAt: new Date().toISOString(),
  };
  await store.set(warrantyKey(orgId, id), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "warranty.updated", target: id, detail: { endOn: updated.endOn } }, store);
  return updated;
}
