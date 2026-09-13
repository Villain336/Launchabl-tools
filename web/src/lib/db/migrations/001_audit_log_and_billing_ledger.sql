-- Enterprise compliance roadmap, Phase 1 (docs/STRATEGY.md §20).
--
-- Two append-only tables. Neither is ever updated in place; both are written
-- to from lib/audit/log.ts and lib/billing/ledger.ts respectively, as a
-- best-effort durable store alongside (not instead of) the existing KV
-- writes those flows already make.
--
-- Run once against a fresh database:
--   npx tsx scripts/migrate.ts
-- or paste directly into the Neon SQL editor / psql.

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  org_id TEXT,
  actor_uid TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_org_id_created_at_idx ON audit_log (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_uid_idx ON audit_log (actor_uid);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

-- One row per Stripe event that changes money-relevant state. Keyed by
-- Stripe's own event id so a webhook retry can never double-insert —
-- referential integrity that a KV counter can't offer (docs/STRATEGY.md
-- §19.4), which is exactly what an enterprise security questionnaire on
-- financial-record handling implicitly expects.
CREATE TABLE IF NOT EXISTS billing_ledger (
  id BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  uid TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount_cents BIGINT,
  currency TEXT,
  status TEXT,
  raw JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_ledger_uid_created_at_idx ON billing_ledger (uid, created_at DESC);
CREATE INDEX IF NOT EXISTS billing_ledger_kind_idx ON billing_ledger (kind);
