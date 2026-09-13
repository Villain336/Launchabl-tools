import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { resetDbForTests } from "@/lib/db/client";
import { listAuditEvents, logAuditEvent } from "./log";

describe("audit log (no DATABASE_URL configured)", () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    resetDbForTests();
  });

  afterEach(() => {
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    resetDbForTests();
  });

  it("records events to the KV recent-activity cache and reads them back, most recent first", async () => {
    const store = createMemoryStore();
    await logAuditEvent({ orgId: "org_1", actorUid: "u1", action: "org.created", target: "org_1", detail: { name: "Acme" } }, store);
    await logAuditEvent({ orgId: "org_1", actorUid: "u2", action: "org.member_joined", target: "u2" }, store);
    await logAuditEvent({ orgId: "org_2", actorUid: "u3", action: "org.created", target: "org_2" }, store);

    const all = await listAuditEvents(100, undefined, store);
    expect(all.map((e) => e.action)).toEqual(["org.created", "org.member_joined", "org.created"]);
    expect(all[0].orgId).toBe("org_2");
    expect(all[0].id).toBeTruthy();
    expect(all[0].createdAt).toBeTruthy();

    const scoped = await listAuditEvents(100, "org_1", store);
    expect(scoped).toHaveLength(2);
    expect(scoped.every((e) => e.orgId === "org_1")).toBe(true);
  });

  it("respects the limit parameter", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < 5; i++) await logAuditEvent({ actorUid: "u1", action: "admin.usage_viewed" }, store);
    expect(await listAuditEvents(2, undefined, store)).toHaveLength(2);
  });

  it("returns an empty list when nothing has been logged yet", async () => {
    const store = createMemoryStore();
    expect(await listAuditEvents(100, undefined, store)).toEqual([]);
  });
});
