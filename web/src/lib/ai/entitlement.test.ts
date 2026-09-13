import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { setUserBilling, upsertUser, type Session } from "@/lib/auth/session";
import { getCreditBalance, grantCredits } from "@/lib/billing/credits";
import { checkEntitlement, isProTool, PRO_TRIAL_RUNS } from "./entitlement";

const PRO_SLUG = "ai-image-generator";
const FREE_SLUG = "qr-code-generator";

function sessionFor(uid: string, email: string): Session {
  return { uid, email, name: null, iat: Date.now() };
}

describe("isProTool", () => {
  it("tags exactly the media-cost tools", () => {
    expect(isProTool("ai-image-generator")).toBe(true);
    expect(isProTool("transcriber")).toBe(true);
    expect(isProTool("clip-finder")).toBe(true);
    expect(isProTool("qr-code-generator")).toBe(false);
    expect(isProTool("social-card-generator")).toBe(false);
    expect(isProTool("agent")).toBe(false);
  });
});

describe("checkEntitlement", () => {
  it("always allows free tools, anonymous or signed in, without touching the store", async () => {
    const store = createMemoryStore();
    const anon = await checkEntitlement(FREE_SLUG, null, store);
    expect(anon).toEqual({ allowed: true, wouldBlock: false });

    const { user } = await upsertUser("free@example.com", null, store);
    const signedIn = await checkEntitlement(FREE_SLUG, sessionFor(user.uid, user.email), store);
    expect(signedIn).toEqual({ allowed: true, wouldBlock: false });
  });

  it("requires sign-in for a pro tool", async () => {
    const store = createMemoryStore();
    const decision = await checkEntitlement(PRO_SLUG, null, store);
    expect(decision).toEqual({ allowed: false, reason: "sign_in_required" });
  });

  it("gives a signed-in account PRO_TRIAL_RUNS free tries, then dark-launches (allowed, shadow-blocked) with no PAYWALL_ENFORCED_TOOLS set", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("trial@example.com", null, store);
    const session = sessionFor(user.uid, user.email);

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) {
      const decision = await checkEntitlement(PRO_SLUG, session, store, { env: {} });
      expect(decision).toEqual({ allowed: true, wouldBlock: false });
    }

    const afterTrial = await checkEntitlement(PRO_SLUG, session, store, { env: {} });
    expect(afterTrial).toEqual({ allowed: true, wouldBlock: true });
  });

  it("blocks once the tool is in PAYWALL_ENFORCED_TOOLS and the trial is spent", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("enforced@example.com", null, store);
    const session = sessionFor(user.uid, user.email);

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) {
      await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: PRO_SLUG } });
    }

    const blocked = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: PRO_SLUG } });
    expect(blocked).toEqual({ allowed: false, reason: "needs_pro" });

    // "*" enforces every pro tool, not just the ones named explicitly.
    const blockedByWildcard = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(blockedByWildcard).toEqual({ allowed: false, reason: "needs_pro" });

    // A different tool named in the list stays enforced; one that isn't stays dark-launched.
    const otherToolStillDark = await checkEntitlement("transcriber", session, store, { env: { PAYWALL_ENFORCED_TOOLS: PRO_SLUG } });
    expect(otherToolStillDark.allowed).toBe(true);
  });

  it("lets an active Tools Pro subscriber through unconditionally, trial or not", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("pro@example.com", null, store);
    await setUserBilling(user.uid, { stripeCustomerId: "cus_123", subscriptionStatus: "active", planInterval: "month" }, store);
    const session = sessionFor(user.uid, user.email);

    const decision = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(decision).toEqual({ allowed: true, wouldBlock: false });
  });

  it("treats a canceled subscriber like a free account again", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("canceled@example.com", null, store);
    await setUserBilling(user.uid, { stripeCustomerId: "cus_456", subscriptionStatus: "active", planInterval: "month" }, store);
    await setUserBilling(user.uid, { subscriptionStatus: "canceled" }, store);
    const session = sessionFor(user.uid, user.email);

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) await checkEntitlement(PRO_SLUG, session, store, { env: {} });
    const decision = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(decision).toEqual({ allowed: false, reason: "needs_pro" });
  });

  it("spends a purchased credit as a fallback once enforced and the trial is spent, then blocks once credits run out", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("credits@example.com", null, store);
    const session = sessionFor(user.uid, user.email);
    await grantCredits(user.uid, 2, store);

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });

    const first = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(first).toEqual({ allowed: true, wouldBlock: false, spentCredit: true, creditsLeft: 1 });

    const second = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(second).toEqual({ allowed: true, wouldBlock: false, spentCredit: true, creditsLeft: 0 });

    const blocked = await checkEntitlement(PRO_SLUG, session, store, { env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(blocked).toEqual({ allowed: false, reason: "needs_pro" });
    expect(await getCreditBalance(user.uid, store)).toBe(0);
  });

  it("doesn't spend credits during dark-launch — only once the tool is actually enforced", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("darklaunch@example.com", null, store);
    const session = sessionFor(user.uid, user.email);
    await grantCredits(user.uid, 5, store);

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) await checkEntitlement(PRO_SLUG, session, store, { env: {} });
    const decision = await checkEntitlement(PRO_SLUG, session, store, { env: {} });
    expect(decision).toEqual({ allowed: true, wouldBlock: true });
    expect(await getCreditBalance(user.uid, store)).toBe(5);
  });

  it("forcePro gates a tool that isn't tagged tier: pro, keyed by whatever pseudo-slug is passed", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("media@example.com", null, store);
    const session = sessionFor(user.uid, user.email);
    const pseudoSlug = "media-transcribe";

    expect(isProTool(pseudoSlug)).toBe(false);
    // Without forcePro, an untagged slug always passes.
    expect(await checkEntitlement(pseudoSlug, session, store)).toEqual({ allowed: true, wouldBlock: false });

    for (let i = 0; i < PRO_TRIAL_RUNS; i++) {
      const decision = await checkEntitlement(pseudoSlug, session, store, { forcePro: true, env: {} });
      expect(decision.allowed).toBe(true);
    }
    const blocked = await checkEntitlement(pseudoSlug, session, store, { forcePro: true, env: { PAYWALL_ENFORCED_TOOLS: "*" } });
    expect(blocked).toEqual({ allowed: false, reason: "needs_pro" });
  });
});
