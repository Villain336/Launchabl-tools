"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

/**
 * Per-conversation scratch space for artifacts.
 *
 * Tool outputs are immutable snapshots from the model; anything the person
 * adds locally (an uploaded logo, an edited URL) lives here so the next
 * artifact in the same chat can pick it up.
 */
type ArtifactSession = {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T | undefined): void;
};

const noop: ArtifactSession = {
  get: () => undefined,
  set: () => undefined,
};

const Context = createContext<ArtifactSession>(noop);

export function ArtifactSessionProvider({ children }: { children: ReactNode }) {
  const store = useRef(new Map<string, unknown>());
  const session = useMemo<ArtifactSession>(
    () => ({
      get: <T,>(key: string) => store.current.get(key) as T | undefined,
      set: (key, value) => {
        if (value === undefined) store.current.delete(key);
        else store.current.set(key, value);
      },
    }),
    [],
  );
  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export function useArtifactSession(): ArtifactSession {
  return useContext(Context);
}
