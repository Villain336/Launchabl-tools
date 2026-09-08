import { describe, expect, it } from "vitest";
import { getToolAgent, listToolAgents } from "@/lib/tool-agents";
import { TOOL_DELIVERY_POLICIES } from "@/lib/tool-delivery";

describe("tool agents", () => {
  it("registers an agent for every delivery policy", () => {
    const slugs = Object.keys(TOOL_DELIVERY_POLICIES);
    expect(listToolAgents()).toHaveLength(slugs.length);
    for (const slug of slugs) {
      const agent = getToolAgent(slug);
      expect(agent, slug).toBeTruthy();
      expect(agent!.skills.length).toBeGreaterThan(0);
      expect(agent!.requiredAccuracy.length).toBeGreaterThan(0);
      expect(agent!.policy).toBe(TOOL_DELIVERY_POLICIES[slug]);
    }
  });

  it("requires cite-source on the website audit agent", () => {
    expect(getToolAgent("website-audit-report")?.requiredAccuracy).toContain("cite-source");
    expect(getToolAgent("website-audit-report")?.skills.map((s) => s.id)).toEqual([
      "fetch-page",
      "score-page",
      "cite-source",
    ]);
  });
});
