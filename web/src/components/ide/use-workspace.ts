"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadWorkspace, saveWorkspace } from "@/lib/ide/store";
import { applyEdits, isValidPath, makeFile, normalisePath, removeFile, type AppliedEdit, type Workspace, type WorkspaceFile } from "@/lib/ide/workspace";

const LAST_KEY = "launchabl-ide-last";

/**
 * The open workspace, persisted to IndexedDB a moment after each change.
 * Keeps a ref in sync so async callers (AI tools, autosave) read the latest
 * files without stale closures.
 */
export function useWorkspace() {
  const [workspace, setWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef<Workspace | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setWorkspace = useCallback((next: Workspace | null | ((prev: Workspace | null) => Workspace | null)) => {
    setWorkspaceState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      ref.current = value;
      if (value) {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => void saveWorkspace(value), 400);
        try {
          localStorage.setItem(LAST_KEY, value.id);
        } catch {
          /* private mode */
        }
      }
      return value;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const last = typeof localStorage === "undefined" ? null : localStorage.getItem(LAST_KEY);
      const ws = last ? await loadWorkspace(last) : null;
      if (cancelled) return;
      ref.current = ws;
      setWorkspaceState(ws);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const touch = (ws: Workspace): Workspace => ({ ...ws, updatedAt: new Date().toISOString() });

  const updateFile = useCallback(
    (path: string, content: string) =>
      setWorkspace((ws) => {
        if (!ws || !ws.files[path]) return ws;
        const prev = ws.files[path];
        if (prev.content === content) return ws;
        return touch({ ...ws, files: { ...ws.files, [path]: { ...prev, content, size: new TextEncoder().encode(content).length } } });
      }),
    [setWorkspace],
  );

  const createFile = useCallback(
    (rawPath: string, content = ""): string | null => {
      const path = normalisePath(rawPath);
      if (!isValidPath(path)) return null;
      let created = false;
      setWorkspace((ws) => {
        if (!ws || ws.files[path]) return ws;
        created = true;
        return touch({ ...ws, files: { ...ws.files, [path]: makeFile(path, content, { original: null }) }, tombstones: ws.tombstones?.filter((p) => p !== path) });
      });
      return created ? path : null;
    },
    [setWorkspace],
  );

  const deleteFile = useCallback((path: string) => setWorkspace((ws) => (ws && ws.files[path] ? removeFile(ws, path) : ws)), [setWorkspace]);

  const renameFile = useCallback(
    (from: string, rawTo: string): string | null => {
      const to = normalisePath(rawTo);
      if (!isValidPath(to)) return null;
      let ok = false;
      setWorkspace((ws) => {
        if (!ws || !ws.files[from] || ws.files[to]) return ws;
        ok = true;
        const file = ws.files[from];
        // A renamed file is "new at the new path, deleted at the old" for the commit.
        const removed = removeFile(ws, from);
        return touch({ ...removed, files: { ...removed.files, [to]: { ...file, path: to, original: null } }, tombstones: removed.tombstones?.filter((p) => p !== to) });
      });
      return ok ? to : null;
    },
    [setWorkspace],
  );

  const acceptEdits = useCallback((accepted: AppliedEdit[]) => setWorkspace((ws) => (ws ? applyEdits(ws, accepted) : ws)), [setWorkspace]);

  /** Mark everything as committed: current content becomes the baseline. */
  const markClean = useCallback(
    (sha: string | null, ref?: string) =>
      setWorkspace((ws) => {
        if (!ws) return ws;
        const files: Record<string, WorkspaceFile> = {};
        for (const [path, file] of Object.entries(ws.files)) files[path] = { ...file, original: file.content };
        const source = ws.source.kind === "github" ? { ...ws.source, sha: sha ?? ws.source.sha, ref: ref ?? ws.source.ref } : ws.source;
        return touch({ ...ws, files, source, tombstones: [] });
      }),
    [setWorkspace],
  );

  const flush = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (ref.current) await saveWorkspace(ref.current);
  }, []);

  const openWorkspace = useCallback(
    async (id: string) => {
      await flush();
      const ws = await loadWorkspace(id);
      setWorkspace(ws);
      return ws;
    },
    [flush, setWorkspace],
  );

  /** Back to the launcher; the workspace stays in IndexedDB. */
  const closeWorkspace = useCallback(async () => {
    await flush();
    ref.current = null;
    setWorkspaceState(null);
    try {
      localStorage.removeItem(LAST_KEY);
    } catch {
      /* private mode */
    }
  }, [flush]);

  return { workspace, workspaceRef: ref, loading, setWorkspace, openWorkspace, closeWorkspace, updateFile, createFile, deleteFile, renameFile, acceptEdits, markClean, flush };
}

export type WorkspaceApi = ReturnType<typeof useWorkspace>;
