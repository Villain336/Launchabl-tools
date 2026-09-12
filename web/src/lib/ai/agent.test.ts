import { describe, expect, it } from "vitest";
import { buildAgentRuntime, skillCatalog } from "./agent";
import { getChatToolRuntime, listChatToolRuntimes } from "./chat-runtime";
import { AGENT_TEMPLATES } from "@/lib/agent/templates";

describe("agent runtime", () => {
  const runtimes = listChatToolRuntimes();
  const agent = buildAgentRuntime(runtimes);

  it("is registered and merges every specialist tool plus loadSkillGuide", () => {
    expect(getChatToolRuntime("agent")?.slug).toBe("agent");
    const names = new Set(Object.keys(agent.tools ?? {}));
    expect(names.has("loadSkillGuide")).toBe(true);
    for (const runtime of runtimes) {
      for (const name of Object.keys(runtime.tools ?? {})) expect(names.has(name)).toBe(true);
    }
    expect((agent.maxSteps ?? 0) >= 10).toBe(true);
  });

  it("lists every specialist with a summary in the catalog and the prompt", () => {
    const catalog = skillCatalog(runtimes);
    expect(catalog.length).toBe(runtimes.filter((r) => r.tools && Object.keys(r.tools).length).length);
    for (const entry of catalog) {
      expect(entry.summary.length).toBeGreaterThan(20);
      expect(agent.instructions).toContain(`- ${entry.slug} — `);
    }
  });

  it("names only real tools in its workflow patterns", () => {
    const names = new Set(Object.keys(agent.tools ?? {}));
    const patterns = agent.instructions.split("## Workflow patterns")[1] ?? "";
    for (const match of patterns.matchAll(/\b([a-z]+[A-Z][A-Za-z]+)\b/g)) {
      expect(names.has(match[1]), match[1]).toBe(true);
    }
  });

  it("loadSkillGuide returns the specialist playbook", async () => {
    const guide = agent.tools!.loadSkillGuide;
    expect(guide.execute).toBeDefined();
    const options = { toolCallId: "t", messages: [] } as unknown as Parameters<NonNullable<typeof guide.execute>>[1];
    const result = (await guide!.execute!({ slug: "dns-email-health" }, options)) as { guide?: string; error?: string };
    expect(result.guide).toContain("SPF");
    const bad = (await guide!.execute!({ slug: "nope" }, options)) as { error?: string };
    expect(bad.error).toMatch(/Unknown skill/);
  });

  it("ships ten templates with fill-in slots", () => {
    expect(AGENT_TEMPLATES).toHaveLength(10);
    expect(new Set(AGENT_TEMPLATES.map((t) => t.id)).size).toBe(10);
    for (const template of AGENT_TEMPLATES) {
      expect(template.prompt).toMatch(/\[[^\]]+\]/);
      expect(template.skills.length).toBeGreaterThan(0);
    }
  });
});
