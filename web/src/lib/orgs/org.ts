/**
 * Team/org accounts (Enterprise compliance roadmap, Phase 1 — `docs/STRATEGY.md` §20).
 *
 * A user belongs to at most one org today (`UserRecord.orgId`/`orgRole`,
 * `lib/auth/session.ts`). This is deliberately the minimal primitive: an org
 * record, membership, roles, and email invites — enough to unblock shared
 * team billing/audit-trail requirements now, without pulling in shared
 * Vault/project scoping in the same change. KV-backed, matching every other
 * account primitive in this codebase (§19.3: this is account structure, not
 * an ephemeral counter, but it's also not money — Postgres is reserved for
 * the billing ledger and audit log, per §20 Phase 1).
 */

import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { emailHash, getUser, normalizeEmail, setUserOrg, type OrgRole, type UserRecord } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";

export type OrgRecord = {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
};

export type OrgInvite = {
  token: string;
  orgId: string;
  email: string;
  role: Exclude<OrgRole, "owner">;
  invitedByUid: string;
  createdAt: string;
};

export type OrgMember = Pick<UserRecord, "uid" | "email" | "name"> & { role: OrgRole };

export const ORG_LIMITS = { membersPerOrg: 25, pendingInvitesPerOrg: 25, nameMax: 80 } as const;
const INVITE_TTL_SECONDS = 7 * 24 * 60 * 60;
const ORG_TTL = 3 * 365 * 24 * 60 * 60;

export const isOrgId = (id: string) => /^org_[A-Za-z0-9_-]{12}$/.test(id);
export const isInviteToken = (token: string) => /^oi_[A-Za-z0-9_-]{16}$/.test(token);

const orgKey = (id: string) => `org:${id}`;
const membersKey = (id: string) => `org:${id}:members`;
const invitesKey = (id: string) => `org:${id}:invites`;
const inviteKey = (token: string) => `orginvite:${token}`;

function newId(prefix: string, bytes: number): string {
  return `${prefix}_${Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString("base64url")}`;
}

const cleanName = (value: unknown) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, ORG_LIMITS.nameMax) : "");

export type OrgError = { error: string };

async function getOrgRaw(id: string, store: KeyValueStore): Promise<OrgRecord | null> {
  if (!isOrgId(id)) return null;
  const raw = await store.get(orgKey(id));
  return raw ? (JSON.parse(raw) as OrgRecord) : null;
}

export const getOrg = getOrgRaw;

/** The org a user belongs to, if any — reads the user's `orgId` pointer, not a scan. */
export async function getOrgForUser(uid: string, store: KeyValueStore = getStore()): Promise<OrgRecord | null> {
  const user = await getUser(uid, store);
  if (!user?.orgId) return null;
  return getOrgRaw(user.orgId, store);
}

export async function createOrg(uid: string, name: string, store: KeyValueStore = getStore()): Promise<OrgRecord | OrgError> {
  const user = await getUser(uid, store);
  if (!user) return { error: "Account not found." };
  if (user.orgId) return { error: "You're already in an org. Leave it before creating a new one." };
  const cleaned = cleanName(name);
  if (!cleaned) return { error: "Give the org a name." };
  const now = new Date().toISOString();
  const org: OrgRecord = { id: newId("org", 9), name: cleaned, ownerUid: uid, createdAt: now, updatedAt: now };
  await store.set(orgKey(org.id), JSON.stringify(org), ORG_TTL);
  await store.sadd(membersKey(org.id), uid, ORG_TTL);
  await setUserOrg(uid, { orgId: org.id, orgRole: "owner" }, store);
  await logAuditEvent({ orgId: org.id, actorUid: uid, action: "org.created", target: org.id, detail: { name: cleaned } }, store);
  return org;
}

export async function renameOrg(orgId: string, actingUid: string, name: string, store: KeyValueStore = getStore()): Promise<OrgRecord | OrgError> {
  const org = await requireRole(orgId, actingUid, ["owner", "admin"], store);
  if ("error" in org) return org;
  const cleaned = cleanName(name);
  if (!cleaned) return { error: "Give the org a name." };
  const updated: OrgRecord = { ...org, name: cleaned, updatedAt: new Date().toISOString() };
  await store.set(orgKey(org.id), JSON.stringify(updated), ORG_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "org.renamed", target: orgId, detail: { name: cleaned } }, store);
  return updated;
}

/** Resolve the org and confirm `actingUid` holds one of `allowedRoles` — the shared guard every mutating action starts with. */
async function requireRole(orgId: string, actingUid: string, allowedRoles: OrgRole[], store: KeyValueStore): Promise<OrgRecord | OrgError> {
  const org = await getOrgRaw(orgId, store);
  if (!org) return { error: "Org not found." };
  const actor = await getUser(actingUid, store);
  if (!actor || actor.orgId !== orgId || !actor.orgRole || !allowedRoles.includes(actor.orgRole)) {
    return { error: "You don't have permission to do that." };
  }
  return org;
}

export async function listMembers(orgId: string, store: KeyValueStore = getStore()): Promise<OrgMember[]> {
  const uids = await store.smembers(membersKey(orgId));
  const members: OrgMember[] = [];
  for (const uid of uids) {
    const user = await getUser(uid, store);
    if (user?.orgId === orgId && user.orgRole) members.push({ uid: user.uid, email: user.email, name: user.name, role: user.orgRole });
    else await store.srem(membersKey(orgId), uid); // stale — the member left/was moved outside this path
  }
  return members.sort((a, b) => (a.role === b.role ? a.email.localeCompare(b.email) : a.role === "owner" ? -1 : b.role === "owner" ? 1 : a.role.localeCompare(b.role)));
}

export async function listPendingInvites(orgId: string, store: KeyValueStore = getStore()): Promise<OrgInvite[]> {
  const tokens = await store.smembers(invitesKey(orgId));
  const invites: OrgInvite[] = [];
  for (const token of tokens) {
    const raw = await store.get(inviteKey(token));
    if (raw) invites.push(JSON.parse(raw) as OrgInvite);
    else await store.srem(invitesKey(orgId), token); // expired
  }
  return invites.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function inviteMember(
  orgId: string,
  invitedByUid: string,
  email: string,
  role: "admin" | "member",
  store: KeyValueStore = getStore(),
): Promise<{ invite: OrgInvite } | OrgError> {
  const org = await requireRole(orgId, invitedByUid, ["owner", "admin"], store);
  if ("error" in org) return org;
  const normalized = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalized)) return { error: "Enter a valid email address." };

  const [members, pending] = await Promise.all([listMembers(orgId, store), listPendingInvites(orgId, store)]);
  if (members.length >= ORG_LIMITS.membersPerOrg) return { error: `This org already has ${ORG_LIMITS.membersPerOrg} members, the current limit.` };
  const targetUid = await emailHash(normalized);
  if (members.some((m) => m.uid === targetUid)) return { error: "That person is already a member." };
  if (pending.some((i) => i.email === normalized)) return { error: "That email already has a pending invite." };
  if (pending.length >= ORG_LIMITS.pendingInvitesPerOrg) return { error: `This org already has ${ORG_LIMITS.pendingInvitesPerOrg} pending invites, the current limit.` };

  const invite: OrgInvite = { token: newId("oi", 12), orgId, email: normalized, role, invitedByUid, createdAt: new Date().toISOString() };
  await store.set(inviteKey(invite.token), JSON.stringify(invite), INVITE_TTL_SECONDS);
  await store.sadd(invitesKey(orgId), invite.token, INVITE_TTL_SECONDS);
  await logAuditEvent({ orgId, actorUid: invitedByUid, action: "org.member_invited", target: normalized, detail: { role } }, store);
  return { invite };
}

export async function revokeInvite(orgId: string, actingUid: string, token: string, store: KeyValueStore = getStore()): Promise<{ ok: true } | OrgError> {
  const org = await requireRole(orgId, actingUid, ["owner", "admin"], store);
  if ("error" in org) return org;
  await store.del(inviteKey(token));
  await store.srem(invitesKey(orgId), token);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "org.invite_revoked", target: token }, store);
  return { ok: true };
}

/** The signed-in user (by uid/email) claims a pending invite. */
export async function acceptInvite(token: string, uid: string, store: KeyValueStore = getStore()): Promise<{ org: OrgRecord } | OrgError> {
  if (!isInviteToken(token)) return { error: "Invite not found or expired." };
  const raw = await store.get(inviteKey(token));
  if (!raw) return { error: "Invite not found or expired." };
  const invite = JSON.parse(raw) as OrgInvite;
  const user = await getUser(uid, store);
  if (!user) return { error: "Account not found." };
  if (normalizeEmail(user.email) !== invite.email) return { error: "This invite was sent to a different email address. Sign in with that email to accept it." };
  if (user.orgId) return { error: "You're already in an org. Leave it before accepting a new invite." };
  const org = await getOrgRaw(invite.orgId, store);
  if (!org) return { error: "Org not found." };

  const members = await listMembers(invite.orgId, store);
  if (members.length >= ORG_LIMITS.membersPerOrg) return { error: `This org already has ${ORG_LIMITS.membersPerOrg} members, the current limit.` };

  await store.sadd(membersKey(invite.orgId), uid, ORG_TTL);
  await setUserOrg(uid, { orgId: invite.orgId, orgRole: invite.role }, store);
  await store.del(inviteKey(token));
  await store.srem(invitesKey(invite.orgId), token);
  await logAuditEvent({ orgId: invite.orgId, actorUid: uid, action: "org.member_joined", target: uid, detail: { role: invite.role } }, store);
  return { org };
}

/** Owner-only. Removes every member's org membership and deletes the org record and any pending invites. */
export async function deleteOrg(orgId: string, actingUid: string, store: KeyValueStore = getStore()): Promise<{ ok: true } | OrgError> {
  const org = await requireRole(orgId, actingUid, ["owner"], store);
  if ("error" in org) return org;
  const [members, invites] = await Promise.all([listMembers(orgId, store), listPendingInvites(orgId, store)]);
  await Promise.all(members.map((m) => setUserOrg(m.uid, { orgId: null, orgRole: null }, store)));
  await Promise.all(invites.map((i) => store.del(inviteKey(i.token))));
  await store.del(membersKey(orgId));
  await store.del(invitesKey(orgId));
  await store.del(orgKey(orgId));
  await logAuditEvent({ orgId, actorUid: actingUid, action: "org.deleted", target: orgId }, store);
  return { ok: true };
}

export async function changeMemberRole(orgId: string, actingUid: string, targetUid: string, role: "admin" | "member", store: KeyValueStore = getStore()): Promise<{ ok: true } | OrgError> {
  const org = await requireRole(orgId, actingUid, ["owner"], store);
  if ("error" in org) return org;
  const target = await getUser(targetUid, store);
  if (!target || target.orgId !== orgId) return { error: "Member not found." };
  if (target.orgRole === "owner") return { error: "The org owner's role can't be changed." };
  await setUserOrg(targetUid, { orgId, orgRole: role }, store);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "org.member_role_changed", target: targetUid, detail: { role } }, store);
  return { ok: true };
}

/** Removes a member. A member may always remove themselves (leave); removing someone else requires owner/admin, and only the owner can remove another admin. */
export async function removeMember(orgId: string, actingUid: string, targetUid: string, store: KeyValueStore = getStore()): Promise<{ ok: true } | OrgError> {
  const org = await getOrgRaw(orgId, store);
  if (!org) return { error: "Org not found." };
  const target = await getUser(targetUid, store);
  if (!target || target.orgId !== orgId) return { error: "Member not found." };
  if (target.orgRole === "owner") return { error: "The org owner can't be removed. Delete the org instead." };
  if (actingUid !== targetUid) {
    const actor = await getUser(actingUid, store);
    if (!actor || actor.orgId !== orgId || !actor.orgRole || !["owner", "admin"].includes(actor.orgRole)) return { error: "You don't have permission to do that." };
    if (actor.orgRole === "admin" && target.orgRole === "admin") return { error: "Only the owner can remove another admin." };
  }
  await store.srem(membersKey(orgId), targetUid);
  await setUserOrg(targetUid, { orgId: null, orgRole: null }, store);
  await logAuditEvent({ orgId, actorUid: actingUid, action: actingUid === targetUid ? "org.member_left" : "org.member_removed", target: targetUid }, store);
  return { ok: true };
}
