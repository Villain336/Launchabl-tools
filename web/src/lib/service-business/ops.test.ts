import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { publicTools, toolCatalog } from "@/lib/marketplace/catalog";
import { listDirectory, listDirectoryFiltered, updateFoundingListing } from "@/lib/marketplace/listing";
import { LEAD_TIERS } from "@/lib/marketplace/pricing";
import { createCustomer } from "./customer";
import { readOsDashboard } from "./dashboard";
import { createEstimate, estimateTotal } from "./estimate";
import { createJob, createJobFromLead } from "./job";
import { readAllotment, submitLead, updateLead } from "./lead";
import { recordPayment } from "./payment";
import { createServiceBusinessProfile } from "./profile";
import { saveOrgStorefront } from "./storefront";

async function seedContractor(store = createMemoryStore()) {
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, "Piedmont Plumbing", store);
  if ("error" in org) throw new Error(org.error);
  const profile = await createServiceBusinessProfile(
    org.id,
    user.uid,
    { trades: ["plumbing"], serviceArea: ["Raleigh", "Durham"], leadTier: "listing" },
    store,
  );
  if ("error" in profile) throw new Error(profile.error);
  return { store, owner: user, org, profile };
}

describe("marketplace catalog disposition", () => {
  it("keeps the SEO tools public and retires the agreed cut list", () => {
    expect(toolCatalog("website-audit-report")).toBe("public");
    expect(toolCatalog("local-seo-optimizer")).toBe("public");
    expect(toolCatalog("markdown-file-generator")).toBe("os");
    expect(toolCatalog("brand-creator")).toBe("os");
    expect(toolCatalog("watermark-remover")).toBe("retired");
    expect(toolCatalog("file-converter")).toBe("retired");
    expect(publicTools().every((tool) => toolCatalog(tool.slug) === "public")).toBe(true);
    expect(publicTools().some((tool) => tool.slug === "watermark-remover")).toBe(false);
  });
});

describe("directory + storefront", () => {
  it("starts with the three founding listings, including real Atlas Lot Care", async () => {
    const store = createMemoryStore();
    const listings = await listDirectory(store);
    expect(listings.map((l) => l.slug)).toEqual(["atlas-lot-care", "founding-hvac-raleigh", "founding-lawn-greensboro"]);
    const atlas = listings[0];
    expect(atlas.name).toBe("Atlas Lot Care");
    expect(atlas.placeholder).toBe(false);
    expect(atlas.trades).toContain("parking-lot");
    expect(atlas.cities).toContain("greensboro");
  });

  it("filters by city and trade, and lets a founding listing be renamed in-platform", async () => {
    const store = createMemoryStore();
    const lawn = await listDirectoryFiltered({ city: "greensboro", trade: "lawn-care" }, store);
    expect(lawn).toHaveLength(1);
    expect(lawn[0].placeholder).toBe(true);

    const renamed = await updateFoundingListing("founding-lawn-greensboro", "founder", { name: "Triad Cuts", tagline: "Weekly mows in Greensboro." }, store);
    if ("error" in renamed) throw new Error(renamed.error);
    expect(renamed.name).toBe("Triad Cuts");
    expect(renamed.placeholder).toBe(false);
    expect(renamed.storefront.tagline).toBe("Weekly mows in Greensboro.");
  });

  it("publishes an org-backed listing only after the storefront is published with a city and trade", async () => {
    const { store, owner, org } = await seedContractor();
    expect(await listDirectoryFiltered({ city: "raleigh", trade: "plumbing" }, store)).toEqual([]);

    const saved = await saveOrgStorefront(org.id, owner.uid, { published: true, tagline: "Same-day leaks." }, store);
    if ("error" in saved) throw new Error(saved.error);
    const listed = await listDirectoryFiltered({ city: "raleigh", trade: "plumbing" }, store);
    expect(listed).toHaveLength(1);
    expect(listed[0].name).toBe("Piedmont Plumbing");
    expect(listed[0].storefront.tagline).toBe("Same-day leaks.");
  });
});

describe("lead allotment + job/estimate/payment loop", () => {
  it("holds extra leads once the monthly allotment is used, without changing lead quality", async () => {
    const { store, org, profile } = await seedContractor();
    expect(LEAD_TIERS.listing.monthlyLeads).toBe(5);
    const leads = [];
    for (let i = 0; i < 6; i += 1) {
      const lead = await submitLead(
        {
          orgId: org.id,
          leadTier: profile.leadTier,
          listingSlug: profile.slug,
          trade: "plumbing",
          city: "Raleigh",
          name: `Homeowner ${i}`,
          phone: "555-0100",
          description: "Leaking water heater",
        },
        store,
      );
      if ("error" in lead) throw new Error(lead.error);
      leads.push(lead);
    }
    expect(leads.filter((l) => !l.held)).toHaveLength(5);
    expect(leads[5]?.held).toBe(true);
    expect(leads[5]?.status).toBe("held");
    expect(leads[5]?.description).toBe("Leaking water heater");
    const allotment = await readAllotment(org.id, "listing", store);
    expect(allotment.used).toBe(5);
    expect(allotment.remaining).toBe(0);
  });

  it("turns a lead into a customer + job, then an estimate and a recorded payment", async () => {
    const { store, owner, org, profile } = await seedContractor();
    const lead = await submitLead(
      {
        orgId: org.id,
        leadTier: profile.leadTier,
        listingSlug: profile.slug,
        trade: "plumbing",
        city: "Raleigh",
        name: "Jordan Lee",
        email: "jordan@example.com",
        description: "Replace a water heater",
      },
      store,
    );
    if ("error" in lead) throw new Error(lead.error);

    const job = await createJobFromLead(org.id, owner.uid, lead.id, store);
    if ("error" in job) throw new Error(job.error);
    expect(job.customerId).toBeTruthy();
    expect(job.title).toContain("plumbing");

    const estimate = await createEstimate(
      org.id,
      owner.uid,
      {
        customerId: job.customerId,
        jobId: job.id,
        lineItems: [
          { description: "50-gallon heater", quantity: 1, unitCents: 120000 },
          { description: "Labor", quantity: 3, unitCents: 15000 },
        ],
      },
      store,
    );
    if ("error" in estimate) throw new Error(estimate.error);
    expect(estimate.totalCents).toBe(165000);
    expect(estimateTotal(estimate.lineItems)).toBe(165000);

    const payment = await recordPayment(org.id, owner.uid, { jobId: job.id, amountCents: 165000, method: "card" }, store);
    if ("error" in payment) throw new Error(payment.error);
    expect(payment.status).toBe("paid");

    await updateLead(org.id, owner.uid, lead.id, { status: "won" }, store);
    const dash = await readOsDashboard(org.id, store);
    expect(dash.customers).toBe(1);
    expect(dash.jobs.total).toBe(1);
    expect(dash.estimates.total).toBe(1);
    expect(dash.revenueCents).toBe(165000);
    expect(dash.leads.won).toBe(1);
    expect(dash.allotment?.used).toBe(1);
  });

  it("rejects a job without a customer on this org", async () => {
    const { store, owner, org } = await seedContractor();
    const { user: other } = await upsertUser("other@example.com", "Other", store);
    const otherOrg = await createOrg(other.uid, "Other Co", store);
    if ("error" in otherOrg) throw new Error(otherOrg.error);
    const customer = await createCustomer(otherOrg.id, other.uid, { name: "Not yours" }, store);
    if ("error" in customer) throw new Error(customer.error);
    expect(await createJob(org.id, owner.uid, { customerId: customer.id, title: "Nope" }, store)).toEqual({
      error: "Customer not found.",
    });
  });
});
