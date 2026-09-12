import { getChatToolRuntime } from "@/lib/ai/chat-runtime";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { recordPaywallEvent } from "@/lib/ai/usage";
import { getUser, hasProAccess, type Session } from "@/lib/auth/session";

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
 * recorded so we can see how many people would have hit the wall.
 *
 * `forcePro` skips the `isProTool(slug)` lookup and gates unconditionally.
 * Use it for capabilities that cost money at a point in the pipeline the
 * chat-tool slug doesn't own — /api/media/transcribe runs the real ASR call
 * before any chat tool sees the result, and the request can arrive tagged
 * with a slug (e.g. "agent") that isn't itself marked tier:"pro".
 *
 * Known gap: the unified "agent" tool and "social-card-generator" merge in
 * the standalone `generateImage` function tool from the image generator
 * runtime (chat-runtime.ts's mergeTools), so a request tagged with either of
 * those slugs can still reach image generation without this check ever
 * seeing slug "ai-image-generator". Harmless during dark-launch (nothing is
 * blocked yet); before adding "ai-image-generator" to
 * PAYWALL_ENFORCED_TOOLS, also strip `generateImage` from those two
 * runtimes' merged tool set for accounts without Pro.
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
  void recordPaywallEvent("blocked", slug, store);
  return { allowed: false, reason: "needs_pro" };
}

export const NEEDS_PRO_MESSAGE = "You've used your free tries of this tool. Tools Pro unlocks unlimited image generation, transcription and clip-finding — upgrade to keep going.";
