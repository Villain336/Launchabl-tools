/**
 * Client-safe Tools Pro display constants. Kept separate from
 * lib/billing/stripe.ts (which pulls in the server-only "stripe" SDK) so
 * this can be imported from client components without bundling that.
 */

export type BillingInterval = "month" | "year";

export const TOOLS_PRO_PRICE_USD: Record<BillingInterval, number> = { month: 17, year: 130 };

export const TOOLS_PRO_TOOLS = ["AI Image Generator", "Transcriber", "Clip Finder"] as const;

/**
 * Credit packs — a one-time-payment alternative to the Tools Pro
 * subscription for people who hit the free-trial wall on a pro tool but
 * don't want a recurring plan. One credit = one gated tool run, spent
 * automatically by entitlement.ts before it would otherwise block a request.
 * See docs/STRATEGY.md §13.7/§15 for how this fits the phased rollout.
 */
export type CreditPackId = "starter" | "growth";

export const CREDIT_PACKS: Record<CreditPackId, { credits: number; priceUsd: number; label: string }> = {
  starter: { credits: 20, priceUsd: 9, label: "20 credits" },
  growth: { credits: 100, priceUsd: 35, label: "100 credits" },
};

export const CREDIT_PACK_IDS = Object.keys(CREDIT_PACKS) as CreditPackId[];

export function isCreditPackId(value: unknown): value is CreditPackId {
  return typeof value === "string" && value in CREDIT_PACKS;
}

/** Effective price per credit, for the "better value" hint in the UI. */
export function perCreditUsd(pack: CreditPackId): number {
  const { credits, priceUsd } = CREDIT_PACKS[pack];
  return priceUsd / credits;
}
