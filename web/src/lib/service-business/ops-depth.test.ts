import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg, inviteMember, acceptInvite } from "@/lib/orgs/org";
import { saveAlertSettings } from "./alerts";
import { runDueAutomations, upsertAutomationRule } from "./automation";
import { createCustomer } from "./customer";
import { readOsDashboard } from "./dashboard";
import { adjustInventory, createInventoryItem } from "./inventory";
import { createJob, jobWindow } from "./job";
import { submitLead } from "./lead";
import { createServiceBusinessProfile } from "./profile";
import { createWarranty, listWarrantiesDueSoon } from "./warranty";

async function seedContractor(store = createMemoryStore()) {
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
  const customer = await createCustomer(org.id, user.uid, { name: "Jordan Lee", email: "jordan@example.com" }, store);
  if ("error" in customer) throw new Error(customer.error);
  return { store, owner: user, org, profile, customer };
}

describe("smart job scheduling", () => {
  it("blocks an overlapping window for the same crew member, including drive time", async () => {
    const { store, owner, org, customer } = await seedContractor();
    const first = await createJob(
      org.id,
      owner.uid,
      {
        customerId: customer.id,
        title: "Water heater AM",
        assignedUid: owner.uid,
        scheduledFor: "2026-09-14T15:00:00.000Z",
        durationMinutes: 60,
        driveMinutes: 30,
      },
      store,
    );
    if ("error" in first) throw new Error(first.error);
    const window = jobWindow(first);
    expect(window?.start.toISOString()).toBe("2026-09-14T14:30:00.000Z");
    expect(window?.end.toISOString()).toBe("2026-09-14T16:00:00.000Z");

    expect(
      await createJob(
        org.id,
        owner.uid,
        {
          customerId: customer.id,
          title: "Leak next door",
          assignedUid: owner.uid,
          scheduledFor: "2026-09-14T15:45:00.000Z",
          durationMinutes: 60,
          driveMinutes: 0,
        },
        store,
      ),
    ).toEqual({ error: "That crew member is already booked (Water heater AM)." });

    const invited = await inviteMember(org.id, owner.uid, "tech@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: tech } = await upsertUser("tech@example.com", "Tech", store);
    await acceptInvite(invited.invite.token, tech.uid, store);

    const otherCrew = await createJob(
      org.id,
      owner.uid,
      {
        customerId: customer.id,
        title: "Leak next door",
        assignedUid: tech.uid,
        scheduledFor: "2026-09-14T15:45:00.000Z",
        durationMinutes: 60,
      },
      store,
    );
    if ("error" in otherCrew) throw new Error(otherCrew.error);
    expect(otherCrew.assignedUid).toBe(tech.uid);

    const forced = await createJob(
      org.id,
      owner.uid,
      {
        customerId: customer.id,
        title: "Squeeze-in",
        assignedUid: owner.uid,
        scheduledFor: "2026-09-14T15:45:00.000Z",
        durationMinutes: 30,
        allowOverlap: true,
      },
      store,
    );
    if ("error" in forced) throw new Error(forced.error);
    expect(forced.title).toBe("Squeeze-in");
  });
});

describe("warranty + inventory", () => {
  it("flags coverage that is inside the reminder window and rejects using more stock than is on hand", async () => {
    const { store, owner, org, customer } = await seedContractor();
    const warranty = await createWarranty(
      org.id,
      owner.uid,
      { customerId: customer.id, coverage: "50-gallon heater", startOn: "2026-03-01", endOn: "2026-09-20", reminderDaysBefore: 14 },
      store,
    );
    if ("error" in warranty) throw new Error(warranty.error);
    expect(await listWarrantiesDueSoon(org.id, store, "2026-09-13")).toHaveLength(1);
    expect(await listWarrantiesDueSoon(org.id, store, "2026-08-01")).toHaveLength(0);

    const item = await createInventoryItem(
      org.id,
      owner.uid,
      { name: "50-gallon heater", sku: "WH-50", quantityOnHand: 2, reorderThreshold: 1, costCents: 45000 },
      store,
    );
    if ("error" in item) throw new Error(item.error);
    const used = await adjustInventory(org.id, owner.uid, { itemId: item.id, delta: -1 }, store);
    if ("error" in used) throw new Error(used.error);
    expect(used.quantityOnHand).toBe(1);
    expect(await adjustInventory(org.id, owner.uid, { itemId: item.id, delta: -2 }, store)).toEqual({
      error: "Only 1 on hand — can't use 2.",
    });

    const dash = await readOsDashboard(org.id, store, new Date("2026-09-13T12:00:00.000Z"));
    expect(dash.warrantiesDue).toBe(1);
    expect(dash.lowStock).toBe(1);
  });
});

describe("OS automations", () => {
  it("fires a lead follow-up once after the delay, and does not fire without a deliverable channel", async () => {
    const { store, owner, org, profile } = await seedContractor();
    const sent: string[] = [];
    const lead = await submitLead(
      {
        orgId: org.id,
        leadTier: profile.leadTier,
        listingSlug: profile.slug,
        trade: "plumbing",
        city: "Raleigh",
        name: "Sam Rivera",
        phone: "555-0100",
        description: "Sump pump",
      },
      store,
    );
    if ("error" in lead) throw new Error(lead.error);

    const rule = await upsertAutomationRule(org.id, owner.uid, { kind: "lead_followup", delayHours: 24, enabled: true }, store);
    if ("error" in rule) throw new Error(rule.error);
    const silenced = await saveAlertSettings(org.id, owner.uid, { emailEnabled: false, telegramEnabled: false }, store);
    if ("error" in silenced) throw new Error(silenced.error);

    const tooSoon = new Date(Date.parse(lead.createdAt) + 2 * 3_600_000);
    expect(await runDueAutomations(tooSoon, store, { email: async (to, title) => { sent.push(`${to}:${title}`); return true; } })).toEqual([]);

    const later = new Date(Date.parse(lead.createdAt) + 25 * 3_600_000);
    expect(await runDueAutomations(later, store, { email: async () => true })).toEqual([]);
    const enabled = await saveAlertSettings(org.id, owner.uid, { emailEnabled: true }, store);
    if ("error" in enabled) throw new Error(enabled.error);
    const first = await runDueAutomations(later, store, { email: async (to, title) => { sent.push(`${to}:${title}`); return true; } });
    expect(first).toHaveLength(1);
    expect(first[0]?.kind).toBe("lead_followup");
    expect(sent[0]).toContain("Follow up with Sam Rivera");

    const second = await runDueAutomations(later, store, { email: async () => true });
    expect(second).toHaveLength(0);
  });

  it("reminds about a job that starts inside the delay window", async () => {
    const { store, owner, org, customer } = await seedContractor();
    const job = await createJob(
      org.id,
      owner.uid,
      { customerId: customer.id, title: "Drain snake", scheduledFor: "2026-09-14T16:00:00.000Z", durationMinutes: 45, driveMinutes: 15 },
      store,
    );
    if ("error" in job) throw new Error(job.error);
    const rule = await upsertAutomationRule(org.id, owner.uid, { kind: "job_reminder", delayHours: 24, enabled: true }, store);
    if ("error" in rule) throw new Error(rule.error);
    const titles: string[] = [];
    const runs = await runDueAutomations(new Date("2026-09-14T10:00:00.000Z"), store, {
      email: async (_to, title) => {
        titles.push(title);
        return true;
      },
    });
    expect(runs.map((run) => run.kind)).toEqual(["job_reminder"]);
    expect(titles[0]).toContain("Drain snake");
  });
});
