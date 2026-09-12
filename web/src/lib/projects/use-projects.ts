"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Project, ProjectInput } from "@/lib/projects/project";

/**
 * Client view of the user's projects, shared across the chat header, the
 * project panel and template prefill through a module-level store.
 */

export type ProjectsState = { status: "idle" | "loading" | "ready"; projects: Project[]; current: string | null };

let state: ProjectsState = { status: "idle", projects: [], current: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const SERVER_STATE: ProjectsState = { status: "idle", projects: [], current: null };

function emit(next: ProjectsState) {
  state = next;
  for (const listener of listeners) listener();
}

export function refreshProjects(): Promise<void> {
  inflight ??= fetch("/api/projects", { credentials: "same-origin", cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { projects: Project[]; current: string | null };
      emit({ status: "ready", projects: data.projects, current: data.current });
    })
    .catch(() => emit({ status: "ready", projects: [], current: null }))
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Forget everything (sign-out). */
export function resetProjects() {
  emit({ status: "idle", projects: [], current: null });
}

export function currentProject(): Project | null {
  return state.projects.find((p) => p.id === state.current) ?? null;
}

export async function selectProject(id: string | null): Promise<void> {
  emit({ ...state, current: id });
  await fetch("/api/projects", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ current: id }) }).catch(() => undefined);
}

export async function saveProject(input: ProjectInput, id?: string): Promise<Project | { error: string }> {
  const res = await fetch(id ? `/api/projects/${id}` : "/api/projects", {
    method: id ? "PATCH" : "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = (await res.json().catch(() => ({}))) as { project?: Project; error?: string };
  if (!res.ok || !body.project) return { error: body.error ?? "Couldn't save the project." };
  const project = body.project;
  const others = state.projects.filter((p) => p.id !== project.id);
  emit({ status: "ready", projects: [project, ...others], current: id ? state.current : project.id });
  return project;
}

export async function removeProject(id: string): Promise<void> {
  emit({ ...state, projects: state.projects.filter((p) => p.id !== id), current: state.current === id ? null : state.current });
  await fetch(`/api/projects/${id}`, { method: "DELETE" }).catch(() => undefined);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Live projects state; loads on first use when `enabled` (i.e. the user is signed in). */
export function useProjects(enabled: boolean): ProjectsState {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    if (enabled && state.status === "idle") void refreshProjects();
    if (!enabled && state.status !== "idle" && state.projects.length) resetProjects();
  }, [enabled]);
  return snapshot;
}
