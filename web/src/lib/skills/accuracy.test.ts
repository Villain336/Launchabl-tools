import { describe, expect, it } from "vitest";
import { assertSources, dropUnsourced, requiredDone } from "@/lib/skills/accuracy";
import type { SkillResult } from "@/lib/deliverable";

const done = (id: string, sources: SkillResult["sources"] = [{ kind: "live fetch", retrievedAt: "2026-01-01T00:00:00.000Z", note: "test" }]): SkillResult => ({
  id,
  label: id,
  status: "done",
  sources,
  warnings: [],
});

describe("requiredDone", () => {
  it("passes when required skills finished", () => {
    expect(requiredDone([done("cite-source"), done("fetch-page")], ["cite-source"]).ok).toBe(true);
  });

  it("fails when a required skill is missing or not done", () => {
    expect(requiredDone([done("fetch-page")], ["cite-source"]).missing).toEqual(["cite-source"]);
    expect(
      requiredDone(
        [{ id: "cite-source", label: "Attach sources", status: "failed", sources: [], warnings: [] }],
        ["cite-source"],
      ).ok,
    ).toBe(false);
  });
});

describe("assertSources", () => {
  it("throws when a done skill has no source", () => {
    expect(() => assertSources({ id: "score-page", status: "done", sources: [] })).toThrow(/no source/);
  });

  it("allows queued skills without sources", () => {
    expect(() => assertSources({ id: "score-page", status: "queued", sources: [] })).not.toThrow();
  });
});

describe("dropUnsourced", () => {
  it("drops values with empty sources", () => {
    expect(dropUnsourced({ score: 80, sources: [] })).toBeNull();
    expect(dropUnsourced({ score: 80, sources: [{ kind: "live fetch" as const, retrievedAt: "t", note: "n" }] })?.score).toBe(80);
  });
});
