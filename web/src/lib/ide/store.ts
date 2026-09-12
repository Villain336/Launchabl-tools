"use client";

import { createStore, del, get, keys, set } from "idb-keyval";
import type { Workspace } from "@/lib/ide/workspace";

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
  await del(id, store);
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
