/**
 * "Open in editor": a tool artifact (meta tags, JSON-LD, an email, a
 * document, sitemap files) stages its files in localStorage and opens /ide in
 * a new tab. The editor picks them up by id, shows them as a diff review
 * against the open project (or offers a new project), then clears the entry.
 *
 * localStorage is shared across tabs of the same origin, which is exactly the
 * handoff we need; entries are pruned so a forgotten one never lingers.
 */

export type HandoffFile = { path: string; content: string };

export type Handoff = {
  id: string;
  /** Short human title, e.g. "Meta tags for example.com". */
  title: string;
  /** The tool it came from, e.g. "Meta tag generator". */
  from: string;
  files: HandoffFile[];
  createdAt: string;
};

const KEY = "launchabl-ide-handoff";
const MAX_ENTRIES = 8;
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_BYTES = 1_500_000;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

function storage(override?: Storage): Storage | null {
  if (override) return override;
  return typeof localStorage === "undefined" ? null : localStorage;
}

function readAll(store: Storage): Record<string, Handoff> {
  try {
    const raw = store.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Handoff>) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(store: Storage, all: Record<string, Handoff>): void {
  try {
    if (Object.keys(all).length === 0) store.removeItem(KEY);
    else store.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode or full */
  }
}

/** Drop stale entries and keep only the newest few. */
export function pruneHandoffs(all: Record<string, Handoff>, now = Date.now()): Record<string, Handoff> {
  const fresh = Object.values(all).filter((h) => now - new Date(h.createdAt).getTime() < MAX_AGE_MS);
  fresh.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const out: Record<string, Handoff> = {};
  for (const h of fresh.slice(0, MAX_ENTRIES)) out[h.id] = h;
  return out;
}

/** Normalise a suggested path into something the workspace accepts. */
export function handoffPath(path: string): string {
  const clean = path
    .replace(/\\/g, "/")
    .split("/")
    .map((s) => s.trim())
    .filter((s) => s && s !== "." && s !== "..")
    .join("/")
    .replace(/[^\w./ -]+/g, "-");
  return clean || "untitled.txt";
}

export function stageHandoff(input: { title: string; from: string; files: HandoffFile[] }, override?: Storage): string | null {
  const store = storage(override);
  if (!store) return null;
  const files = input.files.map((f) => ({ path: handoffPath(f.path), content: f.content })).filter((f) => f.content.length > 0);
  if (files.length === 0 || files.reduce((n, f) => n + f.content.length, 0) > MAX_BYTES) return null;
  const id = `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const entry: Handoff = { id, title: input.title.trim() || "Files from a Launchabl tool", from: input.from, files, createdAt: new Date().toISOString() };
  const all = pruneHandoffs(readAll(store));
  all[id] = entry;
  writeAll(store, all);
  return id;
}

/** Read without clearing, so a re-render (or React strict mode) can't lose it. */
export function peekHandoff(id: string | null | undefined, override?: Storage): Handoff | null {
  const store = storage(override);
  if (!store || !id) return null;
  const all = pruneHandoffs(readAll(store));
  return all[id] ?? null;
}

export function clearHandoff(id: string, override?: Storage): void {
  const store = storage(override);
  if (!store) return;
  const all = pruneHandoffs(readAll(store));
  if (!(id in all)) return;
  delete all[id];
  writeAll(store, all);
}

export function handoffUrl(id: string): string {
  return `/ide?handoff=${encodeURIComponent(id)}`;
}
