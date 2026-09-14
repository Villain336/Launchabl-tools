import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { referralCreditMonths, recordFoundingReferral } from "./founding-referral";
import { createServiceBusinessProfile } from "./profile";
import { saveOrgStorefront } from "./storefront";

async function seedCrew(store: ReturnType<typeof createMemoryStore>, email: string, name: string, leadTier: "listing" | "network" = "network") {
  const { user } = await upsertUser(email, name, store);
  const org = await createOrg(user.uid, name, store);
  if ("error" in org) throw new Error(org.error);
  const profile = await createServiceBusinessProfile(
    org.id,
    user.uid,
    { trades: ["appliance-repair"], serviceArea: ["Greensboro"], leadTier },
    store,
  );
  if ("error" in profile) throw new Error(profile.error);
  const storefront = await saveOrgStorefront(org.id, user.uid, { published: true, tagline: "Same-day washers." }, store);
  if ("error" in storefront) throw new Error(storefront.error);
  return { owner: user, org, profile };
}

describe("founding-crew referral (§40)", () => {
  it("credits a seated crew that brings founding crew two, and refuses a self-serve seat", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Piedmont Appliance");
    const b = await seedCrew(store, "b@example.com", "Triad Fix");

    const selfServe = await seedCrew(store, "c@example.com", "Clipboard Co", "listing");
    const blocked = await recordFoundingReferral(selfServe.org.id, selfServe.owner.uid, { referredSlug: b.profile.slug, city: "greensboro", trade: "appliance-repair" }, store);
    expect(blocked).toMatchObject({ error: expect.stringMatching(/Network or Run seat/i) });

    const ok = await recordFoundingReferral(a.org.id, a.owner.uid, { referredSlug: b.profile.slug, city: "greensboro", trade: "appliance-repair" }, store);
    if ("error" in ok) throw new Error(ok.error);
    expect(ok.creditUsd).toBe(99);
    expect(ok.referredOrgId).toBe(b.org.id);
    expect(referralCreditMonths([ok], new Date(Date.parse(ok.createdAt) + 10 * 24 * 60 * 60 * 1000))).toBe(1);
    expect(referralCreditMonths([ok], new Date(Date.parse(ok.createdAt) + 40 * 24 * 60 * 60 * 1000))).toBe(0);

    const dup = await recordFoundingReferral(a.org.id, a.owner.uid, { referredSlug: b.profile.slug, city: "greensboro", trade: "appliance-repair" }, store);
    expect(dup).toMatchObject({ error: expect.stringMatching(/already credited/i) });
  });

  it("does not pay founding credit once the board is already open", async () => {
    const store = createMemoryStore();
    const a = await seedCrew(store, "a@example.com", "Crew One");
    await seedCrew(store, "b@example.com", "Crew Two");
    await seedCrew(store, "c@example.com", "Crew Three");
    const d = await seedCrew(store, "d@example.com", "Crew Four");
    const late = await recordFoundingReferral(a.org.id, a.owner.uid, { referredSlug: d.profile.slug, city: "greensboro", trade: "appliance-repair" }, store);
    expect(late).toMatchObject({ error: expect.stringMatching(/already open/i) });
  });
});
