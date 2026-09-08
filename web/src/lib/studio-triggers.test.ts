import { describe, expect, it } from "vitest";
import { listToolAgents } from "@/lib/tool-agents";
import { extractUrls, triggerSpec } from "@/lib/studio-triggers";

describe("studio triggers", () => {
  it("extracts raw http(s) urls", () => {
    expect(extractUrls("audit https://example.com and http://acme.test/path")).toEqual([
      "https://example.com",
      "http://acme.test/path",
    ]);
    expect(extractUrls("no url here")).toEqual([]);
  });

  it("has a chat spec for every delivery agent", () => {
    for (const agent of listToolAgents()) {
      const spec = triggerSpec(agent.slug);
      expect(spec.placeholder.length).toBeGreaterThan(0);
      expect(spec.suggestions.length).toBeGreaterThan(0);
      expect(spec.questions.length).toBeGreaterThan(0);
      expect(spec.messages.length).toBeGreaterThan(0);
    }
  });
});
