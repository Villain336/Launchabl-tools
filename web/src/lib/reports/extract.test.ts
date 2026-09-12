import { describe, expect, it } from "vitest";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { extractReportItems, fitReport, hasDeliverable, reportTitle, type Report } from "./extract";

const user = (id: string, text: string): ToolChatMessage => ({ id, role: "user", parts: [{ type: "text", text }] });
const assistant = (id: string, parts: ToolChatMessage["parts"]): ToolChatMessage => ({ id, role: "assistant", parts });
const tool = (name: string, output: unknown, state = "output-available", extra: Record<string, unknown> = {}) =>
  ({ type: `tool-${name}`, toolCallId: `${name}-1`, state, input: { url: "https://x.com" }, output, ...extra }) as unknown as ToolChatMessage["parts"][number];

describe("report extraction", () => {
  it("keeps briefs, successful artifacts and closing text in order; drops working steps and failures", () => {
    const messages = [
      user("u1", "Audit https://x.com and write the meta tags."),
      assistant("a1", [
        { type: "text", text: "On it." },
        tool("fetchPage", { title: "x" }),
        tool("auditWebsite", { score: 71 }),
        tool("writeMeta", null, "output-error", { errorText: "boom" }),
        tool("writeMeta", { title: "X — fast" }),
        { type: "text", text: "Fix the hero first." },
        { type: "text", text: "Then ship." },
      ]),
      user("u2", "Thanks"),
      assistant("a2", [{ type: "text", text: "   " }]),
    ];
    const items = extractReportItems(messages);
    expect(items.map((i) => (i.kind === "tool" ? `tool:${i.tool}` : i.kind))).toEqual(["prompt", "text", "tool:auditWebsite", "tool:writeMeta", "text", "prompt"]);
    expect(items[4]).toEqual({ kind: "text", text: "Fix the hero first.\n\nThen ship." });
    expect(reportTitle(items)).toBe("Audit https://x.com and write the meta tags.");
    expect(hasDeliverable(messages)).toBe(true);
    expect(hasDeliverable([user("u", "hi"), assistant("a", [tool("fetchPage", {})])])).toBe(false);
  });

  it("fits a report into the byte budget by dropping pixels first, then the oldest items", () => {
    const pixels = "data:image/png;base64," + "A".repeat(5_000);
    const base: Report = {
      id: "r",
      slug: "agent",
      title: "t",
      ownerUid: "u",
      preparedBy: null,
      createdAt: "2026-09-12T00:00:00.000Z",
      items: [
        { kind: "prompt", text: "make an image" },
        { kind: "tool", tool: "generateImage", toolCallId: "g1", input: {}, output: { prompt: "cat", images: [{ dataUrl: pixels }] } },
        { kind: "tool", tool: "writeMeta", toolCallId: "m1", input: {}, output: { title: "x".repeat(2_000) } },
      ],
    };
    const roomy = fitReport(base, 50_000);
    expect(roomy?.trimmed).toBeUndefined();
    expect(roomy?.items).toHaveLength(3);

    const tight = fitReport(base, 4_000);
    expect(tight?.trimmed).toBe(true);
    const image = tight?.items.find((i) => i.kind === "tool" && i.tool === "generateImage");
    expect(image && image.kind === "tool" ? (image.output as { images: unknown[]; expired: boolean }) : null).toMatchObject({ images: [], expired: true });

    const tiny = fitReport(base, 2_300);
    expect(tiny?.items.map((i) => (i.kind === "tool" ? i.tool : i.kind))).toEqual(["writeMeta"]);

    expect(fitReport(base, 100)).toBeNull();
  });
});
