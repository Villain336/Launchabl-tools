/**
 * Knowledge notes — the repurposed `markdown-file-generator` tool's real
 * job under the Service Business OS + Marketplace pivot (`docs/STRATEGY.md`
 * §25.2/§25.7): instead of being a generic public doc-writer, it becomes an
 * agentic tool that captures what happened on a job/customer/interaction as
 * a structured Markdown note, so the account's own AI agents get better at
 * that specific business over time.
 *
 * Two distinct scopes, and they must never be conflated:
 * - **Private, always on.** Every note is saved to the org that created it
 *   regardless of consent — this is the account's own memory, not shared
 *   with anyone.
 * - **Shared learning pool, opt-in only.** A note only becomes eligible for
 *   cross-account reuse (§18.2.2's outcome-data flywheel) when
 *   `ServiceBusinessProfile.allowKnowledgeSharing` is `true` *at the moment
 *   the note is saved* (a later consent change doesn't retroactively
 *   change already-saved notes — simplest correct semantics, and it means
 *   revoking consent immediately stops new sharing without needing a
 *   reconciliation pass).
 *
 * `listSharedKnowledgeNotes` is deliberately not wired into any other
 * tenant's agent context yet — raw notes can contain a specific customer's
 * name, address, or job details, and injecting one contractor's raw note
 * into another contractor's AI conversation would be a real privacy leak,
 * not just noise. Treat it as an internal/ops reader for now (e.g. to spot
 * patterns worth turning into a genuinely anonymized guide), not a
 * drop-in prompt source — building that redaction step is separate,
 * unstarted work.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getUser, type OrgRole } from "@/lib/auth/session";
import { getOrg } from "@/lib/orgs/org";
import { logAuditEvent } from "@/lib/audit/log";
import { getServiceBusinessProfile } from "./profile";

export type KnowledgeNoteSource = "agent" | "manual";

export type KnowledgeNote = {
  id: string;
  orgId: string;
  title: string;
  markdown: string;
  source: KnowledgeNoteSource;
  /** Whether this note was eligible for the shared learning pool at save time — see the module doc for why this doesn't change retroactively. */
  sharedToPool: boolean;
  createdAt: string;
};

export type KnowledgeNoteInput = {
  title?: string;
  markdown?: string;
  source?: KnowledgeNoteSource;
};

export const KNOWLEDGE_LIMITS = { titleMax: 160, markdownMax: 20_000, perOrg: 2000 } as const;
const KNOWLEDGE_TTL = 3 * 365 * 24 * 60 * 60;
const SOURCES: KnowledgeNoteSource[] = ["agent", "manual"];

export type KnowledgeError = { error: string };

const noteKey = (orgId: string, id: string) => `knowledge:${orgId}:${id}`;
const noteIndexKey = (orgId: string) => `knowledge:${orgId}:all`;
const poolIndexKey = () => `knowledge:pool`;

function newId(): string {
  return `know_${Buffer.from(crypto.getRandomValues(new Uint8Array(9))).toString("base64url")}`;
}

const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const cleanMarkdown = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, KNOWLEDGE_LIMITS.markdownMax) : "");
const cleanSource = (value: unknown): KnowledgeNoteSource => (SOURCES.includes(value as KnowledgeNoteSource) ? (value as KnowledgeNoteSource) : "manual");

async function requireOrgRole(orgId: string, actingUid: string, allowedRoles: OrgRole[], store: KeyValueStore): Promise<null | KnowledgeError> {
  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };
  const actor = await getUser(actingUid, store);
  if (!actor || actor.orgId !== orgId || !actor.orgRole || !allowedRoles.includes(actor.orgRole)) {
    return { error: "You don't have permission to do that." };
  }
  return null;
}

export async function getKnowledgeNote(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<KnowledgeNote | null> {
  const raw = await store.get(noteKey(orgId, id));
  return raw ? (JSON.parse(raw) as KnowledgeNote) : null;
}

export async function listKnowledgeNotes(orgId: string, store: KeyValueStore = getStore()): Promise<KnowledgeNote[]> {
  const ids = await store.smembers(noteIndexKey(orgId));
  const notes: KnowledgeNote[] = [];
  for (const id of ids) {
    const note = await getKnowledgeNote(orgId, id, store);
    if (note) notes.push(note);
    else await store.srem(noteIndexKey(orgId), id); // stale
  }
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Saves a knowledge note for an org. Always private to that org; also
 * indexed into the shared learning pool only if the org's
 * `ServiceBusinessProfile.allowKnowledgeSharing` is `true` right now.
 */
export async function saveKnowledgeNote(
  orgId: string,
  actingUid: string,
  input: KnowledgeNoteInput,
  store: KeyValueStore = getStore(),
): Promise<KnowledgeNote | KnowledgeError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;

  const title = cleanText(input.title, KNOWLEDGE_LIMITS.titleMax);
  const markdown = cleanMarkdown(input.markdown);
  if (!title) return { error: "Give the note a title." };
  if (!markdown) return { error: "The note needs some content." };

  const existingIds = await store.smembers(noteIndexKey(orgId));
  if (existingIds.length >= KNOWLEDGE_LIMITS.perOrg) return { error: "This account has reached its knowledge-note limit." };

  const profile = await getServiceBusinessProfile(orgId, store);
  const sharedToPool = Boolean(profile?.allowKnowledgeSharing);

  const note: KnowledgeNote = {
    id: newId(),
    orgId,
    title,
    markdown,
    source: cleanSource(input.source),
    sharedToPool,
    createdAt: new Date().toISOString(),
  };
  await store.set(noteKey(orgId, note.id), JSON.stringify(note), KNOWLEDGE_TTL);
  await store.sadd(noteIndexKey(orgId), note.id, KNOWLEDGE_TTL);
  if (sharedToPool) await store.sadd(poolIndexKey(), `${orgId}:${note.id}`, KNOWLEDGE_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "knowledge.note_saved", target: note.id, detail: { source: note.source, sharedToPool } }, store);
  return note;
}

/**
 * Internal/ops reader over every note any org has opted into sharing —
 * see the module doc's privacy caveat before using this for anything other
 * than manual review.
 */
export async function listSharedKnowledgeNotes(store: KeyValueStore = getStore()): Promise<KnowledgeNote[]> {
  const refs = await store.smembers(poolIndexKey());
  const notes: KnowledgeNote[] = [];
  for (const ref of refs) {
    const [orgId, id] = ref.split(":");
    if (!orgId || !id) continue;
    const note = await getKnowledgeNote(orgId, id, store);
    if (note?.sharedToPool) notes.push(note);
    else await store.srem(poolIndexKey(), ref); // stale or since-revoked
  }
  return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
