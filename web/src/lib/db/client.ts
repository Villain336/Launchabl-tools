/**
 * Optional Postgres access (Neon serverless driver — HTTP-based, works in
 * both the `nodejs` and `edge` runtimes with no connection pool to manage).
 *
 * Postgres backs exactly two things in this codebase, per the scalability
 * and enterprise-compliance roadmaps (`docs/STRATEGY.md` §19.4/§20): the
 * append-only admin/org audit log (`lib/audit/log.ts`) and the billing
 * ledger (`lib/billing/ledger.ts`). Everything else — sessions, rate
 * limits, usage counters, org/project records — stays on the KV store
 * (`lib/ai/store.ts`); don't add new tables here for that kind of data.
 *
 * `DATABASE_URL` is optional. When it's unset, `getDb()` returns `null` and
 * every caller in this codebase treats that as "skip the durable write,
 * KV/console already has what's needed for a dev environment" rather than
 * throwing — see the module docstrings in `lib/audit/log.ts` and
 * `lib/billing/ledger.ts`.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  var __launchablDb: NeonQueryFunction<false, false> | null | undefined;
}

export function getDb(): NeonQueryFunction<false, false> | null {
  if (globalThis.__launchablDb !== undefined) return globalThis.__launchablDb;
  const url = process.env.DATABASE_URL;
  globalThis.__launchablDb = url ? neon(url) : null;
  return globalThis.__launchablDb;
}

/** For tests: reset the memoised client so a mocked/changed env is picked up. */
export function resetDbForTests(): void {
  globalThis.__launchablDb = undefined;
}
