/**
 * Founding-crew referral (§40).
 * A seated Network/Run crew that brings the next claiming crew on the
 * same city×trade — while the board is still short of three — gets one
 * month of Network credited. Not a scrape. Not an ad buy.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getCity, isNcCitySlug } from "@/lib/marketplace/cities";
import { getListing, listDirectoryFiltered, listingCanReceivePings } from "@/lib/marketplace/listing";
import { hasNetworkSeat } from "@/lib/marketplace/pricing";
import { AGENCY_MODEL, FOUNDING_REFERRAL } from "./agency-model";
import { getServiceBusinessProfile, isTrade } from "./profile";
import { cleanText, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export type FoundingReferral = {
  id: string;
  city: string;
  trade: string;
  referrerOrgId: string;
  referredOrgId: string;
  referredSlug: string;
  creditMonths: number;
  creditUsd: number;
  createdAt: string;
};

const referralKey = (id: string) => `foundingref:${id}`;
const orgIndexKey = (orgId: string) => `foundingref:${orgId}:all`;
const pairKey = (city: string, trade: string, referredOrgId: string) => `foundingref:pair:${city}:${trade}:${referredOrgId}`;

export function referralCreditMonths(referrals: readonly FoundingReferral[], asOf = new Date()): number {
  return referrals.reduce((sum, row) => {
    const start = Date.parse(row.createdAt);
    if (!Number.isFinite(start)) return sum;
    const expires = start + row.creditMonths * 30 * 24 * 60 * 60 * 1000;
    return expires > asOf.getTime() ? sum + row.creditMonths : sum;
  }, 0);
}

async function loadReferral(id: string, store: KeyValueStore): Promise<FoundingReferral | null> {
  const raw = await store.get(referralKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FoundingReferral;
  } catch {
    return null;
  }
}

export async function listFoundingReferrals(orgId: string, store: KeyValueStore = getStore()): Promise<FoundingReferral[]> {
  const ids = await store.smembers(orgIndexKey(orgId));
  const rows: FoundingReferral[] = [];
  for (const id of ids) {
    const row = await loadReferral(id, store);
    if (row) rows.push(row);
    else await store.srem(orgIndexKey(orgId), id);
  }
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordFoundingReferral(
  referrerOrgId: string,
  actingUid: string,
  input: { referredSlug?: unknown; city?: unknown; trade?: unknown },
  store: KeyValueStore = getStore(),
): Promise<FoundingReferral | DomainError> {
  const denied = await requireOrgRole(referrerOrgId, actingUid, ["owner", "admin"], store);
  if (denied) return denied;

  const city = cleanText(input.city, 40).toLowerCase();
  const trade = cleanText(input.trade, 40);
  const referredSlug = cleanText(input.referredSlug, 80);
  if (!isNcCitySlug(city)) return { error: "Pick a North Carolina city we actually cover." };
  if (!isTrade(trade)) return { error: "Pick a trade on the directory." };
  if (referredSlug.length < 2) return { error: "Which crew did you bring? Use their listing slug." };

  const referrer = await getServiceBusinessProfile(referrerOrgId, store);
  if (!referrer || !hasNetworkSeat(referrer.leadTier)) {
    return { error: "You need a Network or Run seat before you can refer a founding crew." };
  }

  const listing = await getListing(referredSlug, store);
  if (!listing?.orgId) return { error: "That crew is not a live listing we can credit." };
  if (listing.orgId === referrerOrgId) return { error: "You cannot refer your own crew." };
  if (!listingCanReceivePings(listing)) {
    return { error: "That crew cannot claim yet — they need a Network or Run seat and a published page." };
  }

  const referred = await getServiceBusinessProfile(listing.orgId, store);
  if (!referred || !hasNetworkSeat(referred.leadTier)) {
    return { error: "That crew cannot claim yet — they need a Network or Run seat." };
  }

  const seated = (await listDirectoryFiltered({ city, trade }, store)).filter(listingCanReceivePings);
  const referrerSeated = seated.some((row) => row.orgId === referrerOrgId);
  const referredSeated = seated.some((row) => row.orgId === listing.orgId);
  if (!referrerSeated) return { error: `You are not a claiming crew for this ${getCity(city)?.name ?? city} board.` };
  if (!referredSeated) return { error: "That crew is not sitting on this city and trade." };

  const others = seated.filter((row) => row.orgId !== listing.orgId).length;
  if (others < 1) return { error: "There was no seated crew to bring them." };
  if (others >= AGENCY_MODEL.foundingCrewsToOpenBoard) {
    return { error: "This board is already open. Founding credit is for bringing crew two or three." };
  }

  const claimed = await store.setNx(pairKey(city, trade, listing.orgId), referrerOrgId, RECORD_TTL);
  if (!claimed) return { error: "That crew was already credited on this board." };

  const row: FoundingReferral = {
    id: newId("fref"),
    city,
    trade,
    referrerOrgId,
    referredOrgId: listing.orgId,
    referredSlug: listing.slug,
    creditMonths: FOUNDING_REFERRAL.creditMonths,
    creditUsd: FOUNDING_REFERRAL.creditUsd,
    createdAt: new Date().toISOString(),
  };
  await store.set(referralKey(row.id), JSON.stringify(row), RECORD_TTL);
  await store.sadd(orgIndexKey(referrerOrgId), row.id, RECORD_TTL);
  await logAuditEvent(
    { orgId: referrerOrgId, actorUid: actingUid, action: "referral.created", target: listing.orgId, detail: { city, trade, referredSlug: listing.slug } },
    store,
  );
  return row;
}
