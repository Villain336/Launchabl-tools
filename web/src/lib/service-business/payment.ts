/**
 * Job payments — the OS system of record for money collected on a job.
 * Stripe Checkout for a specific job invoice is a later slice; this records
 * cash/check/card/other so the dashboard and job history stay honest now.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { logAuditEvent } from "@/lib/audit/log";
import { getJob } from "./job";
import { cleanText, newId, RECORD_TTL, requireOrgRole, type DomainError } from "./shared";

export const PAYMENT_METHODS = ["card", "cash", "check", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  typeof value === "string" && (PAYMENT_METHODS as readonly string[]).includes(value);

export const PAYMENT_STATUSES = ["pending", "paid", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const isPaymentStatus = (value: unknown): value is PaymentStatus =>
  typeof value === "string" && (PAYMENT_STATUSES as readonly string[]).includes(value);

export type JobPayment = {
  id: string;
  orgId: string;
  jobId: string;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  note: string;
  createdAt: string;
};

const paymentKey = (orgId: string, id: string) => `jobpay:${orgId}:${id}`;
const paymentIndexKey = (orgId: string) => `jobpay:${orgId}:all`;

export async function getPayment(orgId: string, id: string, store: KeyValueStore = getStore()): Promise<JobPayment | null> {
  const raw = await store.get(paymentKey(orgId, id));
  return raw ? (JSON.parse(raw) as JobPayment) : null;
}

export async function listPayments(orgId: string, store: KeyValueStore = getStore()): Promise<JobPayment[]> {
  const ids = await store.smembers(paymentIndexKey(orgId));
  const payments: JobPayment[] = [];
  for (const id of ids) {
    const payment = await getPayment(orgId, id, store);
    if (payment) payments.push(payment);
    else await store.srem(paymentIndexKey(orgId), id);
  }
  return payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordPayment(
  orgId: string,
  actingUid: string,
  input: { jobId?: string; amountCents?: number; method?: PaymentMethod; status?: PaymentStatus; note?: string },
  store: KeyValueStore = getStore(),
): Promise<JobPayment | DomainError> {
  const permissionError = await requireOrgRole(orgId, actingUid, ["owner", "admin", "member"], store);
  if (permissionError) return permissionError;
  const jobId = cleanText(input.jobId, 40);
  if (!jobId) return { error: "A payment needs a job." };
  if (!(await getJob(orgId, jobId, store))) return { error: "Job not found." };
  const amountCents = typeof input.amountCents === "number" ? Math.round(input.amountCents) : Number(input.amountCents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) return { error: "Enter an amount greater than zero." };

  const payment: JobPayment = {
    id: newId("pay"),
    orgId,
    jobId,
    amountCents,
    method: isPaymentMethod(input.method) ? input.method : "other",
    status: isPaymentStatus(input.status) ? input.status : "paid",
    note: cleanText(input.note, 400),
    createdAt: new Date().toISOString(),
  };
  await store.set(paymentKey(orgId, payment.id), JSON.stringify(payment), RECORD_TTL);
  await store.sadd(paymentIndexKey(orgId), payment.id, RECORD_TTL);
  await logAuditEvent({ orgId, actorUid: actingUid, action: "payment.recorded", target: payment.id, detail: { jobId, amountCents: payment.amountCents, status: payment.status } }, store);
  return payment;
}
