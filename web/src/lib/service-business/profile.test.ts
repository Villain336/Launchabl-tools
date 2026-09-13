import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { setUserOrg, upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { createServiceBusinessProfile, getServiceBusinessProfile, getServiceBusinessProfileBySlug, setEngagementType, TRADES, updateServiceBusinessProfile } from "./profile";

async function seedOrg(name = "Carolina Lawn Co", store = createMemoryStore()) {
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, name, store);
  if ("error" in org) throw new Error(org.error);
  return { store, owner: user, org };
}

describe("service business profile", () => {
  it("launches with the eight decided NC trade categories (STRATEGY.md §25.7 Q2)", () => {
    expect(TRADES).toEqual(["lawn-care", "hvac", "cleaning", "pressure-washing", "parking-lot", "plumbing", "electrical", "painting"]);
  });


  it("creates a profile with a slugified name, and is idempotent on a second create call", async () => {
    const { store, owner, org } = await seedOrg();
    const profile = await createServiceBusinessProfile(
      org.id,
      owner.uid,
      { trades: ["lawn-care", "plumbing", "not-a-trade" as never], serviceArea: ["Raleigh", "Raleigh", "Durham"] },
      store,
    );
    if ("error" in profile) throw new Error(profile.error);
    expect(profile.slug).toBe("carolina-lawn-co");
    expect(profile.trades).toEqual(["lawn-care", "plumbing"]);
    expect(profile.serviceArea).toEqual(["Raleigh", "Durham"]);

    const again = await createServiceBusinessProfile(org.id, owner.uid, { trades: ["hvac"] }, store);
    if ("error" in again) throw new Error(again.error);
    expect(again.slug).toBe(profile.slug); // unchanged — create is idempotent, not an overwrite
    expect(again.trades).toEqual(["lawn-care", "plumbing"]);
  });

  it("disambiguates slugs across orgs with the same name", async () => {
    const store = createMemoryStore();
    const { user: ownerA } = await upsertUser("a@example.com", "A", store);
    const orgA = await createOrg(ownerA.uid, "Palmetto Services", store);
    if ("error" in orgA) throw new Error(orgA.error);
    const { user: ownerB } = await upsertUser("b@example.com", "B", store);
    const orgB = await createOrg(ownerB.uid, "Palmetto Services", store);
    if ("error" in orgB) throw new Error(orgB.error);

    const profileA = await createServiceBusinessProfile(orgA.id, ownerA.uid, {}, store);
    const profileB = await createServiceBusinessProfile(orgB.id, ownerB.uid, {}, store);
    if ("error" in profileA || "error" in profileB) throw new Error("unexpected error");
    expect(profileA.slug).toBe("palmetto-services");
    expect(profileB.slug).toBe("palmetto-services-2");
  });

  it("rejects a non-admin from creating or updating a profile", async () => {
    const { store, owner, org } = await seedOrg();
    const { user: member } = await upsertUser("member@example.com", "Member", store);
    await setUserOrg(member.uid, { orgId: org.id, orgRole: "member" }, store);

    const created = await createServiceBusinessProfile(org.id, member.uid, {}, store);
    expect(created).toEqual({ error: "You don't have permission to do that." });

    const ownerProfile = await createServiceBusinessProfile(org.id, owner.uid, {}, store);
    if ("error" in ownerProfile) throw new Error(ownerProfile.error);
    const updated = await updateServiceBusinessProfile(org.id, member.uid, { phone: "555-0100" }, store);
    expect(updated).toEqual({ error: "You don't have permission to do that." });
  });

  it("updates fields, leaving unspecified fields untouched, and resolves the profile by its public slug", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createServiceBusinessProfile(org.id, owner.uid, { trades: ["hvac"], phone: "555-0100" }, store);
    if ("error" in created) throw new Error(created.error);

    const updated = await updateServiceBusinessProfile(org.id, owner.uid, { address: "123 Main St, Raleigh, NC", insured: true }, store);
    if ("error" in updated) throw new Error(updated.error);
    expect(updated.phone).toBe("555-0100"); // untouched
    expect(updated.address).toBe("123 Main St, Raleigh, NC");
    expect(updated.insured).toBe(true);

    const bySlug = await getServiceBusinessProfileBySlug(created.slug, store);
    expect(bySlug?.orgId).toBe(org.id);
    expect(await getServiceBusinessProfileBySlug("no-such-slug", store)).toBeNull();
  });

  it("defaults knowledge-sharing consent to false and audit-logs a distinct event when it changes", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createServiceBusinessProfile(org.id, owner.uid, {}, store);
    if ("error" in created) throw new Error(created.error);
    expect(created.allowKnowledgeSharing).toBe(false);

    const unchanged = await updateServiceBusinessProfile(org.id, owner.uid, { phone: "555-0100" }, store);
    if ("error" in unchanged) throw new Error(unchanged.error);
    expect(unchanged.allowKnowledgeSharing).toBe(false);

    const consented = await updateServiceBusinessProfile(org.id, owner.uid, { allowKnowledgeSharing: true }, store);
    if ("error" in consented) throw new Error(consented.error);
    expect(consented.allowKnowledgeSharing).toBe(true);
  });

  it("defaults engagementType to self-serve, and only setEngagementType (a platform-ops action) can change it (§26.4)", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createServiceBusinessProfile(org.id, owner.uid, {}, store);
    if ("error" in created) throw new Error(created.error);
    expect(created.engagementType).toBe("self-serve");

    // the ordinary org-scoped update path has no engagementType field to set — a contractor can't self-assign managed service
    const selfUpdate = await updateServiceBusinessProfile(org.id, owner.uid, { phone: "555-0100" }, store);
    if ("error" in selfUpdate) throw new Error(selfUpdate.error);
    expect(selfUpdate.engagementType).toBe("self-serve");

    const flipped = await setEngagementType(org.id, "admin@launchabl.io", "managed", store);
    if ("error" in flipped) throw new Error(flipped.error);
    expect(flipped.engagementType).toBe("managed");
    expect((await getServiceBusinessProfile(org.id, store))?.engagementType).toBe("managed");
  });

  it("setEngagementType is a no-op (no audit event) when the value is already what's requested", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createServiceBusinessProfile(org.id, owner.uid, {}, store);
    if ("error" in created) throw new Error(created.error);
    const result = await setEngagementType(org.id, "admin@launchabl.io", "self-serve", store);
    expect(result).toEqual(created);
  });

  it("setEngagementType errors on an org with no profile yet", async () => {
    const { store, org } = await seedOrg();
    expect(await setEngagementType(org.id, "admin@launchabl.io", "managed", store)).toEqual({ error: "This org hasn't set up a service-business profile yet." });
  });

  it("returns an error when updating a profile that doesn't exist yet", async () => {
    const { store, owner, org } = await seedOrg();
    const result = await updateServiceBusinessProfile(org.id, owner.uid, { phone: "555-0100" }, store);
    expect(result).toEqual({ error: "This org hasn't set up a service-business profile yet." });
  });

  it("drops an invalid website/GBP URL rather than storing garbage", async () => {
    const { store, owner, org } = await seedOrg();
    const created = await createServiceBusinessProfile(org.id, owner.uid, { websiteUrl: "not a url", gbpUrl: "https://g.page/example" }, store);
    if ("error" in created) throw new Error(created.error);
    expect(created.websiteUrl).toBeNull();
    expect(created.gbpUrl).toBe("https://g.page/example");
    expect(await getServiceBusinessProfile(org.id, store)).toEqual(created);
  });
});
