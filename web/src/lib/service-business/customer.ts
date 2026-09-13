/**
 * Customer — the unified customer profile inside one contractor's OS
 * (`docs/STRATEGY.md` §25.3), scoped to the `Org` that owns it. This is the
 * OS-side CRM object a `Job`/`Estimate` (a later slice of Phase 3.0, §25.6)
 * will reference — deliberately shipped first since scheduling, estimates,
 * and warranty tracking all need a customer to attach to.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser, type OrgRole } from "@/lib/auth/session";
import { getOrg } from "@/lib/orgs/org";
import { logAuditEvent } from "@/lib/audit/log";

export type CustomerSource = "marketplace-lead" | "referral" | "direct" | "import";

export type Customer = {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  addresses: string[];
  notes: string;
  tags: string[];
  source: CustomerSource;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerInput = {
  name?: string;
  phone?: string;
  email?: string;
  addresses?: string[];
  notes?: string;
  tags?: string[];
  source?: CustomerSource;
};

export const CUSTOMER_LIMITS = { nameMax: 120, phoneMax: 40, emailMax: 200, notesMax: 4000, addresses: 10, tags: 20, perOrg: 5000 } as const;
const CUSTOMER_TTL = 3 * 365 * 24 * 60 * 60;
const SOURCES: CustomerSource[] = ["marketplace-lead", "referral", "direct", "import"];

export type CustomerError = { error: string };

const customerKey = (orgId: string, id: string) => `customer:${orgId}:${id}`;
const customerIndexKey = (orgId: string) => `customer:${orgId}:all`;

function newId(): string {
  return `cust_${Buffer.from(crypto.getRandomValues(new Uint8Array(9))).toString("base64url")}`;
}

const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const cleanList = (value: unknown, max: number, limit: number): string[] => {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const cleaned = item.replace(/\s+/g, " ").trim();
    if (cleaned && out.length < limit) out.push(cleaned.slice(0, max));
  }
  return out;
};
const cleanSource = (value: unknown, fallback: CustomerSource): CustomerSource => (SOURCES.includes(value as CustomerSource) ? (value as CustomerSource) : fallback);

async function requireOrgRole(orgId: string, actingUid: string, allowedRoles: OrgRole[], store: KeyValueStore): Promise<null | CustomerError> {
  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };
  const actor = await getUser(actingUid, store);
  if (!actor || actor.orgId !== orgId || !actor.orgRole || !allowedRoles.includes(actor.orgRole)) {
    return { error: "You don't have permission to do that." };
  }
  return null;
}

export async function getCustomer(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<Customer | null> {
  const raw = await store.get(customerKey(orgId, id));
  return raw ? (JSON.parse(raw) as Customer) : null;
}

export async function listCustomers(orgId: string, store: KeyValueStore = getStore()): Promise<Customer[]> {
  const ids = await store.smembers(customerIndexKey(orgId));
  const customers: Customer[] = [];
  for (const id of ids) {
    const customer = await getCustomer(orgId, id, store);
    if (customer) customers.push(customer);
    else await store.srem(customerIndexKey(orgId), id); // stale
  }
  return customers.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCustomer(
  orgId: string,
  actingUid: string,
  input: CustomerInput,
  store: KeyValueStore = getStore(),
): Promise<Customer | CustomerError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const name = cleanText(input.name, CUSTOMER_LIMITS.nameMax);
  if (!name) return { error: "Give the customer a name." };
  const existingIds = await store.smembers(customerIndexKey(orgId));
  if (existingIds.length >= CUSTOMER_LIMITS.perOrg) return { error: "This account has reached its customer limit." };

  const now = new Date().toISOString();
  const customer: Customer = {
    id: newId(),
    orgId,
    name,
    phone: cleanText(input.phone, CUSTOMER_LIMITS.phoneMax),
    email: cleanText(input.email, CUSTOMER_LIMITS.emailMax).toLowerCase(),
    addresses: cleanList(input.addresses, 200, CUSTOMER_LIMITS.addresses),
    notes: cleanText(input.notes, CUSTOMER_LIMITS.notesMax),
    tags: cleanList(input.tags, 40, CUSTOMER_LIMITS.tags),
    source: cleanSource(input.source, "direct"),
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await store.set(customerKey(orgId, customer.id), JSON.stringify(customer), CUSTOMER_TTL);
  await store.sadd(customerIndexKey(orgId), customer.id, CUSTOMER_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "customer.created", target: customer.id, detail: { source: customer.source } }, store);
  return customer;
}

export async function updateCustomer(
  orgId: string,
  actingUid: string,
  id: string,
  input: CustomerInput,
  store: KeyValueStore = getStore(),
): Promise<Customer | CustomerError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getCustomer(orgId, id, store);
  if (!existing) return { error: "Customer not found." };

  const updated: Customer = {
    ...existing,
    name: input.name !== undefined ? cleanText(input.name, CUSTOMER_LIMITS.nameMax) || existing.name : existing.name,
    phone: input.phone !== undefined ? cleanText(input.phone, CUSTOMER_LIMITS.phoneMax) : existing.phone,
    email: input.email !== undefined ? cleanText(input.email, CUSTOMER_LIMITS.emailMax).toLowerCase() : existing.email,
    addresses: input.addresses !== undefined ? cleanList(input.addresses, 200, CUSTOMER_LIMITS.addresses) : existing.addresses,
    notes: input.notes !== undefined ? cleanText(input.notes, CUSTOMER_LIMITS.notesMax) : existing.notes,
    tags: input.tags !== undefined ? cleanList(input.tags, 40, CUSTOMER_LIMITS.tags) : existing.tags,
    source: input.source !== undefined ? cleanSource(input.source, existing.source) : existing.source,
    updatedAt: new Date().toISOString(),
  };
  await store.set(customerKey(orgId, id), JSON.stringify(updated), CUSTOMER_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "customer.updated", target: id, detail: {} }, store);
  return updated;
}

export async function archiveCustomer(orgId: string, actingUid: string, id: string, store: KeyValueStore = getStore()): Promise<Customer | CustomerError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getCustomer(orgId, id, store);
  if (!existing) return { error: "Customer not found." };
  const updated: Customer = { ...existing, archived: true, updatedAt: new Date().toISOString() };
  await store.set(customerKey(orgId, id), JSON.stringify(updated), CUSTOMER_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "customer.archived", target: id, detail: {} }, store);
  return updated;
}
