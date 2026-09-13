/**
 * Official profit model for the NC service OS + marketplace (§35).
 * Agency cash is the floor. Dispatch take is a later bonus on paid
 * first jobs only. Calendar routes stay take-free. Seasonality lives
 * in `seasonality.ts` so winter GMV cannot be stuffed into this floor.
 */
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";

export const PROFIT_MODEL = {
  launchUsd: AGENCY_PACKAGES.launch.price,
  managedUsd: AGENCY_PACKAGES["managed-growth"].price,
  osUsd: LEAD_TIERS.os.priceMonthly,
  networkUsd: LEAD_TIERS.network.priceMonthly,
  osPlusUsd: LEAD_TIERS["os-plus"].priceMonthly,
  listingUsd: LEAD_TIERS.listing.priceMonthly,
  /** GreenPal-shaped. $0 in code until the gates below are true. */
  dispatchTakeRate: 0.05,
  stripeRate: 0.029,
  minClaimingCrews: 3,
  minPaidDispatchJobsPerMonth: 20,
  /** Three Managed retainers = the documented micro-business floor (§30.2). */
  winterFloorManagedCount: 3,
  /** Ten Managed retainers = a company, without counting take-rate. */
  companyScaleManagedCount: 10,
} as const;

export type DispatchTakeGate = {
  claimingCrews: number;
  paidDispatchJobsThisMonth: number;
};

export function canChargeDispatchTake(gate: DispatchTakeGate): boolean {
  return gate.claimingCrews >= PROFIT_MODEL.minClaimingCrews && gate.paidDispatchJobsThisMonth >= PROFIT_MODEL.minPaidDispatchJobsPerMonth;
}

/** What we actually keep on a paid dispatch job *after* the gates. Calendar bookings are always 0. */
export function dispatchTakeUsd(ticketUsd: number, gate: DispatchTakeGate): number {
  if (!canChargeDispatchTake(gate) || ticketUsd <= 0) return 0;
  return Math.round(ticketUsd * PROFIT_MODEL.dispatchTakeRate * 100) / 100;
}

export function managedMrrUsd(managedCount: number): number {
  return Math.max(0, managedCount) * PROFIT_MODEL.managedUsd;
}

export function launchCashUsd(launchesClosed: number): number {
  return Math.max(0, launchesClosed) * PROFIT_MODEL.launchUsd;
}

export function osMrrUsd(osCount: number, osPlusCount = 0): number {
  return Math.max(0, osCount) * PROFIT_MODEL.osUsd + Math.max(0, osPlusCount) * PROFIT_MODEL.osPlusUsd;
}

export function networkMrrUsd(networkCount: number): number {
  return Math.max(0, networkCount) * PROFIT_MODEL.networkUsd;
}

/**
 * Cash we may spend on ads + Twilio this month.
 * Never outrun Run + Network retainers + Build closed *this month*.
 * Desk OS and take-rate are not in the cap.
 */
export function monthlySpendCapUsd(input: {
  managedCount: number;
  launchesClosedThisMonth: number;
  networkCount?: number;
}): number {
  return managedMrrUsd(input.managedCount) + networkMrrUsd(input.networkCount ?? 0) + launchCashUsd(input.launchesClosedThisMonth);
}

export function winterFloorUsd(managedCount = PROFIT_MODEL.winterFloorManagedCount): number {
  return managedMrrUsd(managedCount);
}

export type ProfitLine = "floor" | "growth" | "bonus";

export function lineForRevenue(kind: "launch" | "managed" | "network" | "os" | "dispatch-take" | "calendar-booking"): ProfitLine {
  if (kind === "launch" || kind === "managed" || kind === "network") return "floor";
  if (kind === "os") return "growth";
  return "bonus";
}
