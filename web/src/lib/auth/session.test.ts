import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import {
  ANON_COOKIE,
  ANON_DAILY_RUNS_PER_IP,
  ANON_FREE_RUNS,
  SESSION_COOKIE,
  gateRun,
  authStats,
  issueCode,
  normalizeSignUpSource,
  readSession,
  sessionCookie,
  signPayload,
  upsertUser,
  verifyCode,
  verifyPayload,
} from "./session";

function jar(cookies: Record<string, string> = {}) {
  return {
    get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined),
  };
}

/** Pull `name=value` out of a Set-Cookie header. */
function cookieValue(setCookie: string): string {
  return setCookie.split(";")[0].split("=").slice(1).join("=");
}

describe("signed payloads", () => {
  it("round-trips and rejects tampering", async () => {
    const token = await signPayload({ hello: "world" });
    expect(await verifyPayload<{ hello: string }>(token)).toEqual({ hello: "world" });
    const [body, sig] = token.split(".");
    expect(await verifyPayload(`${body}x.${sig}`)).toBeNull();
    expect(await verifyPayload(`${body}.${sig.slice(0, -1)}A`)).toBeNull();
    expect(await verifyPayload("")).toBeNull();
    expect(await verifyPayload("nodot")).toBeNull();
  });

  it("reads a session cookie back", async () => {
    const cookie = await sessionCookie({ uid: "u1", email: "a@b.co", name: "A", iat: Date.now() });
    expect(cookie).toContain("HttpOnly");
    const session = await readSession(jar({ [SESSION_COOKIE]: cookieValue(cookie) }));
    expect(session?.uid).toBe("u1");
    expect(session?.email).toBe("a@b.co");
  });

  it("expires old sessions", async () => {
    const cookie = await sessionCookie({ uid: "u1", email: "a@b.co", name: null, iat: Date.now() - 200 * 24 * 3600 * 1000 });
    expect(await readSession(jar({ [SESSION_COOKIE]: cookieValue(cookie) }))).toBeNull();
  });
});

describe("gateRun", () => {
  it("gives an anonymous visitor exactly ANON_FREE_RUNS, then requires sign-in", async () => {
    const store = createMemoryStore();
    const first = await gateRun(jar(), "1.2.3.4", store);
    expect(first.allowed).toBe(true);
    if (first.allowed) expect(first.kind).toBe("anon");
    expect(first.setCookies).toHaveLength(1);
    const anon = cookieValue(first.setCookies[0]);

    for (let i = 1; i < ANON_FREE_RUNS; i++) {
      const next = await gateRun(jar({ [ANON_COOKIE]: anon }), "1.2.3.4", store);
      expect(next.allowed).toBe(true);
    }
    const blocked = await gateRun(jar({ [ANON_COOKIE]: anon }), "1.2.3.4", store);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.reason).toBe("sign_in_required");
    expect(blocked.setCookies).toHaveLength(0);
  });

  it("caps cookie-clearing visitors per IP per day", async () => {
    const store = createMemoryStore();
    for (let i = 0; i < ANON_DAILY_RUNS_PER_IP; i++) {
      const decision = await gateRun(jar(), "9.9.9.9", store);
      expect(decision.allowed).toBe(true);
    }
    const blocked = await gateRun(jar(), "9.9.9.9", store);
    expect(blocked.allowed).toBe(false);
    const other = await gateRun(jar(), "9.9.9.10", store);
    expect(other.allowed).toBe(true);
  });

  it("lets signed-in users through without counting", async () => {
    const store = createMemoryStore();
    const cookie = await sessionCookie({ uid: "u1", email: "a@b.co", name: null, iat: Date.now() });
    for (let i = 0; i < 5; i++) {
      const decision = await gateRun(jar({ [SESSION_COOKIE]: cookieValue(cookie) }), "1.1.1.1", store);
      expect(decision.allowed).toBe(true);
      if (decision.allowed) expect(decision.kind).toBe("user");
    }
  });
});

describe("users and codes", () => {
  it("upserts by normalized email and tracks sign-ups", async () => {
    const store = createMemoryStore();
    const a = await upsertUser("  Jane@Example.com ", "Jane", store);
    expect(a.created).toBe(true);
    expect(a.user.email).toBe("jane@example.com");
    const b = await upsertUser("jane@example.com", null, store);
    expect(b.created).toBe(false);
    expect(b.user.name).toBe("Jane");
    expect(b.user.signIns).toBe(2);
    expect(await store.smembers("users:all")).toHaveLength(1);
  });

  it("records where a sign-up came from, normalised, and reports it by source", async () => {
    const store = createMemoryStore();
    expect(normalizeSignUpSource("template:Launch-Page")).toBe("template:launch-page");
    expect(normalizeSignUpSource("tool:seo-audit")).toBe("tool:seo-audit");
    expect(normalizeSignUpSource("weird value; drop")).toBeNull();
    expect(normalizeSignUpSource(42)).toBeNull();
    await upsertUser("a@example.com", null, store, "template:launch-page");
    await upsertUser("b@example.com", null, store, "template:launch-page");
    await upsertUser("c@example.com", null, store, "tool:seo-audit");
    await upsertUser("a@example.com", null, store, "tool:seo-audit"); // returning sign-in: not a sign-up
    const stats = await authStats(1, store);
    expect(stats.users).toBe(3);
    expect(stats.byDay[0].signUps).toBe(3);
    expect(stats.signUpsBySource).toEqual({ "template:launch-page": 2, "tool:seo-audit": 1 });
  });

  it("verifies a one-time code once and rejects wrong codes", async () => {
    const store = createMemoryStore();
    const code = await issueCode("jane@example.com", store);
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyCode("jane@example.com", "000000", store)).toBe(false);
    expect(await verifyCode("jane@example.com", code, store)).toBe(true);
    expect(await verifyCode("jane@example.com", code, store)).toBe(false);
  });
});
