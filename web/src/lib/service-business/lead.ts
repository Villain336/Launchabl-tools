/**
 * Marketplace lead + monthly allotment counter (`docs/STRATEGY.md` §25.3/§25.7).
 * Tiers buy volume, never quality — a held lead is the same lead, just not
 * delivered this period because the contractor's allotment is used up.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { LEAD_TIERS, type LeadTierId } from "@/lib/marketplace/pricing";
import { isTrade, type Trade } from "./profile";
import { cleanText, currentPeriod, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const LEAD_STATUSES = ["new", "contacted", "quoted", "won", "lost", "held"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export const isLeadStatus = (value: unknown): value is LeadStatus => typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);

export const LEAD_URGENCIES = ["flexible", "soon", "asap"] as const;
export type LeadUrgency = (typeof LEAD_URGENCIES)[number];
export const isLeadUrgency = (value: unknown): value is LeadUrgency => typeof value === "string" && (LEAD_URGENCIES as readonly string[]).includes(value);

export type Lead = {
  id: string;
  /** Org that received it, or null for a founding listing that isn't claimed yet. */
  orgId: string | null;
  listingSlug: string;
  trade: Trade;
  city: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  urgency: LeadUrgency;
  sourcePath: string;
  status: LeadStatus;
  held: boolean;
  customerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = {
  listingSlug?: string;
  trade?: Trade;
  city?: string;
  name?: string;
  phone?: string;
  email?: string;
  description?: string;
  urgency?: LeadUrgency;
  sourcePath?: string;
};

export const LEAD_LIMITS = { nameMax: 120, phoneMax: 40, emailMax: 200, descriptionMax: 2000, cityMax: 80 } as const;

const leadKey = (id: string) => `lead:${id}`;
const orgIndexKey = (orgId: string) => `lead:${orgId}:all`;
const listingIndexKey = (slug: string) => `lead:listing:${slug}`;
const allotmentKey = (orgId: string, period: string) => `leadallot:${orgId}:${period}`;

export async function getLead(id: string, store: KeyValueStore = getStore()): Promise<Lead | null> {
  const raw = await store.get(leadKey(id));
  return raw ? (JSON.parse(raw) as Lead) : null;
}

async function listByIndex(indexKey: string, store: KeyValueStore): Promise<Lead[]> {
  const ids = await store.smembers(indexKey);
  const leads: Lead[] = [];
  for (const id of ids) {
    const lead = await getLead(id, store);
    if (lead) leads.push(lead);
    else await store.srem(indexKey, id);
  }
  return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listLeadsForOrg(orgId: string, store: KeyValueStore = getStore()): Promise<Lead[]> {
  return listByIndex(orgIndexKey(orgId), store);
}

export async function listLeadsForListing(slug: string, store: KeyValueStore = getStore()): Promise<Lead[]> {
  return listByIndex(listingIndexKey(slug), store);
}

export async function readAllotment(
  orgId: string,
  tier: LeadTierId,
  store: KeyValueStore = getStore(),
  now = new Date(),
): Promise<{ period: string; used: number; limit: number; remaining: number }> {
  const period = currentPeriod(now);
  const used = await store.getCounter(allotmentKey(orgId, period));
  const limit = LEAD_TIERS[tier].monthlyLeads;
  return { period, used, limit, remaining: Math.max(0, limit - used) };
}

export type SubmitLeadArgs = LeadInput & {
  orgId?: string | null;
  leadTier?: LeadTierId;
};

export async function submitLead(input: SubmitLeadArgs, store: KeyValueStore = getStore()): Promise<Lead | DomainError> {
  const name = cleanText(input.name, LEAD_LIMITS.nameMax);
  const phone = cleanText(input.phone, LEAD_LIMITS.phoneMax);
  const email = cleanText(input.email, LEAD_LIMITS.emailMax).toLowerCase();
  const description = cleanText(input.description, LEAD_LIMITS.descriptionMax);
  const listingSlug = cleanText(input.listingSlug, 80);
  const city = cleanText(input.city, LEAD_LIMITS.cityMax);
  if (!name) return { error: "Tell us your name." };
  if (!phone && !email) return { error: "Leave a phone number or email so they can reach you." };
  if (!listingSlug) return { error: "Missing listing." };
  if (!input.trade || !isTrade(input.trade)) return { error: "Pick a trade." };
  if (!city) return { error: "Tell us the city." };

  const orgId = input.orgId ?? null;
  let held = false;
  if (orgId) {
    const allotment = await readAllotment(orgId, input.leadTier ?? "listing", store);
    if (allotment.remaining <= 0) held = true;
    else await store.incr(allotmentKey(orgId, allotment.period), RECORD_TTL);
  }

  const now = new Date().toISOString();
  const lead: Lead = {
    id: newId("lead"),
    orgId,
    listingSlug,
    trade: input.trade,
    city,
    name,
    phone,
    email,
    description,
    urgency: isLeadUrgency(input.urgency) ? input.urgency : "flexible",
    sourcePath: cleanText(input.sourcePath, 200),
    status: held ? "held" : "new",
    held,
    customerId: null,
    createdAt: now,
    updatedAt: now,
  };
  await store.set(leadKey(lead.id), JSON.stringify(lead), RECORD_TTL);
  await store.sadd(listingIndexKey(listingSlug), lead.id, RECORD_TTL);
  if (orgId) await store.sadd(orgIndexKey(orgId), lead.id, RECORD_TTL);
  await logAuditEvent(
    { orgId, actorUid: "marketplace", action: "lead.created", target: lead.id, detail: { listingSlug, held, trade: lead.trade, city } },
    store,
  );
  return lead;
}

export async function updateLead(
  orgId: string,
  actingUid: string,
  id: string,
  input: { status?: LeadStatus; customerId?: string | null },
  store: KeyValueStore = getStore(),
): Promise<Lead | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const existing = await getLead(id, store);
  if (!existing || existing.orgId !== orgId) return { error: "Lead not found." };
  const updated: Lead = {
    ...existing,
    status: input.status !== undefined && isLeadStatus(input.status) ? input.status : existing.status,
    customerId: input.customerId !== undefined ? input.customerId : existing.customerId,
    updatedAt: new Date().toISOString(),
  };
  await store.set(leadKey(id), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "lead.updated", target: id, detail: { status: updated.status } }, store);
  return updated;
}
