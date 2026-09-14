/**
 * Run reply queue (§39).
 * We draft Nextdoor / Facebook / GBP replies. The operator copies and
 * sends them from their own phone. We do not scrape those networks and
 * we do not post as the operator. Source is always a human-pasted ask.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit/log";
import { getOrg } from "@/lib/orgs/org";
import { sendOrgAlert, type AlertSendResult } from "./alerts";
import { getServiceBusinessProfile, listServiceBusinessProfiles } from "./profile";
import { newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";
import {
  bookingShortPath,
  channelLabel,
  ensureBookingLink,
  isReplyChannelId,
  REPLY_LIMITS,
  type ReplyDraft,
} from "./reply-queue-shared";

export {
  bookingShortPath,
  channelLabel,
  draftIncludesBookingLink,
  ensureBookingLink,
  isReplyChannelId,
  isReplyStatus,
  REPLY_CHANNELS,
  REPLY_LIMITS,
  REPLY_QUEUE_RULE,
  REPLY_STATUSES,
  replyClipboardText,
  suggestReplyBody,
} from "./reply-queue-shared";
export type { ReplyChannelId, ReplyDraft, ReplyStatus } from "./reply-queue-shared";

export type ReplyDraftInput = {
  channel?: unknown;
  neighborhoodAsk?: unknown;
  body?: unknown;
};

function cleanMultiline(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim().slice(0, max) : "";
}

const draftKey = (id: string) => `reply:${id}`;
const orgIndexKey = (orgId: string) => `reply:${orgId}:all`;
const readyIndexKey = () => "reply:ready";

export type ReplyQueueDeps = {
  alert?: (orgId: string, payload: { title: string; body: string }, store: KeyValueStore) => Promise<AlertSendResult>;
};

async function loadDraft(id: string, store: KeyValueStore): Promise<ReplyDraft | null> {
  const raw = await store.get(draftKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReplyDraft;
  } catch {
    return null;
  }
}

async function requireRunProfile(orgId: string, store: KeyValueStore) {
  const profile = await getServiceBusinessProfile(orgId, store);
  if (!profile) return { error: "This org hasn't set up a service-business profile yet." };
  if (profile.engagementType !== "managed") {
    return { error: "Reply queue is a Run feature. We only draft neighborhood replies for accounts we sit on." };
  }
  return profile;
}

export async function createReplyDraft(
  orgId: string,
  actingUid: string,
  input: ReplyDraftInput,
  store: KeyValueStore = getStore(),
  deps: ReplyQueueDeps = {},
): Promise<ReplyDraft | DomainError> {
  const denied = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (denied) return denied;
  return writeReplyDraft(orgId, actingUid, input, store, deps);
}

/** Platform admin drafts for a Run org they are not a member of. */
export async function createReplyDraftAsAdmin(
  orgId: string,
  actorLabel: string,
  input: ReplyDraftInput,
  store: KeyValueStore = getStore(),
  deps: ReplyQueueDeps = {},
): Promise<ReplyDraft | DomainError> {
  return writeReplyDraft(orgId, actorLabel, input, store, deps);
}

async function writeReplyDraft(
  orgId: string,
  createdBy: string,
  input: ReplyDraftInput,
  store: KeyValueStore,
  deps: ReplyQueueDeps,
): Promise<ReplyDraft | DomainError> {
  const profile = await requireRunProfile(orgId, store);
  if ("error" in profile) return profile;

  const channel = input.channel;
  if (!isReplyChannelId(channel)) return { error: "Pick Nextdoor, Facebook, or Google Business Profile." };
  const neighborhoodAsk = cleanMultiline(input.neighborhoodAsk, REPLY_LIMITS.askMax);
  if (neighborhoodAsk.length < 8) return { error: "Paste the neighborhood ask we are answering. We do not scrape it." };
  const rawBody = cleanMultiline(input.body, REPLY_LIMITS.bodyMax);
  if (rawBody.length < 8) return { error: "Write the reply they will send." };

  const org = await getOrg(orgId, store);
  const body = ensureBookingLink(rawBody, profile.slug);
  const now = new Date().toISOString();
  const draft: ReplyDraft = {
    id: newId("reply"),
    orgId,
    orgName: org?.name ?? profile.slug,
    slug: profile.slug,
    channel,
    neighborhoodAsk,
    body,
    bookingPath: bookingShortPath(profile.slug),
    status: "ready",
    source: "pasted",
    createdBy,
    createdAt: now,
    updatedAt: now,
    copiedAt: null,
    sentAt: null,
  };

  await store.set(draftKey(draft.id), JSON.stringify(draft), RECORD_TTL);
  await store.sadd(orgIndexKey(orgId), draft.id, RECORD_TTL);
  await store.sadd(readyIndexKey(), draft.id, RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: createdBy, action: "reply.created", target: draft.id, detail: { channel } }, store);

  const alert = deps.alert ?? ((id, payload, kv) => sendOrgAlert(id, payload, kv));
  await alert(
    orgId,
    {
      title: `Reply ready — ${channelLabel(channel)}`,
      body: `A ${channelLabel(channel)} reply is waiting in the OS. Copy it and send it from your phone. We did not post it for you.\n\n${draft.bookingPath}`,
    },
    store,
  ).catch(() => undefined);

  return draft;
}

export type ReplyQueueSnapshot = {
  run: boolean;
  canDraft: boolean;
  bookingPath: string | null;
  drafts: ReplyDraft[];
};

export async function listReplyQueue(orgId: string, actingUid: string, store: KeyValueStore = getStore()): Promise<ReplyQueueSnapshot | DomainError> {
  const denied = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (denied) return denied;
  const profile = await getServiceBusinessProfile(orgId, store);
  const actor = await getUser(actingUid, store);
  const canDraft = profile?.engagementType === "managed" && (actor?.orgRole === "owner" || actor?.orgRole === "admin");
  if (!profile || profile.engagementType !== "managed") {
    return { run: false, canDraft: false, bookingPath: profile ? bookingShortPath(profile.slug) : null, drafts: [] };
  }
  const drafts = await listDraftsByIndex(orgIndexKey(orgId), store);
  return { run: true, canDraft, bookingPath: bookingShortPath(profile.slug), drafts };
}

export async function listReadyReplyDrafts(store: KeyValueStore = getStore()): Promise<ReplyDraft[]> {
  return listDraftsByIndex(readyIndexKey(), store);
}

export async function listManagedReplyOrgs(store: KeyValueStore = getStore()): Promise<{ orgId: string; orgName: string; slug: string; trades: string[] }[]> {
  const profiles = await listServiceBusinessProfiles(store);
  const out: { orgId: string; orgName: string; slug: string; trades: string[] }[] = [];
  for (const profile of profiles) {
    if (profile.engagementType !== "managed") continue;
    const org = await getOrg(profile.orgId, store);
    out.push({ orgId: profile.orgId, orgName: org?.name ?? profile.slug, slug: profile.slug, trades: [...profile.trades] });
  }
  return out;
}

async function listDraftsByIndex(indexKey: string, store: KeyValueStore): Promise<ReplyDraft[]> {
  const ids = await store.smembers(indexKey);
  const drafts: ReplyDraft[] = [];
  for (const id of ids) {
    const draft = await loadDraft(id, store);
    if (!draft) {
      await store.srem(indexKey, id);
      continue;
    }
    drafts.push(draft);
  }
  return drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type ReplyAction = "copied" | "sent" | "skipped";

export async function actOnReplyDraft(
  orgId: string,
  actingUid: string,
  draftId: string,
  action: ReplyAction,
  store: KeyValueStore = getStore(),
): Promise<ReplyDraft | DomainError> {
  const denied = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (denied) return denied;
  const draft = await loadDraft(draftId, store);
  if (!draft || draft.orgId !== orgId) return { error: "That reply is not on this book." };
  if (draft.status === "sent" || draft.status === "skipped") return { error: "That reply is already closed." };

  const now = new Date().toISOString();
  const next: ReplyDraft = {
    ...draft,
    updatedAt: now,
    status: action === "copied" ? "copied" : action,
    copiedAt: action === "copied" || action === "sent" ? (draft.copiedAt ?? now) : draft.copiedAt,
    sentAt: action === "sent" ? now : draft.sentAt,
  };

  await store.set(draftKey(next.id), JSON.stringify(next), RECORD_TTL);
  if (next.status === "sent" || next.status === "skipped") {
    await store.srem(readyIndexKey(), next.id);
  }
  await logAuditEvent({ orgId, actorUid: actingUid, action: `reply.${action}`, target: next.id }, store);
  return next;
}
