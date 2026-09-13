import { NextResponse, type NextRequest } from "next/server";
import { adminAuthorized } from "@/lib/admin/auth";
import { listAuditEvents, logAuditEvent } from "@/lib/audit/log";
import { ledgerSummary, listLedgerEntries } from "@/lib/billing/ledger";
import { getDb } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/**
 * Admin audit log + billing ledger (Enterprise compliance roadmap, Phase 1
 * — docs/STRATEGY.md §20). Works with zero setup (reads the KV
 * recent-activity cache) and upgrades to the durable, queryable Postgres
 * record automatically once DATABASE_URL is configured.
 */
export async function GET(request: NextRequest) {
  if (!process.env.ADMIN_TOKEN) return NextResponse.json({ error: "Set ADMIN_TOKEN to enable the admin dashboard." }, { status: 503 });
  if (!adminAuthorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [auditEvents, ledgerRows, ledger] = await Promise.all([listAuditEvents(200), listLedgerEntries(200), ledgerSummary()]);
  // Viewing this panel is itself an admin action worth recording. `actorUid`
  // is a placeholder ("admin") until there's more than one operator — the
  // single shared ADMIN_TOKEN (§14.3) can't yet express *which* admin did
  // this, which is exactly the gap SSO/multi-admin auth (deferred, §20)
  // closes. Org actions logged elsewhere already carry a real per-user uid.
  void logAuditEvent({ actorUid: "admin", action: "admin.audit_viewed" });

  return NextResponse.json({
    postgresConfigured: Boolean(getDb()),
    auditEvents,
    ledgerRows,
    ledger,
  });
}
