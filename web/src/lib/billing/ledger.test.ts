import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { resetDbForTests } from "@/lib/db/client";
import { ledgerSummary, listLedgerEntries, recordLedgerEntry } from "./ledger";

describe("billing ledger (no DATABASE_URL configured)", () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
    resetDbForTests();
  });

  afterEach(() => {
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    resetDbForTests();
  });

  it("is a safe no-op write and returns empty reads when Postgres isn't configured", async () => {
    await expect(
      recordLedgerEntry({ stripeEventId: "evt_1", uid: "u1", kind: "checkout_completed", raw: { sessionId: "cs_1" } }),
    ).resolves.toBeUndefined();
    expect(await listLedgerEntries()).toEqual([]);
    expect(await ledgerSummary()).toBeNull();
  });
});
