import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { recordCreditEvent } from "@/lib/ai/usage";
import { CREDIT_PACKS, type CreditPackId } from "@/lib/billing/plan-display";

/**
 * Credit ledger — a one-time-payment alternative to the Tools Pro
 * subscription for accounts that hit the pro-tool trial wall but don't
 * want a recurring plan. One credit buys one pro-tier tool run;
 * entitlement.ts spends one as a fallback before it would otherwise block
 * a request. See docs/STRATEGY.md §13.7/§15 for how this fits the phased
 * rollout (dark-launch → subscription-only → credit packs).
 *
 * Balances are a plain integer counter per uid in the shared store, using
 * the atomic decrIfAtLeast primitive (lib/ai/store.ts) so two concurrent
 * requests can't both spend the same last credit.
 */

const creditsKey = (uid: string) => `credits:${uid}`;

export async function getCreditBalance(uid: string, store: KeyValueStore = getStore()): Promise<number> {
  return store.getCounter(creditsKey(uid));
}

/** Add credits to a balance directly, bypassing pack pricing — e.g. a manual grant or refund reversal. */
export async function grantCredits(uid: string, amount: number, store: KeyValueStore = getStore()): Promise<number> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`grantCredits: amount must be a positive number, got ${amount}`);
  return store.incrBy(creditsKey(uid), Math.round(amount));
}

/**
 * Applied by the Stripe webhook when a credit-pack checkout session
 * completes. Records the purchase (credits + revenue) for the admin
 * dashboard alongside the balance update.
 */
export async function grantCreditPack(uid: string, pack: CreditPackId, store: KeyValueStore = getStore()): Promise<number> {
  const { credits, priceUsd } = CREDIT_PACKS[pack];
  const balance = await grantCredits(uid, credits, store);
  void recordCreditEvent("purchased", { pack, amount: credits, revenueUsd: priceUsd }, store);
  return balance;
}

/**
 * Spend one credit if the balance allows it, atomically. Returns the new
 * balance, or `null` if there wasn't at least one credit (no change made).
 * Used by entitlement.ts as a fallback before blocking a pro-tier request
 * for an account without an active subscription.
 */
export async function spendCredit(uid: string, store: KeyValueStore = getStore()): Promise<number | null> {
  const next = await store.decrIfAtLeast(creditsKey(uid), 1);
  if (next !== null) void recordCreditEvent("spent", {}, store);
  return next;
}
