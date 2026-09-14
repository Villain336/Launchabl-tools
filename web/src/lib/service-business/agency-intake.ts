/**
 * Persist agency intake and notify the founder. Email is best-effort —
 * a missing Resend key must not drop the request we already stored.
 */
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { formatAgencyIntakeEmail, parseAgencyIntake, type AgencyIntake, type AgencyIntakeDraft } from "./agency-model";

const RECORD_TTL = 60 * 60 * 24 * 90;
const INTAKE_INDEX = "agency:intake:ids";

export type AgencyIntakeRecord = AgencyIntake & { id: string; createdAt: string };

export type AgencyIntakeDeps = {
  email?: (to: string, subject: string, body: string) => Promise<boolean>;
};

function intakeKey(id: string): string {
  return `agency:intake:${id}`;
}

async function sendResendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const from = process.env.AUTH_EMAIL_FROM ?? "Launchabl <hello@launchabl.io>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text: `${body}\n\n— Launchabl agency` }),
    signal: AbortSignal.timeout(8_000),
  });
  return res.ok;
}

export async function submitAgencyIntake(
  input: AgencyIntakeDraft,
  store: KeyValueStore = getStore(),
  deps: AgencyIntakeDeps = {},
): Promise<{ ok: true; id: string } | { error: string }> {
  const parsed = parseAgencyIntake(input);
  if (!parsed.ok) return { error: parsed.error };

  const id = crypto.randomUUID();
  const record: AgencyIntakeRecord = { id, ...parsed.intake, createdAt: new Date().toISOString() };
  await store.set(intakeKey(id), JSON.stringify(record), RECORD_TTL);
  await store.sadd(INTAKE_INDEX, id, RECORD_TTL);

  const { subject, body } = formatAgencyIntakeEmail(parsed.intake);
  const to = process.env.AGENCY_INTAKE_TO ?? "hello@launchabl.io";
  const send = deps.email ?? sendResendEmail;
  await send(to, subject, body);

  return { ok: true, id };
}

export async function getAgencyIntake(id: string, store: KeyValueStore = getStore()): Promise<AgencyIntakeRecord | null> {
  const raw = await store.get(intakeKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AgencyIntakeRecord;
  } catch {
    return null;
  }
}
