/**
 * ServiceBusinessProfile — the contractor-facing domain profile for the
 * Service Business OS + Marketplace pivot (`docs/STRATEGY.md` §25).
 *
 * One profile per `Org` (§20 Phase 1's team/account primitive). Deliberately
 * a separate record referencing `orgId` rather than new fields bolted onto
 * `OrgRecord` (§25.3) — `Org` stays the minimal auth/billing/team primitive;
 * this carries every domain-specific field the marketplace and OS actually
 * need (trades, service area, licensing, the public listing slug). KV-backed,
 * same conventions as `lib/orgs/org.ts`.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser, type OrgRole } from "@/lib/auth/session";
import { getOrg } from "@/lib/orgs/org";
import { logAuditEvent } from "@/lib/audit/log";
import { isLeadTierId, type LeadTierId } from "@/lib/marketplace/pricing";

/**
 * Launch trade taxonomy for the NC marketplace + OS (§25.7, §31) —
 * the original five (§24) plus plumbing, electrical, painting, and
 * junk-removal (added when the founder asked to target repeat trades).
 */
export const TRADES = [
  "lawn-care",
  "hvac",
  "cleaning",
  "junk-removal",
  "pressure-washing",
  "parking-lot",
  "plumbing",
  "electrical",
  "painting",
] as const;
export type Trade = (typeof TRADES)[number];

export const TRADE_LABELS: Record<Trade, string> = {
  "lawn-care": "Lawn care & landscaping",
  hvac: "HVAC",
  cleaning: "Cleaning",
  "junk-removal": "Junk removal & haul-away",
  "pressure-washing": "Pressure washing & exterior",
  "parking-lot": "Parking lot & exterior paving",
  plumbing: "Plumbing",
  electrical: "Electrical",
  painting: "Painting",
};

/**
 * How often the same customer comes back. Agency sourcing and public
 * nav lead with these; parking-lot and painting stay listed, not hunted (§31).
 */
export const TRADE_REPEAT = {
  "lawn-care": "weekly",
  cleaning: "weekly",
  hvac: "membership",
  "junk-removal": "on-demand-repeat",
  "pressure-washing": "seasonal",
  plumbing: "on-demand-repeat",
  electrical: "on-demand-repeat",
  "parking-lot": "project",
  painting: "project",
} as const satisfies Record<Trade, "weekly" | "membership" | "on-demand-repeat" | "seasonal" | "project">;

export const REPEAT_TRADES = ["lawn-care", "cleaning", "hvac", "junk-removal"] as const;
export type RepeatTrade = (typeof REPEAT_TRADES)[number];

export function tradesForPublicNav(): Trade[] {
  const lead = new Set<string>(REPEAT_TRADES);
  return [...REPEAT_TRADES, ...TRADES.filter((trade) => !lead.has(trade))];
}

export const isTrade = (value: unknown): value is Trade => typeof value === "string" && (TRADES as readonly string[]).includes(value);

export function tradeMarketplacePitch(trade: Trade, cityName: string): string {
  switch (TRADE_REPEAT[trade]) {
    case "weekly":
      return `Tell us the job. We ping every available crew in ${cityName}. First one to claim it quotes and gets paid here. The money for that crew is the weekly route — book them next time on their page.`;
    case "membership":
      return `Need it done now? We ping available crews in ${cityName}; first claim owns the job. HVAC shops live on the maintenance plan, not the one emergency — if you already have a name, book the tune-up on their calendar.`;
    case "on-demand-repeat":
      return `Ping every available crew in ${cityName}. First claim owns the haul. If you run properties, put the crew you liked on the book so the next turnover is not another blast.`;
    case "seasonal":
      return `Tell us the job. We ping every available crew in ${cityName}. First claim quotes and gets paid here. Or pick a specific crew and book their calendar.`;
    case "project":
      return `Tell us the job. We ping every available crew in ${cityName}. First one to claim it quotes and gets paid here. Or pick a specific crew below and book their calendar.`;
  }
}

/**
 * Which of §26's three legs is actually running this account's operation —
 * `"self-serve"` (the contractor runs their own OS) or `"managed"`
 * (Launchabl's own team runs it for them, the agency/"Managed Growth" leg,
 * §26.4). Deliberately not settable through the ordinary org-scoped update
 * path (`ServiceBusinessProfileInput`/`updateServiceBusinessProfile`) — a
 * contractor can't self-assign white-glove service any more than they can
 * self-assign a subscription tier; only `setEngagementType`, gated by
 * platform-admin auth at the route level rather than org membership, can
 * change it.
 */
export const ENGAGEMENT_TYPES = ["self-serve", "managed"] as const;
export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];
export const isEngagementType = (value: unknown): value is EngagementType => typeof value === "string" && (ENGAGEMENT_TYPES as readonly string[]).includes(value);

export type ServiceBusinessProfile = {
  orgId: string;
  engagementType: EngagementType;
  /** Public marketplace listing slug — e.g. `/nc/greensboro/lawn-care/{slug}`. Unique across all profiles. */
  slug: string;
  trades: Trade[];
  /** NC cities/counties served — free text, not an enum, so coverage can start narrow without a code change per city. */
  serviceArea: string[];
  address: string;
  phone: string;
  licensed: boolean;
  insured: boolean;
  bonded: boolean;
  gbpUrl: string | null;
  websiteUrl: string | null;
  /**
   * Explicit contractor consent to let their saved knowledge notes
   * (`lib/service-business/knowledge.ts`) feed the cross-account learning
   * pool that improves every account's AI agents (§18.2.2's outcome-data
   * flywheel, §25.2's repurposing of `markdown-file-generator`). Defaults
   * to `false` — knowledge notes are always saved privately to the org
   * regardless of this flag; this only controls whether they're also
   * eligible for cross-account reuse.
   */
  allowKnowledgeSharing: boolean;
  /** Marketplace lead-volume tier (§25.7 Q1). Defaults from engagement type when missing on older records. */
  leadTier: LeadTierId;
  createdAt: string;
  updatedAt: string;
};

export type ServiceBusinessProfileInput = {
  trades?: Trade[];
  serviceArea?: string[];
  address?: string;
  phone?: string;
  licensed?: boolean;
  insured?: boolean;
  bonded?: boolean;
  gbpUrl?: string | null;
  websiteUrl?: string | null;
  allowKnowledgeSharing?: boolean;
  leadTier?: LeadTierId;
};

export const PROFILE_LIMITS = { serviceArea: 20, addressMax: 200, phoneMax: 40, slugMax: 80 } as const;
const PROFILE_TTL = 3 * 365 * 24 * 60 * 60;

export type ProfileError = { error: string };

const profileKey = (orgId: string) => `svcprofile:${orgId}`;
const slugIndexKey = (slug: string) => `svcprofile:slug:${slug}`;
const allProfilesKey = () => "svcprofile:all";

export function normaliseProfile(raw: ServiceBusinessProfile): ServiceBusinessProfile {
  return {
    ...raw,
    leadTier: isLeadTierId(raw.leadTier) ? raw.leadTier : raw.engagementType === "managed" ? "managed" : "listing",
  };
}

export const isSlug = (value: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length >= 3 && value.length <= PROFILE_LIMITS.slugMax;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PROFILE_LIMITS.slugMax - 6);
  return base || "business";
}

function cleanTrades(value: unknown): Trade[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<Trade>();
  for (const item of value) if (isTrade(item)) seen.add(item);
  return Array.from(seen);
}

function cleanServiceArea(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const cleaned = item.replace(/\s+/g, " ").trim();
    if (cleaned && seen.size < PROFILE_LIMITS.serviceArea) seen.add(cleaned.slice(0, 80));
  }
  return Array.from(seen);
}

const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const cleanUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value.trim()).toString();
  } catch {
    return null;
  }
};

/** Same permission shape as `org.ts`'s internal guard — a profile is edited by anyone with `owner`/`admin` on its org. */
async function requireOrgRole(orgId: string, actingUid: string, allowedRoles: OrgRole[], store: KeyValueStore): Promise<null | ProfileError> {
  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };
  const actor = await getUser(actingUid, store);
  if (!actor || actor.orgId !== orgId || !actor.orgRole || !allowedRoles.includes(actor.orgRole)) {
    return { error: "You don't have permission to do that." };
  }
  return null;
}

export async function getServiceBusinessProfile(orgId: string, store: KeyValueStore = getStore()): Promise<ServiceBusinessProfile | null> {
  const raw = await store.get(profileKey(orgId));
  return raw ? normaliseProfile(JSON.parse(raw) as ServiceBusinessProfile) : null;
}

export async function listServiceBusinessProfiles(store: KeyValueStore = getStore()): Promise<ServiceBusinessProfile[]> {
  const ids = await store.smembers(allProfilesKey());
  const profiles: ServiceBusinessProfile[] = [];
  for (const orgId of ids) {
    const profile = await getServiceBusinessProfile(orgId, store);
    if (profile) profiles.push(profile);
    else await store.srem(allProfilesKey(), orgId);
  }
  return profiles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function uniqueSlug(base: string, store: KeyValueStore): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await store.get(slugIndexKey(candidate))) {
    candidate = `${base}-${suffix}`.slice(0, PROFILE_LIMITS.slugMax);
    suffix += 1;
  }
  return candidate;
}

/** Creates the profile for an org that doesn't have one yet. Idempotent-ish: returns the existing profile instead of erroring if called twice. */
export async function createServiceBusinessProfile(
  orgId: string,
  actingUid: string,
  input: ServiceBusinessProfileInput,
  store: KeyValueStore = getStore(),
): Promise<ServiceBusinessProfile | ProfileError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (permissionError) return permissionError;
  const existing = await getServiceBusinessProfile(orgId, store);
  if (existing) return existing;

  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };

  const slug = await uniqueSlug(slugify(org.name), store);
  const now = new Date().toISOString();
  const profile: ServiceBusinessProfile = {
    orgId,
    slug,
    trades: cleanTrades(input.trades),
    serviceArea: cleanServiceArea(input.serviceArea),
    address: cleanText(input.address, PROFILE_LIMITS.addressMax),
    phone: cleanText(input.phone, PROFILE_LIMITS.phoneMax),
    licensed: Boolean(input.licensed),
    insured: Boolean(input.insured),
    bonded: Boolean(input.bonded),
    gbpUrl: cleanUrl(input.gbpUrl),
    websiteUrl: cleanUrl(input.websiteUrl),
    allowKnowledgeSharing: Boolean(input.allowKnowledgeSharing),
    engagementType: "self-serve",
    leadTier: isLeadTierId(input.leadTier) ? input.leadTier : "listing",
    createdAt: now,
    updatedAt: now,
  };
  await store.set(profileKey(orgId), JSON.stringify(profile), PROFILE_TTL);
  await store.set(slugIndexKey(slug), orgId, PROFILE_TTL);
  await store.sadd(allProfilesKey(), orgId, PROFILE_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "svcprofile.created", target: orgId, detail: { slug, trades: profile.trades } }, store);
  return profile;
}

export async function updateServiceBusinessProfile(
  orgId: string,
  actingUid: string,
  input: ServiceBusinessProfileInput,
  store: KeyValueStore = getStore(),
): Promise<ServiceBusinessProfile | ProfileError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (permissionError) return permissionError;
  const existing = await getServiceBusinessProfile(orgId, store);
  if (!existing) return { error: "This org hasn't set up a service-business profile yet." };

  const updated: ServiceBusinessProfile = {
    ...existing,
    trades: input.trades !== undefined ? cleanTrades(input.trades) : existing.trades,
    serviceArea: input.serviceArea !== undefined ? cleanServiceArea(input.serviceArea) : existing.serviceArea,
    address: input.address !== undefined ? cleanText(input.address, PROFILE_LIMITS.addressMax) : existing.address,
    phone: input.phone !== undefined ? cleanText(input.phone, PROFILE_LIMITS.phoneMax) : existing.phone,
    licensed: input.licensed !== undefined ? Boolean(input.licensed) : existing.licensed,
    insured: input.insured !== undefined ? Boolean(input.insured) : existing.insured,
    bonded: input.bonded !== undefined ? Boolean(input.bonded) : existing.bonded,
    gbpUrl: input.gbpUrl !== undefined ? cleanUrl(input.gbpUrl) : existing.gbpUrl,
    websiteUrl: input.websiteUrl !== undefined ? cleanUrl(input.websiteUrl) : existing.websiteUrl,
    allowKnowledgeSharing: input.allowKnowledgeSharing !== undefined ? Boolean(input.allowKnowledgeSharing) : existing.allowKnowledgeSharing,
    leadTier: input.leadTier !== undefined && isLeadTierId(input.leadTier) ? input.leadTier : existing.leadTier,
    updatedAt: new Date().toISOString(),
  };
  const consentChanged = updated.allowKnowledgeSharing !== existing.allowKnowledgeSharing;
  await store.set(profileKey(orgId), JSON.stringify(updated), PROFILE_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "svcprofile.updated", target: orgId, detail: { trades: updated.trades } }, store);
  if (consentChanged) {
    await logAuditEvent(
      { orgId, actorUid: actingUid, action: "svcprofile.knowledge_consent_changed", target: orgId, detail: { allowKnowledgeSharing: updated.allowKnowledgeSharing } },
      store,
    );
  }
  return updated;
}

/**
 * Platform-ops action (§26.4): flips an account between the self-serve OS
 * and Launchabl-managed delivery. `actorLabel` is an internal identifier
 * for the audit trail (e.g. an admin email), not an org member — callers
 * must gate this at the route level with platform-admin auth
 * (`lib/admin/auth.ts`'s `adminAuthorized`), not org role, since the
 * whole point is that a contractor can't grant themselves managed service.
 */
export async function setEngagementType(
  orgId: string,
  actorLabel: string,
  engagementType: EngagementType,
  store: KeyValueStore = getStore(),
): Promise<ServiceBusinessProfile | ProfileError> {
  const existing = await getServiceBusinessProfile(orgId, store);
  if (!existing) return { error: "This org hasn't set up a service-business profile yet." };
  if (existing.engagementType === engagementType) return existing;

  const updated: ServiceBusinessProfile = {
    ...existing,
    engagementType,
    leadTier: engagementType === "managed" ? "managed" : existing.leadTier === "managed" ? "os" : existing.leadTier,
    updatedAt: new Date().toISOString(),
  };
  await store.set(profileKey(orgId), JSON.stringify(updated), PROFILE_TTL);
  await logAuditEvent({ orgId, actorUid: actorLabel, action: "svcprofile.engagement_changed", target: orgId, detail: { engagementType } }, store);
  return updated;
}

/** Marketplace-side lookup: resolve a profile from its public listing slug (e.g. rendering `/nc/[city]/[trade]/[slug]`, §25.5). */
export async function getServiceBusinessProfileBySlug(slug: string, store: KeyValueStore = getStore()): Promise<ServiceBusinessProfile | null> {
  if (!isSlug(slug)) return null;
  const orgId = await store.get(slugIndexKey(slug));
  return orgId ? getServiceBusinessProfile(orgId, store) : null;
}
