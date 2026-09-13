import { describe, expect, it } from "vitest";
import { defaultStorefront } from "@/lib/service-business/storefront";
import { listingCanReceivePings, type PublicListing } from "./listing";

function listing(overrides: Partial<PublicListing>): PublicListing {
  return {
    slug: "test-crew",
    name: "Test Crew",
    orgId: "org_1",
    leadTier: "network",
    trades: ["plumbing"],
    cities: ["raleigh"],
    phone: "",
    address: "",
    licensed: false,
    insured: false,
    bonded: false,
    websiteUrl: null,
    gbpUrl: null,
    placeholder: false,
    storefront: defaultStorefront({ published: true, acceptingOffers: true }),
    proof: { completedJobs: 0, reviews: [] },
    nextSlot: null,
    startingPrice: null,
    ...overrides,
  };
}

describe("listingCanReceivePings", () => {
  it("counts only published Network or Run seats", () => {
    expect(listingCanReceivePings(listing({ leadTier: "network" }))).toBe(true);
    expect(listingCanReceivePings(listing({ leadTier: "managed" }))).toBe(true);
    expect(listingCanReceivePings(listing({ leadTier: "listing" }))).toBe(false);
    expect(listingCanReceivePings(listing({ leadTier: "os" }))).toBe(false);
    expect(listingCanReceivePings(listing({ orgId: null, leadTier: null }))).toBe(false);
  });
});
