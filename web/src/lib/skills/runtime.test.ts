import { describe, expect, it } from "vitest";
import { runSkillSequence } from "@/lib/skills/runtime";
import type { AgentSkill } from "@/lib/tool-agents";

const skills: AgentSkill[] = [
  { id: "a", label: "First", processing: "server" },
  { id: "b", label: "Second", processing: "server" },
  { id: "c", label: "Third", processing: "server" },
];

const source = { kind: "live fetch" as const, retrievedAt: "2026-01-01T00:00:00.000Z", note: "fixture" };

describe("runSkillSequence", () => {
  it("runs skills queued → running → done in order", async () => {
    const snapshots: string[][] = [];
    const result = await runSkillSequence({
      skills,
      requiredAccuracy: ["c"],
      pauseMs: 0,
      onLog: (log) => snapshots.push(log.map((entry) => `${entry.id}:${entry.status}`)),
      execute: async (skill) => ({ sources: [source], detail: skill.id }),
    });
    expect(result.ok).toBe(true);
    expect(result.log.map((entry) => entry.status)).toEqual(["done", "done", "done"]);
    expect(snapshots[0]).toEqual(["a:queued", "b:queued", "c:queued"]);
    expect(snapshots.some((row) => row.includes("b:running"))).toBe(true);
  });

  it("stops on a thrown skill and leaves later skills queued", async () => {
    const result = await runSkillSequence({
      skills,
      requiredAccuracy: [],
      pauseMs: 0,
      onLog: () => {},
      execute: async (skill) => {
        if (skill.id === "b") throw new Error("boom");
        return { sources: [source] };
      },
    });
    expect(result.ok).toBe(false);
    expect(result.log.map((entry) => entry.status)).toEqual(["done", "failed", "queued"]);
    expect(result.error).toBe("boom");
  });

  it("does not advance when a required accuracy skill never runs", async () => {
    const result = await runSkillSequence({
      skills: [{ id: "fetch-page", label: "Check", processing: "server" }],
      requiredAccuracy: ["cite-source"],
      pauseMs: 0,
      onLog: () => {},
      execute: async () => ({ sources: [source] }),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/cite-source/);
  });

  it("fails a skill that returns no sources", async () => {
    const result = await runSkillSequence({
      skills: [{ id: "score-page", label: "Score", processing: "server" }],
      requiredAccuracy: [],
      pauseMs: 0,
      onLog: () => {},
      execute: async () => ({ sources: [] }),
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/no source/);
  });
});
