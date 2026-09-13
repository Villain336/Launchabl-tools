import { describe, expect, it, vi } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { designSocialCardTool, generateImageTool } from "@/lib/ai/tools/image-gen";
import { setUserBilling, upsertUser, type Session } from "@/lib/auth/session";
import { getCreditBalance, grantCredits } from "@/lib/billing/credits";
import { checkEntitlement, guardMergedImageGeneration, isProTool, PRO_TRIAL_RUNS } from "./entitlement";

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

describe("guardMergedImageGeneration", () => {
  const mergedTools = { generateImage: generateImageTool, designSocialCard: designSocialCardTool };

  it("leaves the tool set untouched for a direct ai-image-generator request", () => {
    const store = createMemoryStore();
    const result = guardMergedImageGeneration("ai-image-generator", mergedTools, null, store);
    expect(result).toBe(mergedTools);
  });

  it("passes through undefined tools and tool sets without generateImage/designSocialCard", () => {
    const store = createMemoryStore();
    expect(guardMergedImageGeneration("agent", undefined, null, store)).toBeUndefined();
    // Same tool object under a different key doesn't match the reference check by name.
    const renamed = { notGenerateImage: generateImageTool };
    expect(guardMergedImageGeneration("agent", renamed, null, store)).toBe(renamed);
  });

  it("blocks a merged generateImage call for an anonymous account without ever running the real tool", async () => {
    const store = createMemoryStore();
    const spy = vi.spyOn(generateImageTool, "execute");
    const tools = guardMergedImageGeneration("agent", mergedTools, null, store);
    expect(tools).not.toBe(mergedTools);

    await expect(tools!.generateImage.execute!({ prompt: "a red fox", aspect: "1:1", count: 1 }, { toolCallId: "t1", messages: [] } as never)).rejects.toThrow(
      /free account/i,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("checks entitlement once per guarded tool set (one request), and consumes the trial the same way a direct request would", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("agent-image@example.com", null, store);
    const session: Session = { uid: user.uid, email: user.email, name: null, iat: Date.now() };
    const env = { PAYWALL_ENFORCED_TOOLS: "*" };

    // Each simulated request builds its own guarded tool set, same as the real route does per HTTP request.
    for (let i = 0; i < PRO_TRIAL_RUNS; i++) {
      const tools = guardMergedImageGeneration("agent", mergedTools, session, store, env);
      const spy = vi.spyOn(generateImageTool, "execute").mockResolvedValue({ id: "x", prompt: "p", aspect: "1:1", model: "m", images: [], costUsd: 0 });
      await tools!.generateImage.execute!({ prompt: "p", aspect: "1:1", count: 1 }, { toolCallId: `t${i}`, messages: [] } as never);
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    }

    // Trial spent and enforced with no credits — the wrapper throws before the real tool ever runs.
    const tools = guardMergedImageGeneration("agent", mergedTools, session, store, env);
    const spy = vi.spyOn(generateImageTool, "execute");
    await expect(tools!.generateImage.execute!({ prompt: "p", aspect: "1:1", count: 1 }, { toolCallId: "tN", messages: [] } as never)).rejects.toThrow(
      /tools pro/i,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reuses a single entitlement check across several generateImage calls within the same guarded tool set", async () => {
    const store = createMemoryStore();
    const { user } = await upsertUser("agent-image-reuse@example.com", null, store);
    const session: Session = { uid: user.uid, email: user.email, name: null, iat: Date.now() };
    const tools = guardMergedImageGeneration("agent", mergedTools, session, store); // dark-launch env

    const spy = vi.spyOn(generateImageTool, "execute").mockResolvedValue({ id: "x", prompt: "p", aspect: "1:1", model: "m", images: [], costUsd: 0 });
    await tools!.generateImage.execute!({ prompt: "a", aspect: "1:1", count: 1 }, { toolCallId: "t1", messages: [] } as never);
    await tools!.generateImage.execute!({ prompt: "b", aspect: "1:1", count: 1 }, { toolCallId: "t2", messages: [] } as never);
    expect(spy).toHaveBeenCalledTimes(2);
    // Only the first call should have consumed a trial run — verified by exactly one trial slot remaining.
    expect(await checkEntitlement("ai-image-generator", session, store, { env: {} })).toEqual({ allowed: true, wouldBlock: false });
    expect(await checkEntitlement("ai-image-generator", session, store, { env: {} })).toEqual({ allowed: true, wouldBlock: true });
    spy.mockRestore();
  });

  it("only guards designSocialCard's generated-background path — the free gradient/mesh path is untouched", async () => {
    const store = createMemoryStore();
    const tools = guardMergedImageGeneration("social-card-generator", mergedTools, null, store);
    const spy = vi.spyOn(designSocialCardTool, "execute");

    const gradientSpec = {
      title: "Launch day",
      brand: { name: "Launchabl", accent: "#FF6600" as const },
      theme: "dark" as const,
      layout: "left" as const,
      background: { kind: "gradient" as const },
    };
    spy.mockResolvedValue({ ...gradientSpec, id: "c1", backgroundImage: null, backgroundModel: null, costUsd: 0 });
    await tools!.designSocialCard.execute!(gradientSpec, { toolCallId: "t1", messages: [] } as never);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();

    const generatedSpec = { ...gradientSpec, background: { kind: "generated" as const, prompt: "abstract shapes" } };
    const spy2 = vi.spyOn(designSocialCardTool, "execute");
    await expect(tools!.designSocialCard.execute!(generatedSpec, { toolCallId: "t2", messages: [] } as never)).rejects.toThrow(/free account/i);
    expect(spy2).not.toHaveBeenCalled();
    spy2.mockRestore();
  });
});
