/**
 * DoorDash-style service offers (§29): the homeowner picks a job, we ping
 * every available crew in that city×trade, first claim owns it. Not Angi —
 * others do not buy the same contact. Quote and pay stay on this offer.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getOrg } from "@/lib/orgs/org";
import { siteConfig } from "@/lib/site-config";
import { listDirectoryFiltered } from "@/lib/marketplace/listing";
import { sendOrgAlert, type AlertDeps } from "./alerts";
import { createCustomer } from "./customer";
import { createEstimate, getEstimate, type Estimate } from "./estimate";
import { createJob } from "./job";
import { isLeadUrgency, submitLead, type LeadUrgency } from "./lead";
import { hasNetworkSeat } from "@/lib/marketplace/pricing";
import { getServiceBusinessProfile, isTrade, type Trade } from "./profile";
import { cleanText, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const OFFER_STATUSES = ["open", "claimed", "quoted", "paid", "expired", "canceled"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
export const isOfferStatus = (value: unknown): value is OfferStatus =>
  typeof value === "string" && (OFFER_STATUSES as readonly string[]).includes(value);

export type ServiceOffer = {
  id: string;
  trade: Trade;
  city: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  urgency: LeadUrgency;
  sourcePath: string;
  status: OfferStatus;
  pingedOrgIds: string[];
  claimedOrgId: string | null;
  claimedAt: string | null;
  jobId: string | null;
  customerId: string | null;
  leadId: string | null;
  estimateId: string | null;
  homeownerToken: string;
  exclusiveAfterClaim: true;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicOfferView = {
  id: string;
  trade: Trade;
  city: string;
  status: OfferStatus;
  description: string;
  expiresAt: string;
  pingedCount: number;
  claimedByName: string | null;
  estimate: { totalCents: number; notes: string; lineItems: Estimate["lineItems"] } | null;
  paid: boolean;
};

const offerKey = (id: string) => `offer:${id}`;
const openIndex = "offer:open";
const orgIndex = (orgId: string) => `offer:org:${orgId}`;
const tokenKey = (token: string) => `offertok:${token}`;
const claimLock = (id: string) => `offerclaim:${id}`;

const OFFER_WINDOW_MS = 2 * 60 * 60 * 1000;

export function normalizeOffer(offer: ServiceOffer): ServiceOffer {
  return { ...offer, exclusiveAfterClaim: true };
}

export async function getOffer(id: string, store: KeyValueStore = getStore()): Promise<ServiceOffer | null> {
  const raw = await store.get(offerKey(id));
  if (!raw) return null;
  const offer = normalizeOffer(JSON.parse(raw) as ServiceOffer);
  if (offer.status === "open" && Date.parse(offer.expiresAt) <= Date.now()) {
    const expired = { ...offer, status: "expired" as const, updatedAt: new Date().toISOString() };
    await store.set(offerKey(id), JSON.stringify(expired), RECORD_TTL);
    await store.srem(openIndex, id);
    return expired;
  }
  return offer;
}

export async function getOfferByToken(id: string, token: string, store: KeyValueStore = getStore()): Promise<ServiceOffer | null> {
  const offer = await getOffer(id, store);
  if (!offer || offer.homeownerToken !== token) return null;
  return offer;
}

async function listByIndex(index: string, store: KeyValueStore): Promise<ServiceOffer[]> {
  const ids = await store.smembers(index);
  const offers: ServiceOffer[] = [];
  for (const id of ids) {
    const offer = await getOffer(id, store);
    if (offer) offers.push(offer);
    else await store.srem(index, id);
  }
  return offers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listOpenOffers(store: KeyValueStore = getStore()): Promise<ServiceOffer[]> {
  return (await listByIndex(openIndex, store)).filter((offer) => offer.status === "open");
}

export async function listOffersForOrg(orgId: string, store: KeyValueStore = getStore()): Promise<ServiceOffer[]> {
  return listByIndex(orgIndex(orgId), store);
}

export type AvailableCrew = { orgId: string; slug: string; name: string };

export async function listAvailableCrews(city: string, trade: Trade, store: KeyValueStore = getStore()): Promise<AvailableCrew[]> {
  const listings = await listDirectoryFiltered({ city, trade }, store);
  const crews: AvailableCrew[] = [];
  for (const listing of listings) {
    if (!listing.orgId || !listing.storefront.published) continue;
    if (listing.storefront.acceptingOffers === false) continue;
    const profile = await getServiceBusinessProfile(listing.orgId, store);
    if (!profile || !hasNetworkSeat(profile.leadTier)) continue;
    crews.push({ orgId: listing.orgId, slug: listing.slug, name: listing.name });
  }
  return crews;
}

export async function createServiceOffer(
  input: {
    trade?: Trade;
    city?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    urgency?: LeadUrgency;
    sourcePath?: string;
  },
  store: KeyValueStore = getStore(),
  now = new Date(),
  deps: AlertDeps = {},
): Promise<ServiceOffer | DomainError> {
  const name = cleanText(input.name, 120);
  const phone = cleanText(input.phone, 40);
  const email = cleanText(input.email, 200).toLowerCase();
  const city = cleanText(input.city, 80);
  const description = cleanText(input.description, 2000);
  if (!name) return { error: "Tell us your name." };
  if (!phone && !email) return { error: "Leave a phone number or email." };
  if (!input.trade || !isTrade(input.trade)) return { error: "Pick a service." };
  if (!city) return { error: "Tell us the city." };
  if (!description) return { error: "Tell us what you need done." };

  const crews = await listAvailableCrews(city, input.trade, store);
  const createdAt = now.toISOString();
  const offer: ServiceOffer = {
    id: newId("off"),
    trade: input.trade,
    city,
    name,
    phone,
    email,
    address: cleanText(input.address, 200),
    description,
    urgency: isLeadUrgency(input.urgency) ? input.urgency : "asap",
    sourcePath: cleanText(input.sourcePath, 200),
    status: "open",
    pingedOrgIds: crews.map((crew) => crew.orgId),
    claimedOrgId: null,
    claimedAt: null,
    jobId: null,
    customerId: null,
    leadId: null,
    estimateId: null,
    homeownerToken: newId("offtok"),
    exclusiveAfterClaim: true,
    expiresAt: new Date(now.getTime() + OFFER_WINDOW_MS).toISOString(),
    createdAt,
    updatedAt: createdAt,
  };
  await store.set(offerKey(offer.id), JSON.stringify(offer), RECORD_TTL);
  await store.set(tokenKey(offer.homeownerToken), offer.id, RECORD_TTL);
  await store.sadd(openIndex, offer.id, RECORD_TTL);
  for (const crew of crews) {
    await store.sadd(orgIndex(crew.orgId), offer.id, RECORD_TTL);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
    await sendOrgAlert(
      crew.orgId,
      {
        title: `${offer.trade} job in ${offer.city} — first to claim`,
        body: `${offer.name} needs: ${offer.description}${offer.address ? ` @ ${offer.address}` : ""}. First crew to claim owns it. Open ${origin}/os/offers`,
      },
      store,
      deps,
    );
  }
  return offer;
}

export async function claimServiceOffer(
  orgId: string,
  actingUid: string,
  offerId: string,
  store: KeyValueStore = getStore(),
): Promise<ServiceOffer | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const offer = await getOffer(offerId, store);
  if (!offer) return { error: "That job is gone." };
  if (offer.status === "expired") return { error: "That request expired." };
  if (offer.status !== "open") return { error: "Someone already took that job." };
  const profile = await getServiceBusinessProfile(orgId, store);
  if (!profile || !hasNetworkSeat(profile.leadTier)) return { error: "Network membership is required to claim jobs." };
  if (!offer.pingedOrgIds.includes(orgId)) return { error: "This job was not sent to your crew." };
  const locked = await store.setNx(claimLock(offer.id), orgId, RECORD_TTL);
  if (!locked) return { error: "Someone already took that job." };

  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };
  const lead = await submitLead(
    {
      orgId,
      listingSlug: `dispatch-${offer.trade}`,
      trade: offer.trade,
      city: offer.city,
      name: offer.name,
      phone: offer.phone,
      email: offer.email,
      description: offer.description,
      urgency: offer.urgency,
      sourcePath: offer.sourcePath || "/dispatch",
      address: offer.address,
      mustDeliver: true,
    },
    store,
  );
  if ("error" in lead) return lead;
  const customer = await createCustomer(
    orgId,
    actingUid,
    {
      name: offer.name,
      phone: offer.phone,
      email: offer.email,
      addresses: offer.address ? [offer.address] : [],
      source: "marketplace-lead",
      notes: offer.description,
    },
    store,
  );
  if ("error" in customer) return customer;
  const job = await createJob(
    orgId,
    actingUid,
    {
      customerId: customer.id,
      leadId: lead.id,
      title: `${offer.trade} — ${offer.city}`,
      serviceType: offer.trade,
      address: offer.address,
      notes: offer.description,
      assignedUid: org.ownerUid,
    },
    store,
  );
  if ("error" in job) return job;

  const claimed: ServiceOffer = {
    ...offer,
    status: "claimed",
    claimedOrgId: orgId,
    claimedAt: new Date().toISOString(),
    jobId: job.id,
    customerId: customer.id,
    leadId: lead.id,
    updatedAt: new Date().toISOString(),
  };
  await store.set(offerKey(offer.id), JSON.stringify(claimed), RECORD_TTL);
  await store.srem(openIndex, offer.id);
  return claimed;
}

export async function quoteServiceOffer(
  orgId: string,
  actingUid: string,
  offerId: string,
  input: { description?: string; amountCents?: number; notes?: string },
  store: KeyValueStore = getStore(),
): Promise<ServiceOffer | DomainError> {
  const offer = await getOffer(offerId, store);
  if (!offer || offer.claimedOrgId !== orgId) return { error: "Claim this job before you quote it." };
  if (!offer.jobId || !offer.customerId) return { error: "That job is missing a customer." };
  const amountCents = typeof input.amountCents === "number" ? Math.round(input.amountCents) : Number(input.amountCents);
  if (!Number.isFinite(amountCents) || amountCents < 50) return { error: "Enter a quote of at least $0.50." };
  const estimate = await createEstimate(
    orgId,
    actingUid,
    {
      customerId: offer.customerId,
      jobId: offer.jobId,
      status: "sent",
      lineItems: [{ description: cleanText(input.description, 160) || offer.description.slice(0, 160), quantity: 1, unitCents: amountCents }],
      notes: cleanText(input.notes, 2000),
    },
    store,
  );
  if ("error" in estimate) return estimate;
  const quoted: ServiceOffer = {
    ...offer,
    status: "quoted",
    estimateId: estimate.id,
    updatedAt: new Date().toISOString(),
  };
  await store.set(offerKey(offer.id), JSON.stringify(quoted), RECORD_TTL);
  return quoted;
}

export async function markOfferPaid(offerId: string, store: KeyValueStore = getStore()): Promise<ServiceOffer | null> {
  const offer = await getOffer(offerId, store);
  if (!offer) return null;
  const paid: ServiceOffer = { ...offer, status: "paid", updatedAt: new Date().toISOString() };
  await store.set(offerKey(offer.id), JSON.stringify(paid), RECORD_TTL);
  return paid;
}

export async function toPublicOfferView(offer: ServiceOffer, store: KeyValueStore = getStore()): Promise<PublicOfferView> {
  const org = offer.claimedOrgId ? await getOrg(offer.claimedOrgId, store) : null;
  const estimate = offer.estimateId && offer.claimedOrgId ? await getEstimate(offer.claimedOrgId, offer.estimateId, store) : null;
  return {
    id: offer.id,
    trade: offer.trade,
    city: offer.city,
    status: offer.status,
    description: offer.description,
    expiresAt: offer.expiresAt,
    pingedCount: offer.pingedOrgIds.length,
    claimedByName: org?.name ?? null,
    estimate: estimate ? { totalCents: estimate.totalCents, notes: estimate.notes, lineItems: estimate.lineItems } : null,
    paid: offer.status === "paid",
  };
}
