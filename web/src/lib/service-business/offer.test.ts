import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { createServiceBusinessProfile } from "./profile";
import { saveOrgStorefront } from "./storefront";
import {
  claimServiceOffer,
  createServiceOffer,
  getOffer,
  quoteServiceOffer,
  toPublicOfferView,
} from "./offer";

const silentAlerts = {
  email: async () => true,
  telegram: async () => true,
};

async function seedCrew(
  store: ReturnType<typeof createMemoryStore>,
  email: string,
  name: string,
  leadTier: "listing" | "os" | "network" | "managed" = "network",
) {
  const { user } = await upsertUser(email, name, store);
  const org = await createOrg(user.uid, name, store);
  if ("error" in org) throw new Error(org.error);
  const profile = await createServiceBusinessProfile(
    org.id,
    user.uid,
    { trades: ["plumbing"], serviceArea: ["Raleigh"], leadTier },
    store,
  );
  if ("error" in profile) throw new Error(profile.error);
  const storefront = await saveOrgStorefront(org.id, user.uid, { published: true, tagline: "Same-day leaks." }, store);
  if ("error" in storefront) throw new Error(storefront.error);
  return { owner: user, org };
}

async function openRaleighPlumbing(store: ReturnType<typeof createMemoryStore>, now = new Date()) {
  return createServiceOffer(
    {
      trade: "plumbing",
      city: "raleigh",
      name: "Jordan Lee",
      phone: "555-0100",
      description: "Water heater leaking in the garage",
      address: "12 Oak St",
    },
    store,
    now,
    silentAlerts,
  );
}

describe("dispatch offers (§29)", () => {
  it("pings every published org-backed crew in that city×trade", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    const b = await seedCrew(store, "b@example.com", "Capital Pipe");
    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds.sort()).toEqual([a.org.id, b.org.id].sort());
    expect(offer.status).toBe("open");
    expect(offer.exclusiveAfterClaim).toBe(true);
  });

  it("lets the first claim win and rejects the second", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    const b = await seedCrew(store, "b@example.com", "Capital Pipe");
    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);

    const first = await claimServiceOffer(a.org.id, a.owner.uid, offer.id, store);
    if ("error" in first) throw new Error(first.error);
    expect(first.status).toBe("claimed");
    expect(first.claimedOrgId).toBe(a.org.id);
    expect(first.jobId).toBeTruthy();
    expect(first.leadId).toBeTruthy();

    const second = await claimServiceOffer(b.org.id, b.owner.uid, offer.id, store);
    expect(second).toEqual({ error: "Someone already took that job." });
  });

  it("shows the quote total on the public request view", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    const claimed = await claimServiceOffer(a.org.id, a.owner.uid, offer.id, store);
    if ("error" in claimed) throw new Error(claimed.error);

    const quoted = await quoteServiceOffer(
      a.org.id,
      a.owner.uid,
      offer.id,
      { description: "Replace water heater", amountCents: 125000 },
      store,
    );
    if ("error" in quoted) throw new Error(quoted.error);
    expect(quoted.status).toBe("quoted");

    const view = await toPublicOfferView(quoted, store);
    expect(view.claimedByName).toBe("Piedmont Plumbing");
    expect(view.estimate?.totalCents).toBe(125000);
    expect(view.estimate?.lineItems[0]?.description).toBe("Replace water heater");
    expect(view.paid).toBe(false);
  });

  it("creates the offer even when only founding listings exist — pingedCount is 0", async () => {
    const store = createMemoryStore();
    const offer = await createServiceOffer(
      {
        trade: "lawn-care",
        city: "greensboro",
        name: "Sam Rivera",
        email: "sam@example.com",
        description: "Weekly mow and laundry-strip edging",
      },
      store,
      new Date(),
      silentAlerts,
    );
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds).toEqual([]);
    const view = await toPublicOfferView(offer, store);
    expect(view.pingedCount).toBe(0);
  });

  it("does not let a crew claim an expired request", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const offer = await openRaleighPlumbing(store, threeHoursAgo);
    if ("error" in offer) throw new Error(offer.error);

    const expired = await getOffer(offer.id, store);
    expect(expired?.status).toBe("expired");

    const claimed = await claimServiceOffer(a.org.id, a.owner.uid, offer.id, store);
    expect(claimed).toEqual({ error: "That request expired." });
  });

  it("skips a published crew that turned off acceptingOffers", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    await seedCrew(store, "b@example.com", "Capital Pipe");
    const off = await saveOrgStorefront(a.org.id, a.owner.uid, { acceptingOffers: false }, store);
    if ("error" in off) throw new Error(off.error);

    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds).toHaveLength(1);
    expect(offer.pingedOrgIds[0]).not.toBe(a.org.id);
  });

  it("does not ping a published crew that only has a free listing — Network is the DoorDash seat (§36)", async () => {
    const store = createMemoryStore();
    await seedCrew(store, "free@example.com", "Brochure Plumbing", "listing");

    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds).toEqual([]);
  });

  it("does not ping an OS-desk crew — software without the board", async () => {
    const store = createMemoryStore();
    await seedCrew(store, "desk@example.com", "Desk Plumbing", "os");

    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds).toEqual([]);
  });

  it("rejects a claim from a listing-only crew even if they know the offer id", async () => {
    const store = createMemoryStore();
    const seated = await seedCrew(store, "a@example.com", "Piedmont Plumbing");
    const brochure = await seedCrew(store, "free@example.com", "Brochure Plumbing", "listing");
    const offer = await openRaleighPlumbing(store);
    if ("error" in offer) throw new Error(offer.error);
    expect(offer.pingedOrgIds).toEqual([seated.org.id]);

    const claimed = await claimServiceOffer(brochure.org.id, brochure.owner.uid, offer.id, store);
    expect(claimed).toEqual({ error: "Network membership is required to claim jobs." });
  });
});
