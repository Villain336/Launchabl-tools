import { describe, expect, it } from "vitest";
import { clearHandoff, handoffPath, peekHandoff, pruneHandoffs, stageHandoff, type Handoff } from "./handoff";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    size: () => map.size,
  };
}

describe("IDE handoff staging", () => {
  it("stages, peeks without clearing, then clears", () => {
    const store = memoryStorage();
    const id = stageHandoff({ title: "Meta tags", from: "Meta tag generator", files: [{ path: "meta-tags.html", content: "<title>x</title>" }] }, store);
    expect(id).toBeTruthy();
    const first = peekHandoff(id, store);
    expect(first?.files).toEqual([{ path: "meta-tags.html", content: "<title>x</title>" }]);
    expect(peekHandoff(id, store)).toEqual(first);
    clearHandoff(id!, store);
    expect(peekHandoff(id, store)).toBeNull();
    expect(store.size()).toBe(0);
  });

  it("rejects empty payloads and cleans paths", () => {
    const store = memoryStorage();
    expect(stageHandoff({ title: "t", from: "f", files: [{ path: "a", content: "" }] }, store)).toBeNull();
    expect(handoffPath("../../etc/passwd")).toBe("etc/passwd");
    expect(handoffPath("  My File?.html ")).toBe("My File-.html");
    expect(handoffPath("")).toBe("untitled.txt");
  });

  it("prunes old entries and caps the count", () => {
    const now = Date.now();
    const all: Record<string, Handoff> = {};
    for (let i = 0; i < 12; i++) all[`h${i}`] = { id: `h${i}`, title: "t", from: "f", files: [], createdAt: new Date(now - i * 1000).toISOString() };
    all.old = { id: "old", title: "t", from: "f", files: [], createdAt: new Date(now - 7 * 60 * 60 * 1000).toISOString() };
    const pruned = pruneHandoffs(all, now);
    expect(Object.keys(pruned)).toHaveLength(8);
    expect(pruned.old).toBeUndefined();
    expect(pruned.h0).toBeDefined();
  });
});
