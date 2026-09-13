/** Manual smoke test against a real, provisioned Postgres — not part of the vitest suite. Run: npx tsx scripts/smoke-test-db.ts */
import { logAuditEvent, listAuditEvents } from "../src/lib/audit/log";
import { recordLedgerEntry, listLedgerEntries, ledgerSummary } from "../src/lib/billing/ledger";
import { createMemoryStore } from "../src/lib/ai/store";

async function main() {
  const store = createMemoryStore();
  await logAuditEvent({ orgId: "org_smoke", actorUid: "u_smoke", action: "org.created", target: "org_smoke", detail: { name: "Smoke Test Org" } }, store);
  const events = await listAuditEvents(10, "org_smoke");
  console.log("audit events from Postgres:", JSON.stringify(events, null, 2));

  await recordLedgerEntry({ stripeEventId: "evt_smoke_1", uid: "u_smoke", kind: "checkout_completed", amountCents: 1200, currency: "usd", status: "complete", raw: { sessionId: "cs_smoke_1" } });
  await recordLedgerEntry({ stripeEventId: "evt_smoke_1", uid: "u_smoke", kind: "checkout_completed", amountCents: 1200, currency: "usd", status: "complete", raw: { sessionId: "cs_smoke_1" } });
  const rows = await listLedgerEntries(10);
  console.log("ledger rows:", JSON.stringify(rows, null, 2));
  const summary = await ledgerSummary();
  console.log("ledger summary:", JSON.stringify(summary, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
