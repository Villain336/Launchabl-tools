import Stripe from "stripe";
import type { BillingInterval, CreditPackId } from "@/lib/billing/plan-display";

/**
 * Stripe client and Tools Pro plan config. Server-only (pulls in the Stripe
 * SDK) — client components needing the display price should import from
 * lib/billing/plan-display.ts instead.
 *
 * One product (Tools Pro), two prices (monthly/yearly), plus one-time prices
 * for credit packs — all created once via the Stripe CLI/dashboard and
 * referenced by id here. This module never creates products or prices
 * itself, only checkout/portal sessions and webhook verification.
 */

export type { BillingInterval };

let client: Stripe | null | undefined;

export function stripeConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

/** Lazily constructed, cached singleton — null when STRIPE_SECRET_KEY isn't set (billing routes should 503). */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key) : null;
  return client;
}

export function priceIdFor(interval: BillingInterval, env: Record<string, string | undefined> = process.env): string | null {
  return (interval === "year" ? env.STRIPE_PRICE_PRO_YEARLY : env.STRIPE_PRICE_PRO_MONTHLY) ?? null;
}

const CREDIT_PACK_ENV_KEYS: Record<CreditPackId, string> = {
  starter: "STRIPE_PRICE_CREDITS_STARTER",
  growth: "STRIPE_PRICE_CREDITS_GROWTH",
};

export function priceIdForCreditPack(pack: CreditPackId, env: Record<string, string | undefined> = process.env): string | null {
  return env[CREDIT_PACK_ENV_KEYS[pack]] ?? null;
}

export function webhookSecret(env: Record<string, string | undefined> = process.env): string | null {
  return env.STRIPE_WEBHOOK_SECRET ?? null;
}

export const BILLING_UNCONFIGURED = "Billing is not configured on this deployment.";
