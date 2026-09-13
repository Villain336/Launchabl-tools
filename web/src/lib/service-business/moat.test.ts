import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { getListing, listDirectory } from "@/lib/marketplace/listing";
import { createCustomer } from "./customer";
import { createJob, getJobByReviewToken } from "./job";
import { getLead, submitLead } from "./lead";
import { createServiceBusinessProfile } from "./profile";
import { submitJobReview } from "./review";
import { saveOrgStorefront } from "./storefront";

async function seedPublishedContractor(store = createMemoryStore()) {
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, "Piedmont Plumbing", store);
  if ("error" in org) throw new Error(org.error);
  const profile = await createServiceBusinessProfile(
    org.id,
    user.uid,
    { trades: ["plumbing"], serviceArea: ["Raleigh"], leadTier: "listing" },
    store,
  );
  if ("error" in profile) throw new Error(profile.error);
  const storefront = await saveOrgStorefront(org.id, user.uid, { published: true, tagline: "Same-day leaks." }, store);
  if ("error" in storefront) throw new Error(storefront.error);
  const customer = await createCustomer(org.id, user.uid, { name: "Jordan Lee", email: "jordan@example.com" }, store);
  if ("error" in customer) throw new Error(customer.error);
  return { store, owner: user, org, profile, customer };
}

describe("exclusive leads (§27)", () => {
  it("marks every quote request exclusive and keeps that flag on read", async () => {
    const { store, org, profile } = await seedPublishedContractor();
    const lead = await submitLead(
      {
        orgId: org.id,
        leadTier: profile.leadTier,
        listingSlug: profile.slug,
        trade: "plumbing",
        city: "Raleigh",
        name: "Jordan Lee",
        phone: "555-0100",
        description: "Leaking water heater",
      },
      store,
    );
    if ("error" in lead) throw new Error(lead.error);
    expect(lead.exclusive).toBe(true);

    const rawKey = `lead:${lead.id}`;
    const raw = JSON.parse((await store.get(rawKey)) as string) as { exclusive?: boolean };
    expect(raw.exclusive).toBe(true);
    raw.exclusive = false;
    await store.set(rawKey, JSON.stringify(raw));
    expect((await getLead(lead.id, store))?.exclusive).toBe(true);
  });
});

describe("reviews require a completed job (§27)", () => {
  it("rejects a review without a completed-job token", async () => {
    const { store } = await seedPublishedContractor();
    expect(await submitJobReview({ rating: 5, body: "Great." }, store)).toEqual({
      error: "This review link is missing.",
    });
    expect(await submitJobReview({ token: "rvwtok_notreal", rating: 5 }, store)).toEqual({
      error: "That review link is not valid. Reviews only open after the job is completed.",
    });
  });

  it("mints a token only on completed, then attaches one review to public proof", async () => {
    const { store, owner, org, customer, profile } = await seedPublishedContractor();
    const scheduled = await createJob(org.id, owner.uid, { customerId: customer.id, title: "Water heater" }, store);
    if ("error" in scheduled) throw new Error(scheduled.error);
    expect(scheduled.reviewToken).toBeNull();
    expect(await getJobByReviewToken("nope", store)).toBeNull();

    const completed = await createJob(
      org.id,
      owner.uid,
      { customerId: customer.id, title: "Drain clear", status: "completed" },
      store,
    );
    if ("error" in completed) throw new Error(completed.error);
    expect(completed.reviewToken).toBeTruthy();
    const fromToken = await getJobByReviewToken(completed.reviewToken as string, store);
    expect(fromToken?.id).toBe(completed.id);

    const review = await submitJobReview(
      {
        token: completed.reviewToken as string,
        rating: 5,
        body: "Showed up and fixed it.",
        authorName: "Jordan",
      },
      store,
    );
    if ("error" in review) throw new Error(review.error);
    expect(review.jobId).toBe(completed.id);
    expect(review.listingSlug).toBe(profile.slug);

    expect(
      await submitJobReview({ token: completed.reviewToken as string, rating: 4, authorName: "Jordan" }, store),
    ).toEqual({ error: "A review is already on file for this job." });

    const listing = await getListing(profile.slug, store);
    expect(listing?.proof.completedJobs).toBe(1);
    expect(listing?.proof.reviews).toHaveLength(1);
    expect(listing?.proof.reviews[0]?.body).toBe("Showed up and fixed it.");
  });
});

describe("directory rank is verified work, not paid placement (§27)", () => {
  it("sorts a listing with completed jobs above founding listings with none", async () => {
    const { store, owner, org, customer, profile } = await seedPublishedContractor();
    const before = await listDirectory(store);
    expect(before[0]?.slug).toBe("atlas-lot-care");
    expect(before.some((listing) => listing.slug === profile.slug)).toBe(true);
    expect(before.find((listing) => listing.slug === profile.slug)?.proof.completedJobs).toBe(0);

    const job = await createJob(
      org.id,
      owner.uid,
      { customerId: customer.id, title: "Finished leak", status: "completed" },
      store,
    );
    if ("error" in job) throw new Error(job.error);

    const after = await listDirectory(store);
    expect(after[0]?.slug).toBe(profile.slug);
    expect(after[0]?.proof.completedJobs).toBe(1);
    expect(after.map((listing) => listing.slug)).toContain("atlas-lot-care");
  });
});
