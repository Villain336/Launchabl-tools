import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { getListing } from "@/lib/marketplace/listing";
import { bookPublicSlot, bookingHoursFrom, listOpenSlots, wallTimeInZone } from "./booking";
import { createCustomer } from "./customer";
import { createJob, listJobs } from "./job";
import { submitLead } from "./lead";
import { createServiceBusinessProfile } from "./profile";
import { defaultStorefront, saveOrgStorefront } from "./storefront";

const mondayMorning = wallTimeInZone(2026, 9, 14, 7, 0);

describe("open slots", () => {
  it("offers weekday hours and skips a job that already owns the window", () => {
    const hours = bookingHoursFrom(defaultStorefront());
    const open = listOpenSlots(hours, [], mondayMorning, 5);
    expect(open.length).toBeGreaterThan(3);
    expect(open[0]?.start).toBe(wallTimeInZone(2026, 9, 14, 8, 0).toISOString());
    const sunday = listOpenSlots(hours, [], wallTimeInZone(2026, 9, 13, 10, 0), 1);
    expect(sunday.every((slot) => !slot.label.includes("Sun"))).toBe(true);

    const booked = listOpenSlots(
      hours,
      [
        {
          id: "job_1",
          orgId: "org_1",
          customerId: "cust_1",
          leadId: null,
          title: "Taken",
          serviceType: "plumbing",
          status: "scheduled",
          assignedUid: "u1",
          scheduledFor: wallTimeInZone(2026, 9, 14, 8, 0).toISOString(),
          durationMinutes: 60,
          driveMinutes: 20,
          address: "",
          notes: "",
          estimateId: null,
          reviewToken: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      mondayMorning,
      1,
    );
    expect(booked.some((slot) => slot.start === wallTimeInZone(2026, 9, 14, 8, 0).toISOString())).toBe(false);
  });
});

describe("public booking (§28)", () => {
  it("puts a founding-listing booking on a time without inventing a job org", async () => {
    const store = createMemoryStore();
    const listing = await getListing("founding-lawn-greensboro", store);
    if (!listing) throw new Error("missing founding listing");
    const slot = listOpenSlots(bookingHoursFrom(listing.storefront), [], mondayMorning, 3)[0];
    if (!slot) throw new Error("no slot");
    const booked = await bookPublicSlot(
      listing,
      {
        name: "Jordan Lee",
        phone: "555-0100",
        serviceName: "Mowing & edging",
        scheduledFor: slot.start,
        city: "greensboro",
        trade: "lawn-care",
      },
      store,
      mondayMorning,
    );
    if ("error" in booked) throw new Error(booked.error);
    expect(booked.lead.exclusive).toBe(true);
    expect(booked.lead.held).toBe(false);
    expect(booked.lead.scheduledFor).toBe(slot.start);
    expect(booked.jobId).toBeNull();
    expect(await bookPublicSlot(listing, { name: "Other", phone: "555-0101", scheduledFor: slot.start }, store, mondayMorning)).toEqual({
      error: "That time is gone. Pick another.",
    });
  });

  it("writes an org booking onto the job book and never holds a booked Saturday", async () => {
    const store = createMemoryStore();
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
    const saved = await saveOrgStorefront(org.id, user.uid, { published: true, tagline: "Same-day leaks.", services: [{ name: "Drain clear", description: "", priceFrom: "$129" }] }, store);
    if ("error" in saved) throw new Error(saved.error);

    for (let i = 0; i < 5; i += 1) {
      const lead = await submitLead(
        {
          orgId: org.id,
          leadTier: "listing",
          listingSlug: profile.slug,
          trade: "plumbing",
          city: "Raleigh",
          name: `Quote ${i}`,
          phone: "555-0100",
          description: "Need a quote",
        },
        store,
      );
      if ("error" in lead) throw new Error(lead.error);
    }

    const listing = await getListing(profile.slug, store);
    if (!listing) throw new Error("listing missing");
    const slot = listing.nextSlot;
    if (!slot) throw new Error("expected an open slot");
    const booked = await bookPublicSlot(
      listing,
      { name: "Jordan Lee", email: "jordan@example.com", serviceName: "Drain clear", scheduledFor: slot.start, address: "12 Oak St" },
      store,
    );
    if ("error" in booked) throw new Error(booked.error);
    expect(booked.lead.held).toBe(false);
    expect(booked.jobId).toBeTruthy();
    const jobs = await listJobs(org.id, store);
    expect(jobs.some((job) => job.scheduledFor === slot.start && job.customerId)).toBe(true);
  });

  it("refuses a slot the crew already has internally", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("owner@example.com", "Owner", store);
    const org = await createOrg(user.uid, "Piedmont Plumbing", store);
    if ("error" in org) throw new Error(org.error);
    const profile = await createServiceBusinessProfile(org.id, user.uid, { trades: ["plumbing"], serviceArea: ["Raleigh"] }, store);
    if ("error" in profile) throw new Error(profile.error);
    await saveOrgStorefront(org.id, user.uid, { published: true }, store);
    const customer = await createCustomer(org.id, user.uid, { name: "Existing" }, store);
    if ("error" in customer) throw new Error(customer.error);
    const taken = wallTimeInZone(2026, 9, 14, 9, 0).toISOString();
    const job = await createJob(
      org.id,
      user.uid,
      { customerId: customer.id, title: "Already booked", scheduledFor: taken, assignedUid: user.uid, durationMinutes: 60, driveMinutes: 20 },
      store,
    );
    if ("error" in job) throw new Error(job.error);
    const listing = await getListing(profile.slug, store);
    if (!listing) throw new Error("listing missing");
    expect(listing.nextSlot?.start).not.toBe(taken);
    expect(await bookPublicSlot(listing, { name: "Jordan", phone: "555-0100", scheduledFor: taken }, store, mondayMorning)).toEqual({
      error: "That time is gone. Pick another.",
    });
  });
});
