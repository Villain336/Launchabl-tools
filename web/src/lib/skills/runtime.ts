import type { SkillResult } from "@/lib/deliverable";
import { assertSources, requiredDone } from "@/lib/skills/accuracy";
import type { AgentSkill } from "@/lib/tool-agents";

export type SkillExecuteResult = {
  payload?: unknown;
  sources: SkillResult["sources"];
  warnings?: string[];
  detail?: string;
};

export type SkillExecutor = (skill: AgentSkill) => Promise<SkillExecuteResult>;

function queuedLog(skills: AgentSkill[]): SkillResult[] {
  return skills.map((skill) => ({
    id: skill.id,
    label: skill.label,
    status: "queued" as const,
    sources: [],
    warnings: [],
  }));
}

function patchLog(log: SkillResult[], id: string, patch: Partial<SkillResult>): SkillResult[] {
  return log.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
}

const defaultPause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSkillSequence(opts: {
  skills: AgentSkill[];
  requiredAccuracy: string[];
  execute: SkillExecutor;
  onLog: (log: SkillResult[]) => void;
  pauseMs?: number;
  pause?: (ms: number) => Promise<unknown>;
}): Promise<{ ok: boolean; log: SkillResult[]; error?: string }> {
  const pause = opts.pause ?? defaultPause;
  const pauseMs = opts.pauseMs ?? 280;
  let log = queuedLog(opts.skills);
  opts.onLog(log);

  for (const skill of opts.skills) {
    const startedAt = new Date().toISOString();
    log = patchLog(log, skill.id, { status: "running", startedAt });
    opts.onLog(log);
    if (pauseMs > 0) await pause(pauseMs);

    try {
      const result = await opts.execute(skill);
      const next: SkillResult = {
        id: skill.id,
        label: skill.label,
        status: "done",
        payload: result.payload,
        sources: result.sources,
        warnings: result.warnings ?? [],
        detail: result.detail,
        startedAt,
        endedAt: new Date().toISOString(),
      };
      assertSources(next);
      log = patchLog(log, skill.id, next);
      opts.onLog(log);
    } catch (err) {
      const message = err instanceof Error ? err.message : "This skill failed.";
      log = patchLog(log, skill.id, {
        status: "failed",
        detail: message,
        warnings: [],
        sources: [],
        endedAt: new Date().toISOString(),
      });
      opts.onLog(log);
      return { ok: false, log, error: message };
    }
  }

  const accuracy = requiredDone(log, opts.requiredAccuracy);
  if (!accuracy.ok) {
    const error = `Missing required checks: ${accuracy.missing.join(", ")}`;
    return { ok: false, log, error };
  }

  return { ok: true, log };
}
