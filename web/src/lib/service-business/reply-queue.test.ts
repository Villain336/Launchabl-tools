import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg, inviteMember, acceptInvite } from "@/lib/orgs/org";
import { createServiceBusinessProfile, setEngagementType } from "./profile";
import {
  actOnReplyDraft,
  bookingShortPath,
  createReplyDraft,
  createReplyDraftAsAdmin,
  draftIncludesBookingLink,
  ensureBookingLink,
  listManagedReplyOrgs,
  listReadyReplyDrafts,
  listReplyQueue,
  replyClipboardText,
  suggestReplyBody,
} from "./reply-queue";

async function seed(run = true) {
  const store = createMemoryStore();
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, "Piedmont Appliance", store);
  if ("error" in org) throw new Error(org.error);
  const profile = await createServiceBusinessProfile(org.id, user.uid, { trades: ["appliance-repair"], serviceArea: ["Greensboro"] }, store);
  if ("error" in profile) throw new Error(profile.error);
  if (run) {
    const managed = await setEngagementType(org.id, "admin", "managed", store);
    if ("error" in managed) throw new Error(managed.error);
  }
  return { store, owner: user, org, profile };
}

describe("Run reply queue (§39)", () => {
  it("appends the /b link and refuses a scrape-shaped create", () => {
    expect(bookingShortPath("piedmont-appliance")).toBe("/b/piedmont-appliance");
    expect(draftIncludesBookingLink("book /b/piedmont-appliance", "piedmont-appliance")).toBe(true);
    expect(ensureBookingLink("We can take the fridge.", "piedmont-appliance")).toContain("/b/piedmont-appliance");
    expect(replyClipboardText({ body: "Hi /b/piedmont-appliance", bookingPath: "/b/piedmont-appliance" }, "https://launchabl.io")).toBe(
      "Hi https://launchabl.io/b/piedmont-appliance",
    );
    expect(suggestReplyBody({ businessName: "Piedmont Appliance", city: "Greensboro", bookingPath: "/b/piedmont-appliance" })).toContain("/b/piedmont-appliance");
  });

  it("is a Run-only queue: self-serve cannot draft, members can mark sent", async () => {
    const listing = await seed(false);
    const blocked = await createReplyDraft(
      listing.org.id,
      listing.owner.uid,
      { channel: "nextdoor", neighborhoodAsk: "Anyone know a fridge person in Greensboro?", body: "We can take this." },
      listing.store,
      { alert: async () => ({ email: "skipped", telegram: "skipped" }) },
    );
    expect(blocked).toMatchObject({ error: expect.stringMatching(/Run feature/i) });

    const empty = await listReplyQueue(listing.org.id, listing.owner.uid, listing.store);
    if ("error" in empty) throw new Error(empty.error);
    expect(empty.run).toBe(false);
    expect(empty.drafts).toEqual([]);

    const { store, owner, org, profile } = await seed(true);
    const alerts: string[] = [];
    const draft = await createReplyDraft(
      org.id,
      owner.uid,
      { channel: "nextdoor", neighborhoodAsk: "Anyone know a fridge person in Greensboro?", body: "We can take the fridge this week." },
      store,
      {
        alert: async (_orgId, payload) => {
          alerts.push(payload.title);
          return { email: "sent", telegram: "skipped" };
        },
      },
    );
    if ("error" in draft) throw new Error(draft.error);
    expect(draft.source).toBe("pasted");
    expect(draft.status).toBe("ready");
    expect(draft.body).toContain(bookingShortPath(profile.slug));
    expect(alerts[0]).toMatch(/Nextdoor/);

    const thin = await createReplyDraft(org.id, owner.uid, { channel: "nextdoor", neighborhoodAsk: "hi", body: "ok" }, store);
    expect(thin).toMatchObject({ error: expect.stringMatching(/paste/i) });

    const { user: member } = await upsertUser("tech@example.com", "Tech", store);
    const invited = await inviteMember(org.id, owner.uid, member.email, "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const accepted = await acceptInvite(invited.invite.token, member.uid, store);
    if ("error" in accepted) throw new Error(accepted.error);

    const memberCreate = await createReplyDraft(
      org.id,
      member.uid,
      { channel: "gbp", neighborhoodAsk: "Who fixes washers near Friendly?", body: "We can." },
      store,
    );
    expect(memberCreate).toMatchObject({ error: expect.stringMatching(/permission/i) });

    const copied = await actOnReplyDraft(org.id, member.uid, draft.id, "copied", store);
    if ("error" in copied) throw new Error(copied.error);
    expect(copied.status).toBe("copied");
    const sent = await actOnReplyDraft(org.id, member.uid, draft.id, "sent", store);
    if ("error" in sent) throw new Error(sent.error);
    expect(sent.status).toBe("sent");
    expect(sent.sentAt).toBeTruthy();

    const closed = await actOnReplyDraft(org.id, member.uid, draft.id, "skipped", store);
    expect(closed).toMatchObject({ error: expect.stringMatching(/closed/i) });

    const ready = await listReadyReplyDrafts(store);
    expect(ready.find((item) => item.id === draft.id)).toBeUndefined();
  });

  it("lets platform admin draft for a Run org they are not in", async () => {
    const { store, org, profile } = await seed(true);
    const drafted = await createReplyDraftAsAdmin(
      org.id,
      "admin",
      { channel: "facebook", neighborhoodAsk: "Need a washer repair in the Triad this week.", body: "We have a van free Thursday." },
      store,
      { alert: async () => ({ email: "skipped", telegram: "skipped" }) },
    );
    if ("error" in drafted) throw new Error(drafted.error);
    expect(drafted.createdBy).toBe("admin");
    expect(drafted.slug).toBe(profile.slug);
    const orgs = await listManagedReplyOrgs(store);
    expect(orgs.map((item) => item.orgId)).toContain(org.id);
    const ready = await listReadyReplyDrafts(store);
    expect(ready).toHaveLength(1);
  });
});
