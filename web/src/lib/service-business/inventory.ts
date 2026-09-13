/**
 * Inventory on hand (`docs/STRATEGY.md` §25.3) — name, SKU, quantity,
 * reorder threshold, cost. A job can consume units; quantity never goes
 * negative. Low-stock rows feed the dashboard.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getJob } from "./job";
import { cleanText, newId, readCents, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export type InventoryItem = {
  id: string;
  orgId: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  reorderThreshold: number;
  costCents: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryInput = {
  name?: string;
  sku?: string;
  quantityOnHand?: number;
  reorderThreshold?: number;
  costCents?: number;
  notes?: string;
};

const itemKey = (orgId: string, id: string) => `inv:${orgId}:${id}`;
const itemIndexKey = (orgId: string) => `inv:${orgId}:all`;

function readQty(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.round(n));
}

export async function getInventoryItem(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<InventoryItem | null> {
  const raw = await store.get(itemKey(orgId, id));
  return raw ? (JSON.parse(raw) as InventoryItem) : null;
}

export async function listInventory(orgId: string, store: KeyValueStore = getStore()): Promise<InventoryItem[]> {
  const ids = await store.smembers(itemIndexKey(orgId));
  const items: InventoryItem[] = [];
  for (const id of ids) {
    const item = await getInventoryItem(orgId, id, store);
    if (item) items.push(item);
    else await store.srem(itemIndexKey(orgId), id);
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function isLowStock(item: InventoryItem): boolean {
  return item.quantityOnHand <= item.reorderThreshold;
}

export async function listLowStock(orgId: string, store: KeyValueStore = getStore()): Promise<InventoryItem[]> {
  return (await listInventory(orgId, store)).filter(isLowStock);
}

export async function createInventoryItem(orgId: string, actingUid: string, input: InventoryInput, store: KeyValueStore = getStore()): Promise<InventoryItem | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const name = cleanText(input.name, 120);
  if (!name) return { error: "Give the item a name." };
  const now = new Date().toISOString();
  const item: InventoryItem = {
    id: newId("inv"),
    orgId,
    name,
    sku: cleanText(input.sku, 40),
    quantityOnHand: readQty(input.quantityOnHand, 0),
    reorderThreshold: readQty(input.reorderThreshold, 0),
    costCents: Math.max(0, readCents(input.costCents) ?? 0),
    notes: cleanText(input.notes, 400),
    createdAt: now,
    updatedAt: now,
  };
  await store.set(itemKey(orgId, item.id), JSON.stringify(item), RECORD_TTL);
  await store.sadd(itemIndexKey(orgId), item.id, RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "inventory.created", target: item.id, detail: { name, sku: item.sku } }, store);
  return item;
}

export async function updateInventoryItem(orgId: string, actingUid: string, id: string, input: InventoryInput, store: KeyValueStore = getStore()): Promise<InventoryItem | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getInventoryItem(orgId, id, store);
  if (!existing) return { error: "Item not found." };
  const updated: InventoryItem = {
    ...existing,
    name: input.name !== undefined ? cleanText(input.name, 120) || existing.name : existing.name,
    sku: input.sku !== undefined ? cleanText(input.sku, 40) : existing.sku,
    quantityOnHand: input.quantityOnHand !== undefined ? readQty(input.quantityOnHand, existing.quantityOnHand) : existing.quantityOnHand,
    reorderThreshold: input.reorderThreshold !== undefined ? readQty(input.reorderThreshold, existing.reorderThreshold) : existing.reorderThreshold,
    costCents: input.costCents !== undefined ? Math.max(0, readCents(input.costCents) ?? existing.costCents) : existing.costCents,
    notes: input.notes !== undefined ? cleanText(input.notes, 400) : existing.notes,
    updatedAt: new Date().toISOString(),
  };
  await store.set(itemKey(orgId, id), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "inventory.updated", target: id, detail: { quantityOnHand: updated.quantityOnHand } }, store);
  return updated;
}

/**
 * Consume units for a job (or restock with a negative quantity). On-hand
 * cannot go below zero — missing stock is a real problem, not a silent wrap.
 */
export async function adjustInventory(
  orgId: string,
  actingUid: string,
  input: { itemId?: string; delta?: number; jobId?: string | null },
  store: KeyValueStore = getStore(),
): Promise<InventoryItem | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const itemId = cleanText(input.itemId, 40);
  if (!itemId) return { error: "Pick an inventory item." };
  const existing = await getInventoryItem(orgId, itemId, store);
  if (!existing) return { error: "Item not found." };
  const delta = typeof input.delta === "number" && Number.isFinite(input.delta) ? Math.round(input.delta) : Number(input.delta);
  if (!Number.isFinite(delta) || delta === 0) return { error: "Enter a quantity to add or use." };
  if (input.jobId && !(await getJob(orgId, input.jobId, store))) return { error: "Job not found." };
  const nextQty = existing.quantityOnHand + delta;
  if (nextQty < 0) return { error: `Only ${existing.quantityOnHand} on hand — can't use ${Math.abs(delta)}.` };
  return updateInventoryItem(orgId, actingUid, itemId, { quantityOnHand: nextQty }, store);
}
