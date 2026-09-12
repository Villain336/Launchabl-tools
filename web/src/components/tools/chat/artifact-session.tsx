"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";

/**
 * Per-conversation scratch space for artifacts.
 *
 * Tool outputs are immutable snapshots from the model; anything the person
 * adds locally (an uploaded logo, an edited URL) lives here so the next
 * artifact in the same chat can pick it up.
 */
type ArtifactSession = {
  /** Slug of the tool this conversation belongs to. */
  slug: string;
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T | undefined): void;
  /** Send a follow-up in this conversation (set by the chat surface); lets artifacts act in place instead of navigating. */
  send?: (text: string) => void;
};

const noop: ArtifactSession = {
  slug: "",
  get: () => undefined,
  set: () => undefined,
};

const Context = createContext<ArtifactSession>(noop);

export function ArtifactSessionProvider({ slug, onSend, children }: { slug: string; onSend?: (text: string) => void; children: ReactNode }) {
  const store = useRef(new Map<string, unknown>());
  const sendRef = useRef(onSend);
  useEffect(() => {
    sendRef.current = onSend;
  });
  const canSend = Boolean(onSend);
  const session = useMemo<ArtifactSession>(
    () => ({
      slug,
      get: <T,>(key: string) => store.current.get(key) as T | undefined,
      set: (key, value) => {
        if (value === undefined) store.current.delete(key);
        else store.current.set(key, value);
      },
      send: canSend ? (text) => sendRef.current?.(text) : undefined,
    }),
    [slug, canSend],
  );
  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export function useArtifactSession(): ArtifactSession {
  return useContext(Context);
}
