import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getCustomer } from "./customer";
import { getJob, updateJob } from "./job";
import { cleanText, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const ESTIMATE_STATUSES = ["draft", "sent", "accepted", "declined"] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];
export const isEstimateStatus = (value: unknown): value is EstimateStatus =>
  typeof value === "string" && (ESTIMATE_STATUSES as readonly string[]).includes(value);

export type EstimateLine = { description: string; quantity: number; unitCents: number };

export type Estimate = {
  id: string;
  orgId: string;
  customerId: string;
  jobId: string | null;
  status: EstimateStatus;
  aiDrafted: boolean;
  lineItems: EstimateLine[];
  totalCents: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type EstimateInput = {
  customerId?: string;
  jobId?: string | null;
  status?: EstimateStatus;
  aiDrafted?: boolean;
  lineItems?: EstimateLine[];
  notes?: string;
};

const estimateKey = (orgId: string, id: string) => `estimate:${orgId}:${id}`;
const estimateIndexKey = (orgId: string) => `estimate:${orgId}:all`;

export function lineTotal(line: EstimateLine): number {
  return Math.max(0, Math.round(line.quantity * line.unitCents));
}

export function estimateTotal(lines: EstimateLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

function cleanLines(value: unknown): EstimateLine[] {
  if (!Array.isArray(value)) return [];
  const out: EstimateLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const description = cleanText(rec.description, 160);
    const quantity = typeof rec.quantity === "number" && Number.isFinite(rec.quantity) ? rec.quantity : Number(rec.quantity);
    const unitCents = typeof rec.unitCents === "number" && Number.isFinite(rec.unitCents) ? rec.unitCents : Number(rec.unitCents);
    if (!description || out.length >= 40) continue;
    out.push({
      description,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      unitCents: Number.isFinite(unitCents) ? Math.round(unitCents) : 0,
    });
  }
  return out;
}

export async function getEstimate(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<Estimate | null> {
  const raw = await store.get(estimateKey(orgId, id));
  return raw ? (JSON.parse(raw) as Estimate) : null;
}

export async function listEstimates(orgId: string, store: KeyValueStore = getStore()): Promise<Estimate[]> {
  const ids = await store.smembers(estimateIndexKey(orgId));
  const estimates: Estimate[] = [];
  for (const id of ids) {
    const estimate = await getEstimate(orgId, id, store);
    if (estimate) estimates.push(estimate);
    else await store.srem(estimateIndexKey(orgId), id);
  }
  return estimates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createEstimate(orgId: string, actingUid: string, input: EstimateInput, store: KeyValueStore = getStore()): Promise<Estimate | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const customerId = cleanText(input.customerId, 40);
  if (!customerId) return { error: "An estimate needs a customer." };
  if (!(await getCustomer(orgId, customerId, store))) return { error: "Customer not found." };
  if (input.jobId && !(await getJob(orgId, input.jobId, store))) return { error: "Job not found." };
  const lineItems = cleanLines(input.lineItems);
  const now = new Date().toISOString();
  const estimate: Estimate = {
    id: newId("est"),
    orgId,
    customerId,
    jobId: input.jobId ?? null,
    status: isEstimateStatus(input.status) ? input.status : "draft",
    aiDrafted: Boolean(input.aiDrafted),
    lineItems,
    totalCents: estimateTotal(lineItems),
    notes: cleanText(input.notes, 2000),
    createdAt: now,
    updatedAt: now,
  };
  await store.set(estimateKey(orgId, estimate.id), JSON.stringify(estimate), RECORD_TTL);
  await store.sadd(estimateIndexKey(orgId), estimate.id, RECORD_TTL);
  if (estimate.jobId) await updateJob(orgId, actingUid, estimate.jobId, { estimateId: estimate.id }, store);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "estimate.created", target: estimate.id, detail: { totalCents: estimate.totalCents, aiDrafted: estimate.aiDrafted } }, store);
  return estimate;
}

export async function updateEstimate(orgId: string, actingUid: string, id: string, input: EstimateInput, store: KeyValueStore = getStore()): Promise<Estimate | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getEstimate(orgId, id, store);
  if (!existing) return { error: "Estimate not found." };
  const lineItems = input.lineItems !== undefined ? cleanLines(input.lineItems) : existing.lineItems;
  const updated: Estimate = {
    ...existing,
    status: input.status !== undefined && isEstimateStatus(input.status) ? input.status : existing.status,
    aiDrafted: input.aiDrafted !== undefined ? Boolean(input.aiDrafted) : existing.aiDrafted,
    lineItems,
    totalCents: estimateTotal(lineItems),
    notes: input.notes !== undefined ? cleanText(input.notes, 2000) : existing.notes,
    jobId: input.jobId !== undefined ? input.jobId : existing.jobId,
    updatedAt: new Date().toISOString(),
  };
  await store.set(estimateKey(orgId, id), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "estimate.updated", target: id, detail: { status: updated.status, totalCents: updated.totalCents } }, store);
  return updated;
}
