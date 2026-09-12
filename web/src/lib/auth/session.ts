import { getStore, type KeyValueStore } from "@/lib/ai/store";

/**
 * Accounts and the anonymous free run.
 *
 * Sessions are HMAC-signed cookies (no DB round-trip to read them); users
 * and one-time codes live in the shared key-value store. Sign-in is email
 * based: when RESEND_API_KEY is set a 6-digit code is emailed and required,
 * otherwise the email alone opens the account (soft gate — good enough to
 * capture the lead, and it upgrades to verified sign-in with one env var).
 *
 * This module is the single integration point: swapping in Clerk or another
 * provider means reimplementing `readSession` and the sign-in route only.
 */

export const SESSION_COOKIE = "lb_session";
export const ANON_COOKIE = "lb_anon";
export const ANON_FREE_RUNS = 1;
/** Cookie-clearing shouldn't buy unlimited free runs from one network. */
export const ANON_DAILY_RUNS_PER_IP = 5;
const SESSION_TTL_SECONDS = 180 * 24 * 60 * 60;
const ANON_TTL_SECONDS = 365 * 24 * 60 * 60;

export type Session = { uid: string; email: string; name: string | null; iat: number };
export type UserRecord = { uid: string; email: string; name: string | null; createdAt: string; lastSeenAt: string; signIns: number; source?: string };

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.AUTH_SECRET ?? process.env.ADMIN_TOKEN;
  if (!s) {
    if (process.env.NODE_ENV === "production") console.warn("[auth] AUTH_SECRET is not set; sessions use an insecure fallback secret");
    return "launchabl-dev-secret-change-me";
  }
  return s;
}

const b64url = (bytes: ArrayBuffer | Uint8Array) => Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString("base64url");
const fromB64url = (s: string) => Buffer.from(s, "base64url");

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

export async function signPayload(payload: unknown): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function verifyPayload<T>(token: string | undefined | null): Promise<T | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(body);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    return JSON.parse(fromB64url(body).toString("utf8")) as T;
  } catch {
    return null;
  }
}

export async function emailHash(email: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(email.trim().toLowerCase()));
  return b64url(digest).slice(0, 22);
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && email.length <= 254;

/* ── cookies ─────────────────────────────────────────── */

type CookieJar = { get(name: string): { value: string } | undefined };

function cookieAttrs(maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
}

export async function sessionCookie(session: Session): Promise<string> {
  return `${SESSION_COOKIE}=${await signPayload(session)}; ${cookieAttrs(SESSION_TTL_SECONDS)}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; ${cookieAttrs(0)}`;
}

export async function readSession(cookies: CookieJar): Promise<Session | null> {
  const session = await verifyPayload<Session>(cookies.get(SESSION_COOKIE)?.value);
  if (!session || typeof session.uid !== "string" || typeof session.email !== "string") return null;
  if (Date.now() - session.iat > SESSION_TTL_SECONDS * 1000) return null;
  return session;
}

/* ── users ───────────────────────────────────────────── */

/**
 * Where a sign-up came from, e.g. `template:launch`, `tool:seo-audit`,
 * `report:agent`, `page:sign-in`. Free-form from the client, so it's
 * normalised to a short `kind:id` token before it becomes a hash field.
 */
export function normalizeSignUpSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = /^([a-z]{2,16}):([a-z0-9][a-z0-9-]{0,40})$/.exec(value.trim().toLowerCase());
  return match ? `${match[1]}:${match[2]}` : null;
}

export async function upsertUser(
  email: string,
  name: string | null,
  store: KeyValueStore = getStore(),
  source: string | null = null,
): Promise<{ user: UserRecord; created: boolean }> {
  const normalized = normalizeEmail(email);
  const uid = await emailHash(normalized);
  const key = `user:${uid}`;
  const now = new Date().toISOString();
  const existing = await store.get(key);
  const day = now.slice(0, 10);
  if (existing) {
    const prev = JSON.parse(existing) as UserRecord;
    const user: UserRecord = { ...prev, name: name ?? prev.name, lastSeenAt: now, signIns: prev.signIns + 1 };
    await store.set(key, JSON.stringify(user));
    await store.hincrby(`auth:${day}`, { signIns: 1 }, 400 * 24 * 60 * 60);
    return { user, created: false };
  }
  const user: UserRecord = { uid, email: normalized, name, createdAt: now, lastSeenAt: now, signIns: 1, source: source ?? undefined };
  await store.set(key, JSON.stringify(user));
  await store.sadd("users:all", uid);
  const fields: Record<string, number> = { signUps: 1, signIns: 1 };
  if (source) fields[`src:${source}`] = 1;
  await store.hincrby(`auth:${day}`, fields, 400 * 24 * 60 * 60);
  return { user, created: true };
}

export async function getUser(uid: string, store: KeyValueStore = getStore()): Promise<UserRecord | null> {
  const raw = await store.get(`user:${uid}`);
  return raw ? (JSON.parse(raw) as UserRecord) : null;
}

export type AuthStats = {
  users: number;
  byDay: { date: string; signUps: number; signIns: number }[];
  /** Sign-ups in the window keyed by source token (`template:launch`, `tool:seo-audit`, …), largest first. */
  signUpsBySource: Record<string, number>;
};

export async function authStats(days: number, store: KeyValueStore = getStore()): Promise<AuthStats> {
  const users = (await store.smembers("users:all")).length;
  const byDay: AuthStats["byDay"] = [];
  const sources: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const h = await store.hgetall(`auth:${date}`);
    byDay.push({ date, signUps: h.signUps ?? 0, signIns: h.signIns ?? 0 });
    for (const [field, value] of Object.entries(h)) {
      if (field.startsWith("src:")) sources[field.slice(4)] = (sources[field.slice(4)] ?? 0) + value;
    }
  }
  const signUpsBySource = Object.fromEntries(Object.entries(sources).sort((a, b) => b[1] - a[1]));
  return { users, byDay, signUpsBySource };
}

/* ── one-time codes (only when an email sender is configured) ── */

export function emailCodesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export async function issueCode(email: string, store: KeyValueStore = getStore()): Promise<string> {
  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  await store.set(`authcode:${await emailHash(email)}`, await hmac(code), 10 * 60);
  return code;
}

export async function verifyCode(email: string, code: string, store: KeyValueStore = getStore()): Promise<boolean> {
  const key = `authcode:${await emailHash(email)}`;
  const stored = await store.get(key);
  if (!stored) return false;
  const attempts = await store.incr(`${key}:tries`, 10 * 60);
  if (attempts > 6) return false;
  const ok = stored === (await hmac(code.trim()));
  if (ok) await store.del(key);
  return ok;
}

export async function sendCodeEmail(email: string, code: string): Promise<void> {
  const from = process.env.AUTH_EMAIL_FROM ?? "Launchabl <hello@launchabl.io>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [email],
      subject: `${code} is your Launchabl sign-in code`,
      text: `Your sign-in code is ${code}. It expires in 10 minutes.\n\nIf you didn't request it, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
}

/* ── anonymous free run ──────────────────────────────── */

export type AnonState = { anonId: string; runsUsed: number; setCookie: string | null };

export async function readOrCreateAnon(cookies: CookieJar): Promise<AnonState> {
  const existing = await verifyPayload<{ id: string }>(cookies.get(ANON_COOKIE)?.value);
  if (existing?.id) return { anonId: existing.id, runsUsed: 0, setCookie: null };
  const id = b64url(crypto.getRandomValues(new Uint8Array(12)));
  return { anonId: id, runsUsed: 0, setCookie: `${ANON_COOKIE}=${await signPayload({ id })}; ${cookieAttrs(ANON_TTL_SECONDS)}` };
}

export type GateDecision =
  | { allowed: true; kind: "user"; session: Session; setCookies: string[] }
  | { allowed: true; kind: "anon"; runsUsed: number; runsLeft: number; setCookies: string[] }
  | { allowed: false; reason: "sign_in_required"; setCookies: string[] };

/**
 * Decide whether this request may start a model run. Anonymous visitors get
 * ANON_FREE_RUNS in total (cookie) and at most ANON_DAILY_RUNS_PER_IP per
 * network per day; the run is counted when allowed.
 */
export async function gateRun(cookies: CookieJar, ip: string, store: KeyValueStore = getStore()): Promise<GateDecision> {
  const session = await readSession(cookies);
  if (session) return { allowed: true, kind: "user", session, setCookies: [] };
  const anon = await readOrCreateAnon(cookies);
  const setCookies = anon.setCookie ? [anon.setCookie] : [];
  const day = new Date().toISOString().slice(0, 10);
  const used = (await store.hgetall(`anon:${anon.anonId}`)).runs ?? 0;
  const ipUsed = (await store.hgetall(`anonip:${ip}:${day}`)).runs ?? 0;
  if (used >= ANON_FREE_RUNS || ipUsed >= ANON_DAILY_RUNS_PER_IP) return { allowed: false, reason: "sign_in_required", setCookies };
  await store.hincrby(`anon:${anon.anonId}`, { runs: 1 }, ANON_TTL_SECONDS);
  await store.hincrby(`anonip:${ip}:${day}`, { runs: 1 }, 2 * 24 * 60 * 60);
  return { allowed: true, kind: "anon", runsUsed: used + 1, runsLeft: ANON_FREE_RUNS - used - 1, setCookies };
}

export const SIGN_IN_REQUIRED_MESSAGE = "You've used your free run. Create a free account to keep going — it takes ten seconds and unlocks every tool.";
