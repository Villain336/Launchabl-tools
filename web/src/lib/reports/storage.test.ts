import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import type { Report } from "./extract";
import { deleteReport, listReports, loadReport, recordReportView, saveReport } from "./storage";

const report = (id: string, ownerUid: string, createdAt: string): Report => ({
  id,
  slug: "seo-auditor",
  title: `Report ${id}`,
  ownerUid,
  preparedBy: "Jane",
  createdAt,
  items: [
    { kind: "prompt", text: "Audit x.com" },
    { kind: "tool", tool: "auditWebsite", toolCallId: "t1", input: {}, output: { score: 70 } },
    { kind: "tool", tool: "writeMeta", toolCallId: "t2", input: {}, output: { title: "x" } },
  ],
});

describe("report storage", () => {
  it("lists a user's reports newest first with deliverable and view counts, pruning expired ids", async () => {
    const store = createMemoryStore();
    await saveReport(report("AAAAAAAAAAAA", "u1", "2026-09-10T10:00:00.000Z"), store);
    await saveReport(report("BBBBBBBBBBBB", "u1", "2026-09-11T10:00:00.000Z"), store);
    await saveReport(report("CCCCCCCCCCCC", "u2", "2026-09-11T11:00:00.000Z"), store);
    await recordReportView("BBBBBBBBBBBB", store);
    await recordReportView("BBBBBBBBBBBB", store);
    // Simulate an expired record whose id is still in the index.
    await store.sadd("user:u1:reports", "ZZZZZZZZZZZZ");

    const list = await listReports("u1", store);
    expect(list.map((r) => r.id)).toEqual(["BBBBBBBBBBBB", "AAAAAAAAAAAA"]);
    expect(list[0]).toMatchObject({ items: 2, views: 2, slug: "seo-auditor" });
    expect(await store.smembers("user:u1:reports")).not.toContain("ZZZZZZZZZZZZ");
  });

  it("only lets the owner delete, and the public record disappears", async () => {
    const store = createMemoryStore();
    await saveReport(report("AAAAAAAAAAAA", "u1", "2026-09-10T10:00:00.000Z"), store);
    expect(await deleteReport("AAAAAAAAAAAA", "u2", store)).toBe(false);
    expect(await loadReport("AAAAAAAAAAAA", store)).not.toBeNull();
    expect(await deleteReport("AAAAAAAAAAAA", "u1", store)).toBe(true);
    expect(await loadReport("AAAAAAAAAAAA", store)).toBeNull();
    expect(await listReports("u1", store)).toEqual([]);
  });
});
