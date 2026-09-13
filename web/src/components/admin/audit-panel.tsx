"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/lib/audit/log";
import type { LedgerRow, LedgerSummary } from "@/lib/billing/ledger";

type AuditPayload = { postgresConfigured: boolean; auditEvents: AuditLogEntry[]; ledgerRows: LedgerRow[]; ledger: LedgerSummary | null };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const money = (cents: number | null, currency: string | null) => (cents === null ? "—" : `${(cents / 100).toFixed(2)} ${(currency ?? "usd").toUpperCase()}`);

/**
 * Admin action + org action audit log, and the Postgres billing ledger —
 * Enterprise compliance roadmap Phase 1 (docs/STRATEGY.md §20). Works with
 * zero setup (the KV recent-activity cache); once DATABASE_URL is
 * configured, the same panel starts showing the durable Postgres record —
 * see the banner below when it isn't configured yet.
 */
export function AuditPanel({ token }: { token: string }) {
  const [data, setData] = useState<AuditPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/audit", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const body = (await response.json()) as AuditPayload & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
      setData(body);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't load the audit log.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white" data-audit-panel>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            Audit log &amp; billing ledger
          </h2>
          <p className="text-xs text-muted-foreground">
            Admin/org actions and Stripe events, table stakes for a security questionnaire (§20).
            {data && !data.postgresConfigured && (
              <span className="text-amber-600"> DATABASE_URL isn&apos;t configured — showing the KV recent-activity cache, not the durable record.</span>
            )}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error && <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</p>}

      {!data ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-border sm:border-r sm:border-b-0">
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              Recent audit events <span className="ml-2 font-normal">({data.auditEvents.length})</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {data.auditEvents.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No audit events recorded yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {data.auditEvents.map((event) => (
                      <tr key={event.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{when(event.createdAt)}</td>
                        <td className="px-2 py-2 font-medium text-foreground">{event.action}</td>
                        <td className="max-w-[10rem] truncate px-2 py-2 text-muted-foreground" title={event.actorUid}>
                          {event.actorUid}
                        </td>
                        <td className="max-w-[10rem] truncate px-2 py-2 text-muted-foreground" title={event.target ?? ""}>
                          {event.target ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <div className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
              Billing ledger
              {data.ledger && (
                <span className="ml-2 font-normal">
                  ({data.ledger.rows} row{data.ledger.rows === 1 ? "" : "s"})
                </span>
              )}
            </div>
            {!data.postgresConfigured ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Set <code>DATABASE_URL</code> to start recording a durable, reconciliation-ready ledger of Stripe events alongside KV.
              </p>
            ) : data.ledgerRows.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No ledger rows yet — they&apos;ll appear as Stripe events arrive.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {data.ledgerRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{when(row.createdAt)}</td>
                        <td className="px-2 py-2 font-medium text-foreground">{row.kind}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{money(row.amountCents, row.currency)}</td>
                        <td className="px-2 py-2 text-muted-foreground">{row.status ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
