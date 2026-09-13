/**
 * Published packages for the three-legged model.
 * Launch is the $1,200 descendant. Managed Growth and OS lead-volume
 * tiers are the starting published prices so the marketplace can sell
 * without a custom quote on every conversation.
 */
export const LEAD_TIERS = {
  listing: { id: "listing", label: "Listing", monthlyLeads: 5, priceMonthly: 0 },
  os: { id: "os", label: "OS", monthlyLeads: 25, priceMonthly: 49 },
  "os-plus": { id: "os-plus", label: "OS Plus", monthlyLeads: 80, priceMonthly: 149 },
  managed: { id: "managed", label: "Managed Growth", monthlyLeads: 200, priceMonthly: 497 },
} as const;

export type LeadTierId = keyof typeof LEAD_TIERS;

export const isLeadTierId = (value: unknown): value is LeadTierId => typeof value === "string" && value in LEAD_TIERS;

export const AGENCY_PACKAGES = {
  launch: { id: "launch", label: "Launch", price: 1200, cadence: "one-time" as const },
  "managed-growth": { id: "managed-growth", label: "Managed Growth", price: 497, cadence: "monthly" as const },
} as const;
