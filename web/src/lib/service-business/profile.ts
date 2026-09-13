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

/**
 * Starting trade taxonomy — carried forward from the home-services vertical
 * overlay (§24) rather than invented fresh, since that's the category
 * knowledge already built into `local-seo-optimizer` and `Project.vertical`.
 * Confirm/expand per §25.7 Q2 before treating this as final.
 */
export const TRADES = ["lawn-care", "hvac", "cleaning", "pressure-washing", "parking-lot"] as const;
export type Trade = (typeof TRADES)[number];

export const TRADE_LABELS: Record<Trade, string> = {
  "lawn-care": "Lawn care & landscaping",
  hvac: "HVAC",
  cleaning: "Cleaning",
  "pressure-washing": "Pressure washing & exterior",
  "parking-lot": "Parking lot & exterior paving",
};

export const isTrade = (value: unknown): value is Trade => typeof value === "string" && (TRADES as readonly string[]).includes(value);

export type ServiceBusinessProfile = {
  orgId: string;
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
};

export const PROFILE_LIMITS = { serviceArea: 20, addressMax: 200, phoneMax: 40, slugMax: 80 } as const;
const PROFILE_TTL = 3 * 365 * 24 * 60 * 60;

export type ProfileError = { error: string };

const profileKey = (orgId: string) => `svcprofile:${orgId}`;
const slugIndexKey = (slug: string) => `svcprofile:slug:${slug}`;

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
  return raw ? (JSON.parse(raw) as ServiceBusinessProfile) : null;
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
    createdAt: now,
    updatedAt: now,
  };
  await store.set(profileKey(orgId), JSON.stringify(profile), PROFILE_TTL);
  await store.set(slugIndexKey(slug), orgId, PROFILE_TTL);
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
    updatedAt: new Date().toISOString(),
  };
  await store.set(profileKey(orgId), JSON.stringify(updated), PROFILE_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "svcprofile.updated", target: orgId, detail: { trades: updated.trades } }, store);
  return updated;
}

/** Marketplace-side lookup: resolve a profile from its public listing slug (e.g. rendering `/nc/[city]/[trade]/[slug]`, §25.5). */
export async function getServiceBusinessProfileBySlug(slug: string, store: KeyValueStore = getStore()): Promise<ServiceBusinessProfile | null> {
  if (!isSlug(slug)) return null;
  const orgId = await store.get(slugIndexKey(slug));
  return orgId ? getServiceBusinessProfile(orgId, store) : null;
}
