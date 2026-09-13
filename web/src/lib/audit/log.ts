/**
 * Admin action + org action audit log (Enterprise compliance roadmap,
 * Phase 1 — `docs/STRATEGY.md` §20). Table stakes for any security
 * questionnaire once there's more than one admin or more than one seat per
 * account (§14.3/§14.4).
 *
 * Dual-write, same pattern as the billing ledger (`lib/billing/ledger.ts`)
 * and consistent with how this codebase already treats KV vs. Postgres
 * (§19.4): a capped recent-activity list stays in KV so the admin dashboard
 * always has something to show with zero setup, and every event is also
 * best-effort written to the durable `audit_log` Postgres table (when
 * `DATABASE_URL` is configured) as the actual, queryable, long-retention
 * compliance record. A Postgres write failure is logged and swallowed —
 * this must never be able to break the action being audited.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { getDb } from "@/lib/db/client";

export type AuditAction =
  | "org.created"
  | "org.renamed"
  | "org.deleted"
  | "org.member_invited"
  | "org.invite_revoked"
  | "org.member_joined"
  | "org.member_role_changed"
  | "org.member_removed"
  | "org.member_left"
  | "admin.usage_viewed"
  | "admin.audit_viewed";

export type AuditEvent = {
  /** Null/omitted for actions not scoped to an org (e.g. an admin-dashboard view). */
  orgId?: string | null;
  actorUid: string;
  action: AuditAction;
  /** The uid, email, invite token, or other id the action was performed on. */
  target?: string;
  detail?: Record<string, unknown>;
};

export type AuditLogEntry = AuditEvent & { id: string; createdAt: string };

const RECENT_KEY = "audit:recent";
const RECENT_LIMIT = 200;
const RECENT_TTL_SECONDS = 400 * 24 * 60 * 60;

async function appendRecent(entry: AuditLogEntry, store: KeyValueStore): Promise<void> {
  // Read-modify-write, not atomic — an occasional lost entry under two
  // near-simultaneous writes is acceptable for a "recent activity" cache;
  // the durable, queryable record of truth is the Postgres table below.
  const raw = await store.get(RECENT_KEY);
  const list: AuditLogEntry[] = raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  list.unshift(entry);
  await store.set(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)), RECENT_TTL_SECONDS);
}

async function writeDurable(entry: AuditLogEntry): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    await db`
      INSERT INTO audit_log (id, org_id, actor_uid, action, target, detail, created_at)
      VALUES (${entry.id}, ${entry.orgId ?? null}, ${entry.actorUid}, ${entry.action}, ${entry.target ?? null}, ${entry.detail ? JSON.stringify(entry.detail) : null}, ${entry.createdAt})
    `;
  } catch (err) {
    console.warn(`[audit/log] failed to persist ${entry.action} (${entry.id}) to Postgres:`, err instanceof Error ? err.message : err);
  }
}

export async function logAuditEvent(event: AuditEvent, store: KeyValueStore = getStore()): Promise<void> {
  const entry: AuditLogEntry = { ...event, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await Promise.all([appendRecent(entry, store), writeDurable(entry)]);
}

/**
 * Recent audit events for the admin dashboard. Reads Postgres when it's
 * configured (the durable, queryable record — supports `orgId` filtering);
 * falls back to the capped KV cache otherwise, which is unfiltered and
 * best-effort, but means the panel isn't blank in an environment with no
 * database configured yet.
 */
export async function listAuditEvents(limit = 100, orgId?: string, store: KeyValueStore = getStore()): Promise<AuditLogEntry[]> {
  const db = getDb();
  if (db) {
    try {
      const rows = orgId
        ? await db`SELECT id, org_id, actor_uid, action, target, detail, created_at FROM audit_log WHERE org_id = ${orgId} ORDER BY created_at DESC LIMIT ${limit}`
        : await db`SELECT id, org_id, actor_uid, action, target, detail, created_at FROM audit_log ORDER BY created_at DESC LIMIT ${limit}`;
      return rows.map((row) => ({
        id: String(row.id),
        orgId: row.org_id as string | null,
        actorUid: String(row.actor_uid),
        action: row.action as AuditAction,
        target: (row.target as string | null) ?? undefined,
        detail: (row.detail as Record<string, unknown> | null) ?? undefined,
        createdAt: new Date(row.created_at as string).toISOString(),
      }));
    } catch (err) {
      console.warn("[audit/log] failed to read audit_log from Postgres, falling back to the KV cache:", err instanceof Error ? err.message : err);
    }
  }
  const raw = await store.get(RECENT_KEY);
  const list: AuditLogEntry[] = raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
  return (orgId ? list.filter((e) => e.orgId === orgId) : list).slice(0, limit);
}
