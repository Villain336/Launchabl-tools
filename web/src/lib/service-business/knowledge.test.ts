import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { upsertUser } from "@/lib/auth/session";
import { createOrg } from "@/lib/orgs/org";
import { createServiceBusinessProfile, updateServiceBusinessProfile } from "./profile";
import { getKnowledgeNote, listKnowledgeNotes, listSharedKnowledgeNotes, saveKnowledgeNote } from "./knowledge";

async function seedOrg(store = createMemoryStore()) {
  const { user } = await upsertUser("owner@example.com", "Owner", store);
  const org = await createOrg(user.uid, "Carolina Lawn Co", store);
  if ("error" in org) throw new Error(org.error);
  return { store, owner: user, org };
}

describe("knowledge notes", () => {
  it("always saves a note privately to the org, regardless of consent", async () => {
    const { store, owner, org } = await seedOrg();
    const note = await saveKnowledgeNote(org.id, owner.uid, { title: "Customer prefers morning visits", markdown: "# Notes\nAlways schedule before 10am." }, store);
    if ("error" in note) throw new Error(note.error);
    expect(note.sharedToPool).toBe(false); // no profile / no consent yet
    expect(await getKnowledgeNote(org.id, note.id, store)).toEqual(note);
    expect(await listKnowledgeNotes(org.id, store)).toEqual([note]);
  });

  it("rejects a note with no title or no content", async () => {
    const { store, owner, org } = await seedOrg();
    expect(await saveKnowledgeNote(org.id, owner.uid, { title: "  ", markdown: "content" }, store)).toEqual({ error: "Give the note a title." });
    expect(await saveKnowledgeNote(org.id, owner.uid, { title: "Title", markdown: "   " }, store)).toEqual({ error: "The note needs some content." });
  });

  it("only indexes a note into the shared pool when allowKnowledgeSharing is true at save time", async () => {
    const { store, owner, org } = await seedOrg();
    const profile = await createServiceBusinessProfile(org.id, owner.uid, {}, store);
    if ("error" in profile) throw new Error(profile.error);

    const beforeConsent = await saveKnowledgeNote(org.id, owner.uid, { title: "Before consent", markdown: "not shared" }, store);
    if ("error" in beforeConsent) throw new Error(beforeConsent.error);
    expect(beforeConsent.sharedToPool).toBe(false);
    expect(await listSharedKnowledgeNotes(store)).toEqual([]);

    const consented = await updateServiceBusinessProfile(org.id, owner.uid, { allowKnowledgeSharing: true }, store);
    if ("error" in consented) throw new Error(consented.error);

    const afterConsent = await saveKnowledgeNote(org.id, owner.uid, { title: "After consent", markdown: "shared" }, store);
    if ("error" in afterConsent) throw new Error(afterConsent.error);
    expect(afterConsent.sharedToPool).toBe(true);

    const shared = await listSharedKnowledgeNotes(store);
    expect(shared.map((n) => n.id)).toEqual([afterConsent.id]); // the earlier, pre-consent note stays private forever
  });

  it("stops sharing new notes immediately after consent is revoked, without touching already-shared notes", async () => {
    const { store, owner, org } = await seedOrg();
    const profile = await createServiceBusinessProfile(org.id, owner.uid, { allowKnowledgeSharing: true }, store);
    if ("error" in profile) throw new Error(profile.error);
    const shared = await saveKnowledgeNote(org.id, owner.uid, { title: "Shared", markdown: "x" }, store);
    if ("error" in shared) throw new Error(shared.error);

    const revoked = await updateServiceBusinessProfile(org.id, owner.uid, { allowKnowledgeSharing: false }, store);
    if ("error" in revoked) throw new Error(revoked.error);
    const afterRevoke = await saveKnowledgeNote(org.id, owner.uid, { title: "After revoke", markdown: "y" }, store);
    if ("error" in afterRevoke) throw new Error(afterRevoke.error);
    expect(afterRevoke.sharedToPool).toBe(false);

    const pool = await listSharedKnowledgeNotes(store);
    expect(pool.map((n) => n.id)).toEqual([shared.id]);
  });

  it("scopes notes per org", async () => {
    const store = createMemoryStore();
    const { user: ownerA } = await upsertUser("a@example.com", "A", store);
    const orgA = await createOrg(ownerA.uid, "Org A", store);
    const { user: ownerB } = await upsertUser("b@example.com", "B", store);
    const orgB = await createOrg(ownerB.uid, "Org B", store);
    if ("error" in orgA || "error" in orgB) throw new Error("unexpected error");

    await saveKnowledgeNote(orgA.id, ownerA.uid, { title: "A's note", markdown: "x" }, store);
    await saveKnowledgeNote(orgB.id, ownerB.uid, { title: "B's note", markdown: "y" }, store);
    const listA = await listKnowledgeNotes(orgA.id, store);
    expect(listA).toHaveLength(1);
    expect(listA[0].title).toBe("A's note");
  });

  it("rejects a user with no membership in the org", async () => {
    const { store, org } = await seedOrg();
    const { user: outsider } = await upsertUser("outsider@example.com", "Outsider", store);
    expect(await saveKnowledgeNote(org.id, outsider.uid, { title: "Nope", markdown: "x" }, store)).toEqual({ error: "You don't have permission to do that." });
  });
});
