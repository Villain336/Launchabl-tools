/**
 * Per-tool conversation history in localStorage.
 *
 * No accounts yet, so this is the persistence layer: the last 20
 * conversations per tool, restored on return, switchable from the chat
 * header. Sized to stay well inside browser quotas; oldest conversations
 * are pruned first.
 */

import { useSyncExternalStore } from "react";
import type { ToolChatMessage } from "@/lib/ai/chat-message";

export type StoredConversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ToolChatMessage[];
};

export type HistoryIndex = {
  current: string | null;
  conversations: StoredConversation[];
};

const MAX_CONVERSATIONS = 20;
const MAX_BYTES = 1_500_000;
const EMPTY: HistoryIndex = { current: null, conversations: [] };

const storageKey = (slug: string) => `launchabl.chat.v1.${slug}`;

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: HistoryIndex }>();

function notify() {
  for (const listener of listeners) listener();
}

function available(): boolean {
  try {
    return typeof window !== "undefined" && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

export function readHistory(slug: string): HistoryIndex {
  if (!available()) return EMPTY;
  const raw = window.localStorage.getItem(storageKey(slug));
  const cached = cache.get(slug);
  if (cached && cached.raw === raw) return cached.value;
  let value: HistoryIndex = EMPTY;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<HistoryIndex>;
      value = {
        current: typeof parsed.current === "string" ? parsed.current : null,
        conversations: Array.isArray(parsed.conversations) ? parsed.conversations.filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages)) : [],
      };
    } catch {
      value = EMPTY;
    }
  }
  cache.set(slug, { raw, value });
  return value;
}

function write(slug: string, index: HistoryIndex) {
  if (!available()) return;
  let conversations = [...index.conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
  let serialized = JSON.stringify({ current: index.current, conversations });
  while (serialized.length > MAX_BYTES && conversations.length > 1) {
    conversations = conversations.slice(0, -1);
    serialized = JSON.stringify({ current: index.current, conversations });
  }
  try {
    window.localStorage.setItem(storageKey(slug), serialized);
  } catch {
    // Quota exceeded or storage disabled: drop the oldest half and retry once.
    try {
      conversations = conversations.slice(0, Math.max(1, Math.floor(conversations.length / 2)));
      window.localStorage.setItem(storageKey(slug), JSON.stringify({ current: index.current, conversations }));
    } catch {
      return;
    }
  }
  notify();
}

export function newConversationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function conversationTitle(messages: ToolChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  const text = first?.parts.find((p) => p.type === "text")?.text.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return "New conversation";
  return text.length > 64 ? `${text.slice(0, 63).trimEnd()}…` : text;
}

/** Upsert a conversation. Returns false when nothing changed (so callers can avoid churn). */
export function saveConversation(slug: string, id: string, messages: ToolChatMessage[]): boolean {
  const index = readHistory(slug);
  const existing = index.conversations.find((c) => c.id === id);
  const serializedMessages = JSON.stringify(messages);
  if (existing && JSON.stringify(existing.messages) === serializedMessages && index.current === id) return false;
  const now = Date.now();
  const next: StoredConversation = {
    id,
    title: conversationTitle(messages),
    createdAt: existing?.createdAt ?? now,
    updatedAt: existing && JSON.stringify(existing.messages) === serializedMessages ? existing.updatedAt : now,
    messages,
  };
  write(slug, { current: id, conversations: [next, ...index.conversations.filter((c) => c.id !== id)] });
  return true;
}

export function setCurrentConversation(slug: string, id: string | null) {
  const index = readHistory(slug);
  if (index.current === id) return;
  write(slug, { ...index, current: id });
}

export function deleteConversation(slug: string, id: string) {
  const index = readHistory(slug);
  write(slug, { current: index.current === id ? null : index.current, conversations: index.conversations.filter((c) => c.id !== id) });
}

export function clearHistory(slug: string) {
  if (!available()) return;
  window.localStorage.removeItem(storageKey(slug));
  cache.delete(slug);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key.startsWith("launchabl.chat.")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerSnapshot = () => EMPTY;

/** Live view of a tool's history; empty during SSR and hydration. */
export function useChatHistory(slug: string): HistoryIndex {
  return useSyncExternalStore(subscribe, () => readHistory(slug), getServerSnapshot);
}

export function relativeTime(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
