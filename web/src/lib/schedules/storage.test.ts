import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { reportItemsFromSteps } from "./runner";
import { claimSchedule, createSchedule, deleteSchedule, listDueSchedules, listSchedules, releaseSchedule, updateSchedule } from "./storage";

const owner = { uid: "u1", email: "me@example.com", name: "Me" };
const prompt = "Audit https://acme.io and list what changed since last week.";

describe("schedule storage", () => {
  it("creates, lists, finds due schedules and claims them once", async () => {
    const store = createMemoryStore();
    const now = new Date("2026-09-12T10:00:00Z");
    const created = await createSchedule(owner, { prompt, slug: "website-audit-report", cadence: "daily", hourUtc: 11 }, store, now);
    if ("error" in created) throw new Error(created.error);
    expect(created.nextRunAt).toBe("2026-09-12T11:00:00.000Z");
    expect((await listSchedules("u1", store)).map((s) => s.id)).toEqual([created.id]);
    expect(await listSchedules("someone-else", store)).toEqual([]);

    expect(await listDueSchedules(new Date("2026-09-12T10:59:00Z"), store)).toEqual([]);
    expect((await listDueSchedules(new Date("2026-09-12T11:00:00Z"), store)).map((s) => s.id)).toEqual([created.id]);

    expect(await claimSchedule(created.id, store)).toBe(true);
    expect(await claimSchedule(created.id, store)).toBe(false);
    await releaseSchedule(created.id, store);
    expect(await claimSchedule(created.id, store)).toBe(true);

    const paused = await updateSchedule(created.id, "u1", { enabled: false }, store, now);
    expect(paused && !("error" in paused) && paused.enabled).toBe(false);
    expect(await listDueSchedules(new Date("2026-09-12T11:00:00Z"), store)).toEqual([]);
    expect(await updateSchedule(created.id, "intruder", { enabled: true }, store, now)).toBeNull();
    expect(await deleteSchedule(created.id, "intruder", store)).toBe(false);
    expect(await deleteSchedule(created.id, "u1", store)).toBe(true);
    expect(await listSchedules("u1", store)).toEqual([]);
  });

  it("turns run steps into report items, skipping internal tools and errors", () => {
    const items = reportItemsFromSteps(
      prompt,
      [
        { text: "", toolResults: [{ toolName: "fetchPage", toolCallId: "a", input: {}, output: { html: "…" } }] },
        {
          text: "",
          toolResults: [
            { toolName: "auditWebsite", toolCallId: "b", input: { url: "https://acme.io" }, output: { score: 80 } },
            { toolName: "checkSsl", toolCallId: "c", input: {}, output: { type: "error-text", value: "timeout" } },
          ],
        },
      ],
      "Here's the handover.",
    );
    expect(items.map((i) => i.kind)).toEqual(["prompt", "tool", "text"]);
    expect(items[1]).toMatchObject({ tool: "auditWebsite", toolCallId: "b", output: { score: 80 } });
  });
});
