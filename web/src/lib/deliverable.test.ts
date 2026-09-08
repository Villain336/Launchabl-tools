import { describe, expect, it } from "vitest";
import { sourcesFromLog, type SkillResult } from "@/lib/deliverable";

describe("sourcesFromLog", () => {
  it("dedupes identical sources across skills", () => {
    const source = { kind: "live fetch" as const, href: "https://example.com", retrievedAt: "t", note: "HTML response" };
    const log: SkillResult[] = [
      { id: "fetch-page", label: "Check", status: "done", sources: [source], warnings: [] },
      { id: "cite-source", label: "Cite", status: "done", sources: [source], warnings: [] },
    ];
    expect(sourcesFromLog(log)).toHaveLength(1);
  });
});
