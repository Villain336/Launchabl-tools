import { describe, expect, it } from "vitest";
import type { ModelMessage } from "ai";
import { collectDeliverables } from "./review";

const toolMessage = (parts: Array<{ toolName: string; output: unknown; id?: string }>): ModelMessage => ({
  role: "tool",
  content: parts.map((p, i) => ({
    type: "tool-result" as const,
    toolCallId: p.id ?? `call_${i}`,
    toolName: p.toolName,
    output: p.output as never,
  })),
});

describe("collectDeliverables", () => {
  it("keeps deliverable outputs and skips internal tools and errors", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "Write me a headline and a tweet." },
      toolMessage([
        { toolName: "fetchPage", output: { type: "json", value: { url: "https://acme.io" } } },
        { toolName: "loadSkillGuide", output: { type: "text", value: "guide" } },
        { toolName: "deliverHeadlines", output: { type: "json", value: { headlines: ["A"] } }, id: "h1" },
        { toolName: "deliverPosts", output: { type: "error-text", value: "boom" } },
        { toolName: "deliverPosts", output: { type: "json", value: { posts: ["B"] } }, id: "p1" },
      ]),
    ];
    const out = collectDeliverables(messages);
    expect(out.map((d) => d.tool)).toEqual(["deliverHeadlines", "deliverPosts"]);
    expect(out[0]).toMatchObject({ toolCallId: "h1", output: { headlines: ["A"] } });
    expect(out[1].output).toEqual({ posts: ["B"] });
  });

  it("keeps only the newest eight when there are more", () => {
    const parts = Array.from({ length: 11 }, (_, i) => ({ toolName: `deliver${i}`, output: { type: "json", value: i } }));
    const out = collectDeliverables([toolMessage(parts)]);
    expect(out).toHaveLength(8);
    expect(out[0].tool).toBe("deliver3");
    expect(out[7].output).toBe(10);
  });
});
