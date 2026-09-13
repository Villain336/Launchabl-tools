"use client";

import { useEffect, useSyncExternalStore } from "react";
import { resetHistorySync } from "@/lib/chat/history";
import { resetProjects } from "@/lib/projects/use-projects";

/**
 * Client view of the account: fetched once per page load from /api/auth/me,
 * shared across every component through a module-level store so the chat
 * surface, header and sign-in card agree without prop drilling.
 */

export type SessionUser = { email: string; name: string | null };
/** `credits` is the purchased credit-pack balance (lib/billing/credits.ts); `isPro`/`credits` are null while signed out or loading. */
export type SessionState = {
  status: "loading" | "ready";
  user: SessionUser | null;
  freeRunsLeft: number | null;
  credits: number | null;
  isPro: boolean | null;
};

let state: SessionState = { status: "loading", user: null, freeRunsLeft: null, credits: null, isPro: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const SERVER_STATE: SessionState = { status: "loading", user: null, freeRunsLeft: null, credits: null, isPro: null };

function emit(next: SessionState) {
  state = next;
  for (const listener of listeners) listener();
}

export function refreshSession(): Promise<void> {
  inflight ??= fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      const data = (await res.json()) as { user: SessionUser | null; freeRunsLeft: number | null; credits?: number; isPro?: boolean };
      emit({
        status: "ready",
        user: data.user,
        freeRunsLeft: data.freeRunsLeft,
        credits: data.user ? data.credits ?? 0 : null,
        isPro: data.user ? data.isPro ?? false : null,
      });
    })
    .catch(() => emit({ status: "ready", user: null, freeRunsLeft: null, credits: null, isPro: null }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function setSessionUser(user: SessionUser | null) {
  emit({ status: "ready", user, freeRunsLeft: user ? null : 0, credits: user ? state.credits : null, isPro: user ? state.isPro : null });
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
  emit({ status: "ready", user: null, freeRunsLeft: 0, credits: null, isPro: null });
  resetHistorySync();
  resetProjects();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useSession(): SessionState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    if (state.status === "loading") void refreshSession();
  }, []);
  return snapshot;
}
