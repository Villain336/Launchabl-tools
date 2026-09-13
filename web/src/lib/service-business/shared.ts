import { getUser, type OrgRole } from "@/lib/auth/session";
import { getOrg } from "@/lib/orgs/org";
import type { KeyValueStore } from "@/lib/ai/store";

export const RECORD_TTL = 3 * 365 * 24 * 60 * 60;

export type DomainError = { error: string };

export function newId(prefix: string, bytes = 9): string {
  return `${prefix}_${Buffer.from(crypto.getRandomValues(new Uint8Array(bytes))).toString("base64url")}`;
}

export const cleanText = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");

export function cleanList(value: unknown, max: number, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const cleaned = item.replace(/\s+/g, " ").trim();
    if (cleaned && out.length < limit) out.push(cleaned.slice(0, max));
  }
  return out;
}

export const cleanUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value.trim()).toString();
  } catch {
    return null;
  }
};

export async function requireOrgRole(
  orgId: string,
  actingUid: string,
  allowedRoles: OrgRole[],
  store: KeyValueStore,
): Promise<null | DomainError> {
  const org = await getOrg(orgId, store);
  if (!org) return { error: "Org not found." };
  const actor = await getUser(actingUid, store);
  if (!actor || actor.orgId !== orgId || !actor.orgRole || !allowedRoles.includes(actor.orgRole)) {
    return { error: "You don't have permission to do that." };
  }
  return null;
}

export function currentPeriod(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function readMinutes(value: unknown, fallback: number, max = 24 * 60): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, Math.round(n));
}

export function readCents(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

export function dateOnly(value: unknown): string {
  const text = cleanText(value, 40);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) return "";
  return new Date(parsed).toISOString().slice(0, 10);
}
