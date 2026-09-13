/**
 * Shopify-style customizable public storefront for a contractor listing
 * (`docs/STRATEGY.md` §25.5 / §26.7). One storefront per org, plus overlays
 * for founding (platform-owned) listings that don't have an org yet.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { cleanText, cleanUrl, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const STOREFRONT_THEMES = ["classic", "bold", "workshop"] as const;
export type StorefrontTheme = (typeof STOREFRONT_THEMES)[number];
export const isStorefrontTheme = (value: unknown): value is StorefrontTheme =>
  typeof value === "string" && (STOREFRONT_THEMES as readonly string[]).includes(value);

export type StorefrontService = { name: string; description: string; priceFrom: string };
export type StorefrontPhoto = { url: string; caption: string };

export type Storefront = {
  theme: StorefrontTheme;
  accent: string;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string;
  about: string;
  hours: string;
  yearsInBusiness: string;
  ctaLabel: string;
  services: StorefrontService[];
  gallery: StorefrontPhoto[];
  showLeadForm: boolean;
  showHours: boolean;
  showGallery: boolean;
  showServices: boolean;
  published: boolean;
  /** Public calendar booking — the reason a homeowner uses the page (§28). */
  bookingEnabled: boolean;
  bookingStartHour: number;
  bookingEndHour: number;
  slotMinutes: number;
  bookingDriveMinutes: number;
  updatedAt: string;
};

export type StorefrontInput = Partial<{
  theme: StorefrontTheme;
  accent: string;
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string;
  about: string;
  hours: string;
  yearsInBusiness: string;
  ctaLabel: string;
  services: StorefrontService[];
  gallery: StorefrontPhoto[];
  showLeadForm: boolean;
  showHours: boolean;
  showGallery: boolean;
  showServices: boolean;
  published: boolean;
  bookingEnabled: boolean;
  bookingStartHour: number;
  bookingEndHour: number;
  slotMinutes: number;
  bookingDriveMinutes: number;
}>;

export const STOREFRONT_LIMITS = {
  taglineMax: 160,
  aboutMax: 4000,
  hoursMax: 400,
  yearsMax: 20,
  ctaMax: 40,
  services: 12,
  gallery: 12,
} as const;

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function defaultStorefront(overrides: Partial<Storefront> = {}): Storefront {
  return {
    theme: "classic",
    accent: "#0f766e",
    logoUrl: null,
    coverUrl: null,
    tagline: "",
    about: "",
    hours: "Monday–Friday, 8am–5pm",
    yearsInBusiness: "",
    ctaLabel: "Request a quote",
    services: [],
    gallery: [],
    showLeadForm: true,
    showHours: true,
    showGallery: true,
    showServices: true,
    published: true,
    bookingEnabled: true,
    bookingStartHour: 8,
    bookingEndHour: 17,
    slotMinutes: 60,
    bookingDriveMinutes: 20,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function clampHour(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 23 ? value : fallback;
}

export function normalizeStorefront(storefront: Storefront): Storefront {
  return {
    ...defaultStorefront(),
    ...storefront,
    bookingEnabled: storefront.bookingEnabled !== false,
    bookingStartHour: clampHour(storefront.bookingStartHour, 8),
    bookingEndHour: clampHour(storefront.bookingEndHour, 17),
    slotMinutes: typeof storefront.slotMinutes === "number" && storefront.slotMinutes > 0 ? storefront.slotMinutes : 60,
    bookingDriveMinutes: typeof storefront.bookingDriveMinutes === "number" && storefront.bookingDriveMinutes >= 0 ? storefront.bookingDriveMinutes : 20,
  };
}

function cleanAccent(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return HEX.test(trimmed) ? trimmed : fallback;
}

function cleanServices(value: unknown): StorefrontService[] {
  if (!Array.isArray(value)) return [];
  const out: StorefrontService[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const name = cleanText(rec.name, 80);
    if (!name || out.length >= STOREFRONT_LIMITS.services) continue;
    out.push({
      name,
      description: cleanText(rec.description, 400),
      priceFrom: cleanText(rec.priceFrom, 40),
    });
  }
  return out;
}

function cleanGallery(value: unknown): StorefrontPhoto[] {
  if (!Array.isArray(value)) return [];
  const out: StorefrontPhoto[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const url = cleanUrl(rec.url);
    if (!url || out.length >= STOREFRONT_LIMITS.gallery) continue;
    out.push({ url, caption: cleanText(rec.caption, 120) });
  }
  return out;
}

export function applyStorefrontInput(base: Storefront, input: StorefrontInput): Storefront {
  return {
    theme: input.theme !== undefined && isStorefrontTheme(input.theme) ? input.theme : base.theme,
    accent: input.accent !== undefined ? cleanAccent(input.accent, base.accent) : base.accent,
    logoUrl: input.logoUrl !== undefined ? cleanUrl(input.logoUrl) : base.logoUrl,
    coverUrl: input.coverUrl !== undefined ? cleanUrl(input.coverUrl) : base.coverUrl,
    tagline: input.tagline !== undefined ? cleanText(input.tagline, STOREFRONT_LIMITS.taglineMax) : base.tagline,
    about: input.about !== undefined ? cleanText(input.about, STOREFRONT_LIMITS.aboutMax) : base.about,
    hours: input.hours !== undefined ? cleanText(input.hours, STOREFRONT_LIMITS.hoursMax) : base.hours,
    yearsInBusiness: input.yearsInBusiness !== undefined ? cleanText(input.yearsInBusiness, STOREFRONT_LIMITS.yearsMax) : base.yearsInBusiness,
    ctaLabel: input.ctaLabel !== undefined ? cleanText(input.ctaLabel, STOREFRONT_LIMITS.ctaMax) || base.ctaLabel : base.ctaLabel,
    services: input.services !== undefined ? cleanServices(input.services) : base.services,
    gallery: input.gallery !== undefined ? cleanGallery(input.gallery) : base.gallery,
    showLeadForm: input.showLeadForm !== undefined ? Boolean(input.showLeadForm) : base.showLeadForm,
    showHours: input.showHours !== undefined ? Boolean(input.showHours) : base.showHours,
    showGallery: input.showGallery !== undefined ? Boolean(input.showGallery) : base.showGallery,
    showServices: input.showServices !== undefined ? Boolean(input.showServices) : base.showServices,
    published: input.published !== undefined ? Boolean(input.published) : base.published,
    bookingEnabled: input.bookingEnabled !== undefined ? Boolean(input.bookingEnabled) : base.bookingEnabled,
    bookingStartHour: input.bookingStartHour !== undefined ? clampHour(input.bookingStartHour, base.bookingStartHour) : base.bookingStartHour,
    bookingEndHour: input.bookingEndHour !== undefined ? clampHour(input.bookingEndHour, base.bookingEndHour) : base.bookingEndHour,
    slotMinutes: input.slotMinutes !== undefined && input.slotMinutes > 0 ? input.slotMinutes : base.slotMinutes,
    bookingDriveMinutes: input.bookingDriveMinutes !== undefined && input.bookingDriveMinutes >= 0 ? input.bookingDriveMinutes : base.bookingDriveMinutes,
    updatedAt: new Date().toISOString(),
  };
}

const orgKey = (orgId: string) => `storefront:${orgId}`;
const seedKey = (slug: string) => `storefront:seed:${slug}`;

export async function getOrgStorefront(orgId: string, store: KeyValueStore = getStore()): Promise<Storefront | null> {
  const raw = await store.get(orgKey(orgId));
  return raw ? normalizeStorefront(JSON.parse(raw) as Storefront) : null;
}

export async function getSeedStorefront(slug: string, store: KeyValueStore = getStore()): Promise<Storefront | null> {
  const raw = await store.get(seedKey(slug));
  return raw ? normalizeStorefront(JSON.parse(raw) as Storefront) : null;
}

export async function saveOrgStorefront(
  orgId: string,
  actingUid: string,
  input: StorefrontInput,
  store: KeyValueStore = getStore(),
): Promise<Storefront | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (permissionError) return permissionError;
  const existing = (await getOrgStorefront(orgId, store)) ?? defaultStorefront();
  const updated = applyStorefrontInput(existing, input);
  await store.set(orgKey(orgId), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "storefront.updated", target: orgId, detail: { theme: updated.theme, published: updated.published } }, store);
  return updated;
}

export async function saveSeedStorefront(
  slug: string,
  actorUid: string,
  input: StorefrontInput,
  store: KeyValueStore = getStore(),
  base?: Storefront,
): Promise<Storefront> {
  const existing = (await getSeedStorefront(slug, store)) ?? base ?? defaultStorefront();
  const updated = applyStorefrontInput(existing, input);
  await store.set(seedKey(slug), JSON.stringify(updated), RECORD_TTL);
  await logAuditEvent({ actorUid, action: "storefront.updated", target: `seed:${slug}`, detail: { theme: updated.theme, published: updated.published } }, store);
  return updated;
}
