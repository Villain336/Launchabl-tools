/**
 * Server-side conversation history for signed-in users, so the same work
 * shows up on every device. localStorage stays the fast local cache; the
 * client pushes each completed turn here and merges this list on load.
 */

import { getStore, type KeyValueStore } from "@/lib/ai/store";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { stripGeneratedPixels } from "@/lib/chat/pixels";

export type ConversationRecord = {
  id: string;
  uid: string;
  slug: string;
  projectId: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ToolChatMessage[];
};

export const CONVERSATION_TTL_SECONDS = 180 * 24 * 60 * 60;
export const MAX_CONVERSATIONS_PER_TOOL = 15;
export const MAX_CONVERSATION_BYTES = 300_000;

export const isConversationId = (id: string) => /^[A-Za-z0-9_-]{8,64}$/.test(id);

const recordKey = (id: string) => `conv:${id}`;
const indexKey = (uid: string, slug: string) => `user:${uid}:convs:${slug}`;

/** Drop attachment bytes and generated pixels until the record fits; the chips and text stay. */
export function shrinkMessages(messages: ToolChatMessage[], maxBytes = MAX_CONVERSATION_BYTES): ToolChatMessage[] {
  let out = messages.map((m) => ({ ...m, parts: [...m.parts] }));
  const size = () => JSON.stringify(out).length;
  if (size() <= maxBytes) return out;
  out = out.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type === "file" && part.url) return { ...part, url: "" };
      if (part.type.startsWith("tool-") && "output" in part && part.output && typeof part.output === "object") {
        return { ...part, output: stripGeneratedPixels(part.output as Record<string, unknown>) };
      }
      return part;
    }),
  }));
  while (size() > maxBytes && out.length > 2) out = out.slice(2);
  return out;
}

export async function saveConversationRecord(
  input: Omit<ConversationRecord, "createdAt" | "updatedAt"> & Partial<Pick<ConversationRecord, "createdAt" | "updatedAt">>,
  store: KeyValueStore = getStore(),
): Promise<ConversationRecord> {
  const now = Date.now();
  const record: ConversationRecord = {
    ...input,
    messages: shrinkMessages(input.messages),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
  await store.set(recordKey(record.id), JSON.stringify(record), CONVERSATION_TTL_SECONDS);
  await store.sadd(indexKey(record.uid, record.slug), record.id, CONVERSATION_TTL_SECONDS);
  await pruneConversations(record.uid, record.slug, store);
  return record;
}

export async function loadConversationRecord(id: string, uid: string, store: KeyValueStore = getStore()): Promise<ConversationRecord | null> {
  if (!isConversationId(id)) return null;
  const raw = await store.get(recordKey(id));
  if (!raw) return null;
  try {
    const record = JSON.parse(raw) as ConversationRecord;
    return record.uid === uid && Array.isArray(record.messages) ? record : null;
  } catch {
    return null;
  }
}

export async function listConversationRecords(uid: string, slug: string, store: KeyValueStore = getStore()): Promise<ConversationRecord[]> {
  const ids = await store.smembers(indexKey(uid, slug));
  const out: ConversationRecord[] = [];
  for (const id of ids) {
    const record = await loadConversationRecord(id, uid, store);
    if (record) out.push(record);
    else await store.srem(indexKey(uid, slug), id);
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteConversationRecord(id: string, uid: string, store: KeyValueStore = getStore()): Promise<boolean> {
  const record = await loadConversationRecord(id, uid, store);
  if (!record) return false;
  await store.del(recordKey(id));
  await store.srem(indexKey(uid, record.slug), id);
  return true;
}

export async function clearConversationRecords(uid: string, slug: string, store: KeyValueStore = getStore()): Promise<void> {
  const ids = await store.smembers(indexKey(uid, slug));
  for (const id of ids) {
    await store.del(recordKey(id));
    await store.srem(indexKey(uid, slug), id);
  }
}

async function pruneConversations(uid: string, slug: string, store: KeyValueStore): Promise<void> {
  const records = await listConversationRecords(uid, slug, store);
  for (const record of records.slice(MAX_CONVERSATIONS_PER_TOOL)) {
    await store.del(recordKey(record.id));
    await store.srem(indexKey(uid, slug), record.id);
  }
}
