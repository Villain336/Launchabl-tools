/**
 * Billing ledger on Postgres (Enterprise compliance roadmap, Phase 1 —
 * `docs/STRATEGY.md` §20/§19.4). Most security questionnaires implicitly
 * expect referential integrity/backups on financial records, not a KV
 * counter — this table is that record.
 *
 * Dual-write from `lib/billing/webhook-handler.ts`, additive alongside
 * (never instead of) the existing KV writes that drive live entitlement
 * checks. One row per Stripe event that changes money-relevant state,
 * de-duplicated in the database itself via a unique constraint on
 * `stripe_event_id` (`ON CONFLICT ... DO NOTHING`) — a real, DB-enforced
 * idempotency guarantee, not a best-effort KV existence check. A Postgres
 * write failure here is logged and swallowed: the webhook's KV-backed
 * entitlement logic must never fail because the durable ledger is down.
 */
import { getDb } from "@/lib/db/client";

export type LedgerKind = "checkout_completed" | "credit_pack_granted" | "subscription_created" | "subscription_updated" | "subscription_deleted";

export type LedgerEntry = {
  /** The Stripe event id this row was recorded from — the de-duplication key. */
  stripeEventId: string;
  uid: string;
  kind: LedgerKind;
  amountCents?: number | null;
  currency?: string | null;
  status?: string | null;
  /** A curated subset of the Stripe object, not the raw payload — enough for reconciliation without over-retaining unrelated fields. */
  raw: Record<string, unknown>;
};

export async function recordLedgerEntry(entry: LedgerEntry): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db`
      INSERT INTO billing_ledger (stripe_event_id, uid, kind, amount_cents, currency, status, raw)
      VALUES (${entry.stripeEventId}, ${entry.uid}, ${entry.kind}, ${entry.amountCents ?? null}, ${entry.currency ?? null}, ${entry.status ?? null}, ${JSON.stringify(entry.raw)})
      ON CONFLICT (stripe_event_id) DO NOTHING
    `;
  } catch (err) {
    console.warn(`[billing/ledger] failed to record ${entry.kind} for event ${entry.stripeEventId}:`, err instanceof Error ? err.message : err);
  }
}

export type LedgerRow = Omit<LedgerEntry, "amountCents" | "currency" | "status"> & {
  id: number;
  amountCents: number | null;
  currency: string | null;
  status: string | null;
  createdAt: string;
};

/** Recent ledger rows for the admin dashboard. Returns an empty array (not an error) when Postgres isn't configured. */
export async function listLedgerEntries(limit = 100): Promise<LedgerRow[]> {
  const db = getDb();
  if (!db) return [];
  try {
    const rows = await db`SELECT id, stripe_event_id, uid, kind, amount_cents, currency, status, raw, created_at FROM billing_ledger ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map((row) => ({
      id: Number(row.id),
      stripeEventId: String(row.stripe_event_id),
      uid: String(row.uid),
      kind: row.kind as LedgerKind,
      // BIGINT comes back from the Neon driver as a string to avoid precision loss; amounts here are well within Number's safe range.
      amountCents: row.amount_cents === null ? null : Number(row.amount_cents),
      currency: (row.currency as string | null) ?? null,
      status: (row.status as string | null) ?? null,
      raw: row.raw as Record<string, unknown>,
      createdAt: new Date(row.created_at as string).toISOString(),
    }));
  } catch (err) {
    console.warn("[billing/ledger] failed to read billing_ledger from Postgres:", err instanceof Error ? err.message : err);
    return [];
  }
}

export type LedgerSummary = { rows: number; byKind: Record<string, number>; totalCentsByCurrency: Record<string, number> };

/** Cheap aggregate for the admin dashboard — whether the ledger is populated and roughly what it contains, without shipping every row to the client. */
export async function ledgerSummary(): Promise<LedgerSummary | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const [totals, byKind] = await Promise.all([
      db`SELECT count(*)::int AS rows FROM billing_ledger`,
      db`SELECT kind, count(*)::int AS n, coalesce(sum(amount_cents), 0)::bigint AS cents, coalesce(currency, 'usd') AS currency FROM billing_ledger GROUP BY kind, currency`,
    ]);
    const byKindCounts: Record<string, number> = {};
    const totalCentsByCurrency: Record<string, number> = {};
    for (const row of byKind) {
      byKindCounts[row.kind as string] = ((byKindCounts[row.kind as string] as number) ?? 0) + Number(row.n);
      const currency = row.currency as string;
      totalCentsByCurrency[currency] = (totalCentsByCurrency[currency] ?? 0) + Number(row.cents);
    }
    return { rows: Number(totals[0]?.rows ?? 0), byKind: byKindCounts, totalCentsByCurrency };
  } catch (err) {
    console.warn("[billing/ledger] failed to summarise billing_ledger from Postgres:", err instanceof Error ? err.message : err);
    return null;
  }
}
