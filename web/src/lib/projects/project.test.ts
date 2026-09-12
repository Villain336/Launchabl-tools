import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { fillTemplateSlots, normaliseProject, projectContext, projectDomain } from "./project";
import { createProject, deleteProject, getCurrentProjectId, listProjects, loadProject, setCurrentProject, updateProject } from "./storage";

const base = { id: "pr_AAAAAAAAAAAA", ownerUid: "u1", createdAt: "2026-09-12T00:00:00.000Z" };

describe("projects", () => {
  it("normalises input, validates brand colour and logo, and derives the domain", () => {
    const p = normaliseProject(
      { name: "  Acme   Q4 ", company: "Acme", url: "https://www.acme.io/pricing", competitors: [" freshbooks.com", "", "bonsai.com"], brand: { primary: "#ff6600", logoUrl: "not a url", agencyName: "Northwind" } },
      base,
    );
    expect(p.name).toBe("Acme Q4");
    expect(p.competitors).toEqual(["freshbooks.com", "bonsai.com"]);
    expect(p.brand).toEqual({ primary: "#FF6600", logoUrl: null, agencyName: "Northwind", hideBadge: false });
    expect(projectDomain(p)).toBe("acme.io");
    const ctx = projectContext(p);
    expect(ctx).toContain('working on "Acme Q4"');
    expect(ctx).toContain("Website: https://www.acme.io/pricing");
    expect(ctx).toContain("Brand colour: #FF6600");
    expect(ctx).not.toContain("Audience:");
  });

  it("fills template slots from the project and leaves unknown ones", () => {
    const p = normaliseProject({ company: "Acme", url: "acme.io", audience: "freelancers", offers: "Invoicing app — $29/mo\nSetup — $499", tone: "plain" }, base);
    const out = fillTemplateSlots("Launch [domain] for [audience]: we sell [what you sell] in a [confident / playful / technical] voice. Go live on [date].", p);
    expect(out).toBe("Launch acme.io for freelancers: we sell Invoicing app — $29/mo in a plain voice. Go live on [date].");
    expect(fillTemplateSlots("Audit [domain]", null)).toBe("Audit [domain]");
  });

  it("stores per user with ownership checks and an active pointer", async () => {
    const store = createMemoryStore();
    const created = await createProject("u1", { name: "Acme" }, store);
    if ("error" in created) throw new Error(created.error);
    expect(await loadProject(created.id, "u2", store)).toBeNull();
    expect(await updateProject(created.id, "u1", { tone: "warm" }, store)).toMatchObject({ tone: "warm", name: "Acme" });
    await setCurrentProject("u1", created.id, store);
    expect(await getCurrentProjectId("u1", store)).toBe(created.id);
    expect((await listProjects("u1", store)).map((p) => p.id)).toEqual([created.id]);
    expect(await deleteProject(created.id, "u2", store)).toBe(false);
    expect(await deleteProject(created.id, "u1", store)).toBe(true);
    expect(await getCurrentProjectId("u1", store)).toBeNull();
    expect(await listProjects("u1", store)).toEqual([]);
  });
});
