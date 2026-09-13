import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { getUser, upsertUser } from "@/lib/auth/session";
import { listAuditEvents } from "@/lib/audit/log";
import { acceptInvite, changeMemberRole, createOrg, deleteOrg, getOrgForUser, inviteMember, listMembers, listPendingInvites, removeMember, renameOrg, revokeInvite } from "./org";

async function seedOwner(store = createMemoryStore(), email = "owner@example.com") {
  const { user } = await upsertUser(email, "Owner", store);
  const org = await createOrg(user.uid, "Acme Agency", store);
  if ("error" in org) throw new Error(org.error);
  return { store, owner: user, org };
}

describe("org lifecycle", () => {
  it("creates an org, makes the creator owner, and rejects a second org for the same user", async () => {
    const { store, owner, org } = await seedOwner();
    expect(org.name).toBe("Acme Agency");
    const updatedOwner = await getUser(owner.uid, store);
    expect(updatedOwner?.orgId).toBe(org.id);
    expect(updatedOwner?.orgRole).toBe("owner");
    expect(await listMembers(org.id, store)).toEqual([{ uid: owner.uid, email: owner.email, name: owner.name, role: "owner" }]);

    const second = await createOrg(owner.uid, "Second Co", store);
    expect(second).toEqual({ error: "You're already in an org. Leave it before creating a new one." });
  });

  it("rejects an empty name", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("noname@example.com", null, store);
    expect(await createOrg(user.uid, "   ", store)).toEqual({ error: "Give the org a name." });
  });

  it("invites a teammate, lets them accept, and records both in the audit log", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "Teammate@Example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    expect(invited.invite.email).toBe("teammate@example.com");
    expect(await listPendingInvites(org.id, store)).toHaveLength(1);

    const { user: teammate } = await upsertUser("teammate@example.com", "Teammate", store);
    const accepted = await acceptInvite(invited.invite.token, teammate.uid, store);
    if ("error" in accepted) throw new Error(accepted.error);
    expect(accepted.org.id).toBe(org.id);

    const members = await listMembers(org.id, store);
    expect(members).toHaveLength(2);
    expect(members.find((m) => m.uid === teammate.uid)?.role).toBe("member");
    expect(await listPendingInvites(org.id, store)).toEqual([]);

    const events = await listAuditEvents(50, org.id, store);
    expect(events.map((e) => e.action)).toEqual(["org.member_joined", "org.member_invited", "org.created"]);
  });

  it("rejects an invite accepted by a different email than it was sent to", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "target@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: someoneElse } = await upsertUser("someone-else@example.com", null, store);
    expect(await acceptInvite(invited.invite.token, someoneElse.uid, store)).toEqual({
      error: "This invite was sent to a different email address. Sign in with that email to accept it.",
    });
  });

  it("rejects an unknown or expired invite token", async () => {
    const { store, owner } = await seedOwner();
    expect(await acceptInvite("oi_doesnotexist000", owner.uid, store)).toEqual({ error: "Invite not found or expired." });
  });

  it("prevents a non-admin from inviting or removing members", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "member1@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: member1 } = await upsertUser("member1@example.com", null, store);
    await acceptInvite(invited.invite.token, member1.uid, store);

    expect(await inviteMember(org.id, member1.uid, "someone@example.com", "member", store)).toEqual({ error: "You don't have permission to do that." });

    const { user: member2 } = await upsertUser("member2@example.com", null, store);
    expect(await removeMember(org.id, member1.uid, member2.uid, store)).toEqual({ error: "Member not found." });
  });

  it("lets a member leave without owner/admin permission, but blocks removing the owner", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "leaver@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: leaver } = await upsertUser("leaver@example.com", null, store);
    await acceptInvite(invited.invite.token, leaver.uid, store);

    expect(await removeMember(org.id, owner.uid, owner.uid, store)).toEqual({ error: "The org owner can't be removed. Delete the org instead." });
    expect(await removeMember(org.id, leaver.uid, leaver.uid, store)).toEqual({ ok: true });
    const afterLeave = await getUser(leaver.uid, store);
    expect(afterLeave?.orgId).toBeUndefined();
    expect(afterLeave?.orgRole).toBeUndefined();
    expect(await listMembers(org.id, store)).toHaveLength(1);
  });

  it("only the owner can promote/demote a member's role, and the owner's own role can't change", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "admin1@example.com", "admin", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: admin1 } = await upsertUser("admin1@example.com", null, store);
    await acceptInvite(invited.invite.token, admin1.uid, store);
    expect((await getUser(admin1.uid, store))?.orgRole).toBe("admin");

    expect(await changeMemberRole(org.id, owner.uid, owner.uid, "member", store)).toEqual({ error: "The org owner's role can't be changed." });
    expect(await changeMemberRole(org.id, admin1.uid, owner.uid, "member", store)).toEqual({ error: "You don't have permission to do that." });

    expect(await changeMemberRole(org.id, owner.uid, admin1.uid, "member", store)).toEqual({ ok: true });
    expect((await getUser(admin1.uid, store))?.orgRole).toBe("member");
  });

  it("only the owner can remove another admin", async () => {
    const { store, owner, org } = await seedOwner();
    const inviteA = await inviteMember(org.id, owner.uid, "admin-a@example.com", "admin", store);
    const inviteB = await inviteMember(org.id, owner.uid, "admin-b@example.com", "admin", store);
    if ("error" in inviteA) throw new Error(inviteA.error);
    if ("error" in inviteB) throw new Error(inviteB.error);
    const { user: adminA } = await upsertUser("admin-a@example.com", null, store);
    const { user: adminB } = await upsertUser("admin-b@example.com", null, store);
    await acceptInvite(inviteA.invite.token, adminA.uid, store);
    await acceptInvite(inviteB.invite.token, adminB.uid, store);

    expect(await removeMember(org.id, adminA.uid, adminB.uid, store)).toEqual({ error: "Only the owner can remove another admin." });
    expect(await removeMember(org.id, owner.uid, adminB.uid, store)).toEqual({ ok: true });
  });

  it("caps membership at ORG_LIMITS.membersPerOrg", async () => {
    const store = createMemoryStore();
    const { user: owner } = await upsertUser("owner-cap@example.com", null, store);
    const org = await createOrg(owner.uid, "Cap Co", store);
    if ("error" in org) throw new Error(org.error);
    for (let i = 0; i < 24; i++) {
      const invited = await inviteMember(org.id, owner.uid, `member${i}@example.com`, "member", store);
      if ("error" in invited) throw new Error(invited.error);
      const { user } = await upsertUser(`member${i}@example.com`, null, store);
      const accepted = await acceptInvite(invited.invite.token, user.uid, store);
      if ("error" in accepted) throw new Error(accepted.error);
    }
    expect(await listMembers(org.id, store)).toHaveLength(25);
    expect(await inviteMember(org.id, owner.uid, "overflow@example.com", "member", store)).toEqual({ error: "This org already has 25 members, the current limit." });
  });

  it("revokes an invite", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "revoke-me@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    expect(await revokeInvite(org.id, owner.uid, invited.invite.token, store)).toEqual({ ok: true });
    expect(await listPendingInvites(org.id, store)).toEqual([]);
    expect(await acceptInvite(invited.invite.token, owner.uid, store)).toEqual({ error: "Invite not found or expired." });
  });

  it("renames an org (owner/admin only)", async () => {
    const { store, owner, org } = await seedOwner();
    const renamed = await renameOrg(org.id, owner.uid, "New Name", store);
    if ("error" in renamed) throw new Error(renamed.error);
    expect(renamed.name).toBe("New Name");
  });

  it("deletes an org and clears every member's orgId (owner only)", async () => {
    const { store, owner, org } = await seedOwner();
    const invited = await inviteMember(org.id, owner.uid, "member@example.com", "member", store);
    if ("error" in invited) throw new Error(invited.error);
    const { user: member } = await upsertUser("member@example.com", null, store);
    await acceptInvite(invited.invite.token, member.uid, store);

    expect(await deleteOrg(org.id, member.uid, store)).toEqual({ error: "You don't have permission to do that." });
    expect(await deleteOrg(org.id, owner.uid, store)).toEqual({ ok: true });
    expect(await getOrgForUser(owner.uid, store)).toBeNull();
    expect(await getOrgForUser(member.uid, store)).toBeNull();
    expect(await listMembers(org.id, store)).toEqual([]);
  });
});
