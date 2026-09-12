/**
 * Client-safe Tools Pro display constants. Kept separate from
 * lib/billing/stripe.ts (which pulls in the server-only "stripe" SDK) so
 * this can be imported from client components without bundling that.
 */

export type BillingInterval = "month" | "year";

export const TOOLS_PRO_PRICE_USD: Record<BillingInterval, number> = { month: 17, year: 130 };

export const TOOLS_PRO_TOOLS = ["AI Image Generator", "Transcriber", "Clip Finder"] as const;
