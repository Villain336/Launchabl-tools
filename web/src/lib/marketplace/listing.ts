import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getOrg } from "@/lib/orgs/org";
import { getServiceBusinessProfileBySlug, listServiceBusinessProfiles, type ServiceBusinessProfile } from "@/lib/service-business/profile";
import { defaultStorefront, getOrgStorefront, getSeedStorefront, saveSeedStorefront, type Storefront, type StorefrontInput } from "@/lib/service-business/storefront";
import { cleanText, RECORD_TTL } from "@/lib/service-business/shared";
import { citySlug, getCity, isNcCitySlug, isTradeSlug, matchCitySlug } from "./cities";
import { FOUNDING_LISTINGS, getFoundingListing, type FoundingListing } from "./founding";
import { listJobs } from "@/lib/service-business/job";
import { EMPTY_PROOF, listReviewsForListing, type ListingProof } from "@/lib/service-business/review";

export type FoundingMeta = { name?: string; phone?: string; address?: string };

const foundingMetaKey = (slug: string) => `listing:seed-meta:${slug}`;

export async function getFoundingMeta(slug: string, store: KeyValueStore): Promise<FoundingMeta> {
  const raw = await store.get(foundingMetaKey(slug));
  return raw ? (JSON.parse(raw) as FoundingMeta) : {};
}

export type PublicListing = {
  slug: string;
  name: string;
  orgId: string | null;
  trades: ServiceBusinessProfile["trades"];
  cities: string[];
  phone: string;
  address: string;
  licensed: boolean;
  insured: boolean;
  bonded: boolean;
  websiteUrl: string | null;
  gbpUrl: string | null;
  placeholder: boolean;
  storefront: Storefront;
  proof: ListingProof;
};

/** Product law (§27): rank by OS-verified completed work, never by paid placement. */
export function compareListingsByVerifiedWork(a: PublicListing, b: PublicListing): number {
  const byJobs = b.proof.completedJobs - a.proof.completedJobs;
  if (byJobs !== 0) return byJobs;
  return a.name.localeCompare(b.name);
}

export function listingPath(listing: Pick<PublicListing, "cities" | "trades" | "slug">, city?: string, trade?: string): string {
  const citySlugValue = city && listing.cities.includes(city) ? city : listing.cities[0] ?? "greensboro";
  const tradeSlug = trade && listing.trades.includes(trade as PublicListing["trades"][number]) ? trade : listing.trades[0] ?? "lawn-care";
  return `/nc/${citySlugValue}/${tradeSlug}/${listing.slug}`;
}

function citiesFromProfile(profile: ServiceBusinessProfile): string[] {
  const slugs = new Set<string>();
  for (const area of profile.serviceArea) {
    const matched = matchCitySlug(area) ?? (isNcCitySlug(citySlug(area)) ? citySlug(area) : null);
    if (matched) slugs.add(matched);
  }
  return Array.from(slugs);
}

async function listingFromFounding(seed: FoundingListing, store: KeyValueStore): Promise<PublicListing> {
  const [overlay, meta] = await Promise.all([getSeedStorefront(seed.slug, store), getFoundingMeta(seed.slug, store)]);
  const name = cleanText(meta.name, 80) || seed.name;
  const listing: PublicListing = {
    slug: seed.slug,
    name,
    orgId: null,
    trades: seed.trades,
    cities: seed.cities,
    phone: cleanText(meta.phone, 40) || seed.phone,
    address: cleanText(meta.address, 200) || seed.address,
    licensed: seed.licensed,
    insured: seed.insured,
    bonded: seed.bonded,
    websiteUrl: seed.websiteUrl,
    gbpUrl: seed.gbpUrl,
    placeholder: seed.placeholder && !meta.name,
    storefront: overlay ?? seed.storefront,
    proof: EMPTY_PROOF,
  };
  return withProof(listing, store);
}

async function listingFromProfile(profile: ServiceBusinessProfile, store: KeyValueStore): Promise<PublicListing | null> {
  const org = await getOrg(profile.orgId, store);
  if (!org) return null;
  const storefront = (await getOrgStorefront(profile.orgId, store)) ?? defaultStorefront({ published: false });
  if (!storefront.published) return null;
  const cities = citiesFromProfile(profile);
  if (profile.trades.length === 0 || cities.length === 0) return null;
  const listing: PublicListing = {
    slug: profile.slug,
    name: org.name,
    orgId: profile.orgId,
    trades: profile.trades,
    cities,
    phone: profile.phone,
    address: profile.address,
    licensed: profile.licensed,
    insured: profile.insured,
    bonded: profile.bonded,
    websiteUrl: profile.websiteUrl,
    gbpUrl: profile.gbpUrl,
    placeholder: false,
    storefront,
    proof: EMPTY_PROOF,
  };
  return withProof(listing, store);
}

async function withProof(listing: PublicListing, store: KeyValueStore): Promise<PublicListing> {
  const reviews = await listReviewsForListing(listing.slug, store);
  if (!listing.orgId) return { ...listing, proof: { completedJobs: 0, reviews } };
  const jobs = await listJobs(listing.orgId, store);
  return { ...listing, proof: { completedJobs: jobs.filter((job) => job.status === "completed").length, reviews } };
}

export async function listDirectory(store: KeyValueStore = getStore()): Promise<PublicListing[]> {
  const founding = await Promise.all(FOUNDING_LISTINGS.map((seed) => listingFromFounding(seed, store)));
  const profiles = await listServiceBusinessProfiles(store);
  const fromOrgs: PublicListing[] = [];
  const foundingSlugs = new Set(founding.map((l) => l.slug));
  for (const profile of profiles) {
    if (foundingSlugs.has(profile.slug)) continue;
    const listing = await listingFromProfile(profile, store);
    if (listing) fromOrgs.push(listing);
  }
  return [...founding.filter((l) => l.storefront.published), ...fromOrgs].sort(compareListingsByVerifiedWork);
}

export async function listDirectoryFiltered(opts: { city?: string; trade?: string }, store: KeyValueStore = getStore()): Promise<PublicListing[]> {
  const all = await listDirectory(store);
  return all.filter((listing) => {
    if (opts.city && !listing.cities.includes(opts.city)) return false;
    if (opts.trade && !listing.trades.includes(opts.trade as PublicListing["trades"][number])) return false;
    return true;
  });
}

export async function getListing(slug: string, store: KeyValueStore = getStore()): Promise<PublicListing | null> {
  const seed = getFoundingListing(slug);
  if (seed) return listingFromFounding(seed, store);
  const profile = await getServiceBusinessProfileBySlug(slug, store);
  if (!profile) return null;
  return listingFromProfile(profile, store);
}

export async function getListingForPublicPage(city: string, trade: string, slug: string, store: KeyValueStore = getStore()): Promise<PublicListing | null> {
  if (!isNcCitySlug(city) || !isTradeSlug(trade)) return null;
  const listing = await getListing(slug, store);
  if (!listing || !listing.storefront.published) return null;
  if (!listing.cities.includes(city) || !listing.trades.includes(trade)) return null;
  return listing;
}

export async function updateFoundingListing(
  slug: string,
  actorUid: string,
  input: StorefrontInput & FoundingMeta,
  store: KeyValueStore = getStore(),
): Promise<PublicListing | { error: string }> {
  const seed = getFoundingListing(slug);
  if (!seed) return { error: "Unknown founding listing." };
  const prev = await getFoundingMeta(slug, store);
  const meta: FoundingMeta = {
    name: input.name !== undefined ? cleanText(input.name, 80) : prev.name,
    phone: input.phone !== undefined ? cleanText(input.phone, 40) : prev.phone,
    address: input.address !== undefined ? cleanText(input.address, 200) : prev.address,
  };
  await store.set(foundingMetaKey(slug), JSON.stringify(meta), RECORD_TTL);
  await saveSeedStorefront(slug, actorUid, input, store, seed.storefront);
  return listingFromFounding(seed, store);
}

export function cityLabel(slug: string): string {
  return getCity(slug)?.name ?? slug;
}
