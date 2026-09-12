"use client";

import { createStore, del, get, keys, set } from "idb-keyval";
import type { IdeMessage } from "@/lib/ai/tools/code-editor";
import type { Review, Workspace } from "@/lib/ide/workspace";

/**
 * Workspaces live in IndexedDB under the user's browser. Nothing is sent to
 * Launchabl servers except what the AI panel needs for a request (the file
 * list and the files the model reads) and what the user commits to GitHub.
 */

const store = typeof indexedDB === "undefined" ? null : createStore("launchabl-ide", "workspaces");

export type WorkspaceSummary = Pick<Workspace, "id" | "name" | "source" | "updatedAt"> & { files: number };

export async function saveWorkspace(ws: Workspace): Promise<void> {
  if (!store) return;
  await set(ws.id, ws, store);
}

export async function loadWorkspace(id: string): Promise<Workspace | null> {
  if (!store) return null;
  return (await get<Workspace>(id, store)) ?? null;
}

export async function deleteWorkspace(id: string): Promise<void> {
  if (!store) return;
  await Promise.all([del(id, store), deleteChat(id)]);
}

/* ── assistant chat per workspace ─────────────────────── */

// idb-keyval gives one object store per database, so chats get their own.
const chatStore = typeof indexedDB === "undefined" ? null : createStore("launchabl-ide-chats", "chats");

export type StoredChat = { messages: IdeMessage[]; reviews: Record<string, Review>; updatedAt: string };

export async function saveChat(workspaceId: string, chat: Omit<StoredChat, "updatedAt">): Promise<void> {
  if (!chatStore) return;
  if (chat.messages.length === 0) {
    await del(workspaceId, chatStore);
    return;
  }
  await set(workspaceId, { ...chat, updatedAt: new Date().toISOString() } satisfies StoredChat, chatStore);
}

export async function loadChat(workspaceId: string): Promise<StoredChat | null> {
  if (!chatStore) return null;
  return (await get<StoredChat>(workspaceId, chatStore)) ?? null;
}

export async function deleteChat(workspaceId: string): Promise<void> {
  if (!chatStore) return;
  await del(workspaceId, chatStore);
}

export async function listWorkspaces(): Promise<WorkspaceSummary[]> {
  if (!store) return [];
  const ids = (await keys<string>(store)).filter((k) => typeof k === "string");
  const all = await Promise.all(ids.map((id) => get<Workspace>(id, store)));
  return all
    .filter((ws): ws is Workspace => Boolean(ws))
    .map((ws) => ({ id: ws.id, name: ws.name, source: ws.source, updatedAt: ws.updatedAt, files: Object.keys(ws.files).length }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/* ── small settings (BYOK, GitHub token) in localStorage ── */

const SETTINGS_KEY = "launchabl-ide-settings";

export type IdeProvider = "launchabl" | "gateway" | "openai" | "anthropic";

export type IdeSettings = {
  provider: IdeProvider;
  /** The user's own key for `provider`; never sent anywhere except our route, which forwards it to the provider. */
  apiKey: string;
  /** Model id for BYOK providers, e.g. gpt-5.4 or claude-sonnet-4.6. Empty = provider default. */
  model: string;
  githubToken: string;
  autosave: boolean;
  wordWrap: boolean;
};

export const DEFAULT_SETTINGS: IdeSettings = { provider: "launchabl", apiKey: "", model: "", githubToken: "", autosave: true, wordWrap: false };

export function loadSettings(): IdeSettings {
  if (typeof localStorage === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<IdeSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: IdeSettings): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ── open tabs per workspace, so a reload lands where you were ── */

export type TabState = { tabs: string[]; active: string | null };

const tabsKey = (workspaceId: string) => `launchabl-ide-tabs:${workspaceId}`;

export function loadTabState(workspaceId: string): TabState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(tabsKey(workspaceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TabState>;
    const tabs = Array.isArray(parsed.tabs) ? parsed.tabs.filter((t): t is string => typeof t === "string") : [];
    return { tabs, active: typeof parsed.active === "string" ? parsed.active : null };
  } catch {
    return null;
  }
}

export function saveTabState(workspaceId: string, state: TabState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(tabsKey(workspaceId), JSON.stringify(state));
  } catch {
    /* private mode or full */
  }
}
