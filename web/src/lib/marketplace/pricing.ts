/**
 * Published packages for Build + Network + Run (§36).
 * Network is the DoorDash seat — a monthly price to receive pings.
 * Run includes Network. Listing is a brochure and cannot claim.
 */
export const LEAD_TIERS = {
  listing: { id: "listing", label: "Listing", monthlyLeads: 5, priceMonthly: 0 },
  os: { id: "os", label: "OS desk", monthlyLeads: 25, priceMonthly: 49 },
  network: { id: "network", label: "Network", monthlyLeads: 40, priceMonthly: 99 },
  "os-plus": { id: "os-plus", label: "OS Plus", monthlyLeads: 80, priceMonthly: 149 },
  managed: { id: "managed", label: "Run", monthlyLeads: 200, priceMonthly: 497 },
} as const;

export type LeadTierId = keyof typeof LEAD_TIERS;

export const isLeadTierId = (value: unknown): value is LeadTierId => typeof value === "string" && value in LEAD_TIERS;

/** Who gets DoorDash pings. OS desk alone does not. Run includes this. */
export const NETWORK_SEAT_TIERS: readonly LeadTierId[] = ["network", "managed"];

export function hasNetworkSeat(tier: LeadTierId): boolean {
  return (NETWORK_SEAT_TIERS as readonly string[]).includes(tier);
}

export const AGENCY_PACKAGES = {
  launch: { id: "launch", label: "Build", price: 1200, cadence: "one-time" as const },
  network: { id: "network", label: "Network", price: 99, cadence: "monthly" as const },
  "managed-growth": { id: "managed-growth", label: "Run", price: 497, cadence: "monthly" as const },
} as const;
