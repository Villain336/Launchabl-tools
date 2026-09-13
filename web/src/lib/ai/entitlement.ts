import type { ToolSet } from "ai";
import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { designSocialCardTool, generateImageTool } from "@/lib/ai/tools/image-gen";
import { recordPaywallEvent } from "@/lib/ai/usage";
import { getUser, hasProAccess, SIGN_IN_REQUIRED_MESSAGE, type Session } from "@/lib/auth/session";
import { spendCredit } from "@/lib/billing/credits";

/**
 * Tools Pro entitlement — parallel to `gateRun` in session.ts, but for the
 * media-cost tools (image generation, transcription, clip finding) rather
 * than the free-run-then-sign-in gate every tool already has.
 *
 * Rollout is phased through env vars so the check can ship "dark": computed
 * and counted on every request, but never actually blocking anyone, until
 * PAYWALL_ENFORCED_TOOLS says otherwise.
 *
 *   PAYWALL_ENFORCED_TOOLS unset or empty → dark-launch: pro tools are
 *     checked (and a would-have-blocked shadow metric is recorded) but every
 *     request is allowed through.
 *   PAYWALL_ENFORCED_TOOLS="*" → enforce for every tool tagged tier:"pro".
 *   PAYWALL_ENFORCED_TOOLS="transcriber,clip-finder" → enforce only those
 *     slugs; anything else tagged pro stays dark-launched.
 */

export const PRO_TRIAL_RUNS = 2;
const TRIAL_TTL_SECONDS = 400 * 24 * 60 * 60;

export function isProTool(slug: string): boolean {
  return getChatToolRuntime(slug)?.tier === "pro";
}

export function paywallEnforced(slug: string, env: Record<string, string | undefined> = process.env): boolean {
  const raw = env.PAYWALL_ENFORCED_TOOLS?.trim();
  if (!raw) return false;
  if (raw === "*") return true;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(slug);
}

export type EntitlementDecision =
  | { allowed: true; wouldBlock: false }
  /** Dark-launch: this request would have been blocked once enforcement is on, but isn't blocked now. */
  | { allowed: true; wouldBlock: true }
  /** No subscription and the trial's spent, but a purchased credit pack covered this one run. */
  | { allowed: true; wouldBlock: false; spentCredit: true; creditsLeft: number }
  | { allowed: false; reason: "sign_in_required" }
  | { allowed: false; reason: "needs_pro" };

async function trialRunsUsed(uid: string, slug: string, store: KeyValueStore): Promise<number> {
  return (await store.hgetall(`protrial:${uid}`))[slug] ?? 0;
}

/**
 * Decide whether this account may run a pro-tier tool. Free tools always
 * pass. Anonymous visitors need to sign in first (same message the
 * free-run gate uses). Signed-in accounts get PRO_TRIAL_RUNS free tries per
 * tool so the paywall doesn't ambush someone on their first-ever use, then
 * need an active subscription — or, while the tool isn't in
 * PAYWALL_ENFORCED_TOOLS yet, they're waved through with a shadow metric
 * recorded so we can see how many people would have hit the wall. Once
 * enforcement is actually on and there's no subscription, a purchased
 * credit pack (lib/billing/credits.ts) is spent one run at a time before
 * finally falling back to `needs_pro`.
 *
 * `forcePro` skips the `isProTool(slug)` lookup and gates unconditionally.
 * Use it for capabilities that cost money at a point in the pipeline the
 * chat-tool slug doesn't own — /api/media/transcribe runs the real ASR call
 * before any chat tool sees the result, and the request can arrive tagged
 * with a slug (e.g. "agent") that isn't itself marked tier:"pro". The same
 * reason is why `guardMergedImageGeneration` below exists: the unified
 * "agent" tool and "social-card-generator" both reach real image generation
 * through tools that aren't tagged "ai-image-generator" either.
 */
export async function checkEntitlement(
  slug: string,
  session: Session | null,
  store: KeyValueStore = getStore(),
  opts: { forcePro?: boolean; env?: Record<string, string | undefined> } = {},
): Promise<EntitlementDecision> {
  if (!opts.forcePro && !isProTool(slug)) return { allowed: true, wouldBlock: false };
  if (!session) return { allowed: false, reason: "sign_in_required" };

  const user = await getUser(session.uid, store);
  if (hasProAccess(user)) return { allowed: true, wouldBlock: false };

  const used = await trialRunsUsed(session.uid, slug, store);
  if (used < PRO_TRIAL_RUNS) {
    await store.hincrby(`protrial:${session.uid}`, { [slug]: 1 }, TRIAL_TTL_SECONDS);
    void recordPaywallEvent("trial_started", slug, store);
    return { allowed: true, wouldBlock: false };
  }

  if (!paywallEnforced(slug, opts.env ?? process.env)) {
    void recordPaywallEvent("shadow_blocked", slug, store);
    return { allowed: true, wouldBlock: true };
  }

  const creditsLeft = await spendCredit(session.uid, store);
  if (creditsLeft !== null) return { allowed: true, wouldBlock: false, spentCredit: true, creditsLeft };

  void recordPaywallEvent("blocked", slug, store);
  return { allowed: false, reason: "needs_pro" };
}

export const NEEDS_PRO_MESSAGE =
  "You've used your free tries of this tool. Subscribe to Tools Pro for unlimited use, or buy a credit pack to keep going a few runs at a time.";

/**
 * Two runtimes reach real image generation without ever being checked
 * under slug "ai-image-generator":
 *
 *   - The unified "agent" tool merges in every specialist's function tools
 *     (chat-runtime.ts / agent.ts's mergeTools), including the standalone
 *     `generateImage` tool from the image generator runtime.
 *   - "social-card-generator" ships its own `generateImage` tool for the
 *     same reason, and its own `designSocialCard` tool additionally calls
 *     the underlying image model directly when `background.kind ===
 *     "generated"`.
 *
 * Both are harmless while `ai-image-generator` is only ever dark-launched
 * or unenforced (nothing blocks yet either way), but must be closed before
 * enforcing it for real — otherwise anyone can route around the paywall by
 * asking the agent (or the card designer) to make an image instead of
 * using the image generator tool directly.
 *
 * This wraps the exact shared tool instances (by reference, so it never
 * touches an unrelated same-named tool) with a lazy, per-request-memoised
 * check against slug "ai-image-generator" — run at most once per request,
 * the moment (if ever) the model actually tries to generate an image, so a
 * conversation that never touches image generation never spends a trial
 * run or records a shadow-block for it. `designSocialCard` is only guarded
 * when the input actually asks for a generated background; the free
 * gradient/mesh path is untouched.
 */
export function guardMergedImageGeneration(
  slug: string,
  tools: ToolSet | undefined,
  session: Session | null,
  store: KeyValueStore = getStore(),
  env: Record<string, string | undefined> = process.env,
): ToolSet | undefined {
  if (!tools || slug === "ai-image-generator") return tools;

  let decision: EntitlementDecision | null = null;
  const ensureEntitled = async (): Promise<void> => {
    decision ??= await checkEntitlement("ai-image-generator", session, store, { forcePro: true, env });
    if (!decision.allowed) {
      throw new Error(decision.reason === "sign_in_required" ? SIGN_IN_REQUIRED_MESSAGE : NEEDS_PRO_MESSAGE);
    }
  };

  const guarded: ToolSet = { ...tools };
  let changed = false;

  if (tools.generateImage === generateImageTool) {
    changed = true;
    guarded.generateImage = {
      ...generateImageTool,
      execute: async (input, options) => {
        await ensureEntitled();
        return generateImageTool.execute!(input, options);
      },
    };
  }

  if (tools.designSocialCard === designSocialCardTool) {
    changed = true;
    guarded.designSocialCard = {
      ...designSocialCardTool,
      execute: async (input, options) => {
        if (input.background.kind === "generated") await ensureEntitled();
        return designSocialCardTool.execute!(input, options);
      },
    };
  }

  return changed ? guarded : tools;
}
