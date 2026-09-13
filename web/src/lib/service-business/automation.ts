/**
 * Org-scoped OS automations — lead follow-up, review request, job reminder,
 * warranty reminder. Distinct from `/automations` (SEO/tool-report
 * schedules). These fire themselves via `/api/cron/os-automations`.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { siteConfig } from "@/lib/site-config";
import { canDeliver, sendOrgAlert, type AlertDeps, type AlertSendResult } from "./alerts";
import { resolveAlertSettings } from "./alerts";
import { listJobs } from "./job";
import { listLeadsForOrg } from "./lead";
import { listServiceBusinessProfiles } from "./profile";
import { getWarranty, listWarrantiesDueSoon } from "./warranty";
import { newId, readMinutes, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const AUTOMATION_KINDS = ["lead_followup", "review_request", "job_reminder", "warranty_reminder"] as const;
export type AutomationKind = (typeof AUTOMATION_KINDS)[number];
export const isAutomationKind = (value: unknown): value is AutomationKind =>
  typeof value === "string" && (AUTOMATION_KINDS as readonly string[]).includes(value);

export const AUTOMATION_KIND_LABELS: Record<AutomationKind, string> = {
  lead_followup: "Lead follow-up",
  review_request: "Review request after a completed job",
  job_reminder: "Upcoming job reminder",
  warranty_reminder: "Warranty / maintenance due",
};

export type AutomationRule = {
  id: string;
  orgId: string;
  kind: AutomationKind;
  enabled: boolean;
  delayHours: number;
  createdAt: string;
  updatedAt: string;
};

export type AutomationRun = {
  id: string;
  orgId: string;
  ruleId: string;
  kind: AutomationKind;
  entityId: string;
  entityType: "lead" | "job" | "warranty";
  title: string;
  body: string;
  result: AlertSendResult;
  createdAt: string;
};

const ruleKey = (orgId: string, id: string) => `osauto:${orgId}:${id}`;
const ruleIndexKey = (orgId: string) => `osauto:${orgId}:all`;
const orgIndexKey = () => "osauto:orgs";
const runKey = (orgId: string, id: string) => `osautorun:${orgId}:${id}`;
const runIndexKey = (orgId: string) => `osautorun:${orgId}:all`;
const claimKey = (orgId: string, ruleId: string, entityId: string) => `osautorun:${orgId}:${ruleId}:${entityId}`;

const DEFAULT_DELAY: Record<AutomationKind, number> = {
  lead_followup: 24,
  review_request: 48,
  job_reminder: 24,
  warranty_reminder: 0,
};

export async function getAutomationRule(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<AutomationRule | null> {
  const raw = await store.get(ruleKey(orgId, id));
  return raw ? (JSON.parse(raw) as AutomationRule) : null;
}

export async function listAutomationRules(orgId: string, store: KeyValueStore = getStore()): Promise<AutomationRule[]> {
  const ids = await store.smembers(ruleIndexKey(orgId));
  const rules: AutomationRule[] = [];
  for (const id of ids) {
    const rule = await getAutomationRule(orgId, id, store);
    if (rule) rules.push(rule);
    else await store.srem(ruleIndexKey(orgId), id);
  }
  return rules.sort((a, b) => a.kind.localeCompare(b.kind));
}

export async function listAutomationRuns(orgId: string, store: KeyValueStore = getStore()): Promise<AutomationRun[]> {
  const ids = await store.smembers(runIndexKey(orgId));
  const runs: AutomationRun[] = [];
  for (const id of ids) {
    const raw = await store.get(runKey(orgId, id));
    if (raw) runs.push(JSON.parse(raw) as AutomationRun);
    else await store.srem(runIndexKey(orgId), id);
  }
  return runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertAutomationRule(
  orgId: string,
  actingUid: string,
  input: { id?: string; kind?: AutomationKind; enabled?: boolean; delayHours?: number },
  store: KeyValueStore = getStore(),
): Promise<AutomationRule | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin"], store);
  if (permissionError) return permissionError;
  const existing = input.id ? await getAutomationRule(orgId, input.id, store) : null;
  if (input.id && !existing) return { error: "Automation not found." };
  const kind = input.kind && isAutomationKind(input.kind) ? input.kind : existing?.kind;
  if (!kind) return { error: "Pick what this automation should do." };
  const now = new Date().toISOString();
  const rule: AutomationRule = {
    id: existing?.id ?? newId("auto"),
    orgId,
    kind,
    enabled: input.enabled !== undefined ? Boolean(input.enabled) : (existing?.enabled ?? true),
    delayHours: input.delayHours !== undefined ? readMinutes(input.delayHours, existing?.delayHours ?? DEFAULT_DELAY[kind], 24 * 30) : (existing?.delayHours ?? DEFAULT_DELAY[kind]),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await store.set(ruleKey(orgId, rule.id), JSON.stringify(rule), RECORD_TTL);
  await store.sadd(ruleIndexKey(orgId), rule.id, RECORD_TTL);
  await store.sadd(orgIndexKey(), orgId, RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "automation.updated", target: rule.id, detail: { kind: rule.kind, enabled: rule.enabled } }, store);
  return rule;
}

function hoursBetween(fromIso: string, to: Date): number {
  const from = Date.parse(fromIso);
  if (!Number.isFinite(from)) return Number.POSITIVE_INFINITY;
  return (to.getTime() - from) / 3_600_000;
}

type Candidate = { entityId: string; entityType: AutomationRun["entityType"]; title: string; body: string };

async function candidatesFor(rule: AutomationRule, now: Date, store: KeyValueStore): Promise<Candidate[]> {
  if (rule.kind === "lead_followup") {
    const leads = await listLeadsForOrg(rule.orgId, store);
    return leads
      .filter((lead) => lead.status === "new" && !lead.held && hoursBetween(lead.createdAt, now) >= rule.delayHours)
      .map((lead) => ({
        entityId: lead.id,
        entityType: "lead" as const,
        title: `Follow up with ${lead.name}`,
        body: `${lead.name} asked about ${lead.trade} in ${lead.city}${lead.description ? ` — ${lead.description}` : ""}. Still new after ${rule.delayHours} hours.`,
      }));
  }
  if (rule.kind === "review_request") {
    const jobs = await listJobs(rule.orgId, store);
    return jobs
      .filter((job) => job.status === "completed" && hoursBetween(job.updatedAt, now) >= rule.delayHours)
      .map((job) => {
        const origin = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
        const link = job.reviewToken ? `${origin}/review/${job.reviewToken}` : null;
        return {
          entityId: job.id,
          entityType: "job" as const,
          title: `Ask for a review — ${job.title}`,
          body: link
            ? `${job.title} was completed. Send this private review link — it only works because the job is done: ${link}`
            : `${job.title} was completed. Mark it completed in the OS to mint a review link. We do not invent stars.`,
        };
      });
  }
  if (rule.kind === "job_reminder") {
    const jobs = await listJobs(rule.orgId, store);
    return jobs
      .filter((job) => {
        if (job.status !== "scheduled" || !job.scheduledFor) return false;
        const hoursUntil = -hoursBetween(job.scheduledFor, now);
        return hoursUntil >= 0 && hoursUntil <= rule.delayHours;
      })
      .map((job) => ({
        entityId: job.id,
        entityType: "job" as const,
        title: `Upcoming job — ${job.title}`,
        body: `${job.title} is scheduled for ${job.scheduledFor}${job.address ? ` at ${job.address}` : ""}. Drive time ${job.driveMinutes} min, on site ${job.durationMinutes} min.`,
      }));
  }
  const warranties = await listWarrantiesDueSoon(rule.orgId, store, now.toISOString().slice(0, 10));
  return warranties
    .filter((record) => !record.lastRemindedAt)
    .map((record) => ({
      entityId: record.id,
      entityType: "warranty" as const,
      title: `Warranty due — ${record.coverage}`,
      body: `${record.coverage} coverage ends ${record.endOn}. Book the maintenance visit.`,
    }));
}

async function recordRun(run: AutomationRun, store: KeyValueStore): Promise<void> {
  await store.set(runKey(run.orgId, run.id), JSON.stringify(run), RECORD_TTL);
  await store.sadd(runIndexKey(run.orgId), run.id, RECORD_TTL);
}

export async function runAutomationRules(
  orgId: string,
  now = new Date(),
  store: KeyValueStore = getStore(),
  deps: AlertDeps = {},
): Promise<AutomationRun[]> {
  const settings = await resolveAlertSettings(orgId, store);
  if (!canDeliver(settings)) return [];
  const rules = (await listAutomationRules(orgId, store)).filter((rule) => rule.enabled);
  const fired: AutomationRun[] = [];
  for (const rule of rules) {
    const candidates = await candidatesFor(rule, now, store);
    for (const candidate of candidates) {
      const claimed = await store.setNx(claimKey(orgId, rule.id, candidate.entityId), now.toISOString(), RECORD_TTL);
      if (!claimed) continue;
      const result = await sendOrgAlert(orgId, { title: candidate.title, body: candidate.body }, store, deps);
      const run: AutomationRun = {
        id: newId("run"),
        orgId,
        ruleId: rule.id,
        kind: rule.kind,
        entityId: candidate.entityId,
        entityType: candidate.entityType,
        title: candidate.title,
        body: candidate.body,
        result,
        createdAt: now.toISOString(),
      };
      await recordRun(run, store);
      if (rule.kind === "warranty_reminder") {
        await stampWarrantyReminded(orgId, candidate.entityId, now.toISOString(), store);
      }
      fired.push(run);
    }
  }
  return fired;
}

/**
 * Warranty writes require an org member. The cron doesn't have one, so the
 * reminder stamp is written directly after a successful claim.
 */
export async function stampWarrantyReminded(orgId: string, warrantyId: string, at: string, store: KeyValueStore = getStore()): Promise<void> {
  const existing = await getWarranty(orgId, warrantyId, store);
  if (!existing) return;
  const updated = { ...existing, lastRemindedAt: at, updatedAt: at };
  await store.set(`warranty:${orgId}:${warrantyId}`, JSON.stringify(updated), RECORD_TTL);
}

export async function runDueAutomations(now = new Date(), store: KeyValueStore = getStore(), deps: AlertDeps = {}): Promise<AutomationRun[]> {
  const fromIndex = await store.smembers(orgIndexKey());
  const profiles = await listServiceBusinessProfiles(store);
  const orgIds = Array.from(new Set([...fromIndex, ...profiles.map((profile) => profile.orgId)]));
  const fired: AutomationRun[] = [];
  for (const orgId of orgIds) {
    fired.push(...(await runAutomationRules(orgId, now, store, deps)));
  }
  return fired;
}

export function describeAutomation(kind: AutomationKind): string {
  return AUTOMATION_KIND_LABELS[kind];
}
