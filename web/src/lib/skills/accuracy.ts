import type { SkillResult } from "@/lib/deliverable";

export function requiredDone(log: SkillResult[], required: string[]): { ok: boolean; missing: string[] } {
  const missing = required.filter((id) => {
    const skill = log.find((entry) => entry.id === id);
    return !skill || skill.status !== "done";
  });
  return { ok: missing.length === 0, missing };
}

export function assertSources(result: Pick<SkillResult, "status" | "sources" | "id">): void {
  if (result.status !== "done") return;
  if (!result.sources?.length) {
    throw new Error(`Skill ${result.id} finished with no source`);
  }
}

export function dropUnsourced<T extends { sources?: unknown[] }>(value: T | null | undefined): T | null {
  if (!value) return null;
  if (!value.sources || value.sources.length === 0) return null;
  return value;
}
