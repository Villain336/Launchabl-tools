/**
 * Piedmont NC request-frequency indexes by calendar month (§35).
 * 100 = that trade's own peak month, not "as busy as lawn in July."
 * Used to pick hunt order, page copy, and to keep dispatch GMV out of
 * the winter floor. Not a forecast of Launchabl volume.
 */
import { TRADE_LABELS, type Trade } from "./profile";

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type Month = (typeof MONTHS)[number];

export const isMonth = (value: unknown): value is Month => typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12;

export function calendarMonth(at: Date = new Date()): Month {
  return (at.getUTCMonth() + 1) as Month;
}

/**
 * Household / shop *request* intensity in the Piedmont. Agency Launch
 * demand often moves the other way (crews have time in the off-season).
 */
export const REQUEST_INDEX: Record<Trade, readonly [number, number, number, number, number, number, number, number, number, number, number, number]> = {
  "lawn-care": [8, 5, 45, 85, 95, 100, 100, 95, 80, 55, 25, 8],
  cleaning: [90, 90, 95, 90, 88, 85, 85, 90, 90, 90, 88, 75],
  hvac: [70, 68, 90, 95, 100, 100, 100, 95, 85, 95, 95, 75],
  "pest-control": [75, 72, 80, 90, 95, 100, 100, 95, 90, 90, 85, 78],
  "appliance-repair": [85, 80, 75, 70, 70, 75, 80, 75, 70, 75, 80, 88],
  "mobile-detailing": [40, 45, 80, 95, 100, 95, 90, 85, 80, 70, 45, 35],
  "gutter-cleaning": [20, 25, 70, 85, 50, 30, 25, 30, 80, 100, 70, 25],
  "junk-removal": [55, 55, 70, 85, 75, 70, 70, 90, 80, 70, 60, 50],
  courier: [80, 80, 82, 82, 82, 80, 78, 80, 82, 85, 90, 88],
  "roadside-assistance": [70, 65, 55, 55, 80, 60, 85, 60, 55, 55, 80, 85],
  towing: [70, 65, 55, 55, 80, 60, 85, 60, 55, 55, 80, 85],
  "pressure-washing": [15, 20, 80, 95, 90, 70, 55, 50, 70, 75, 35, 15],
  "parking-lot": [10, 10, 25, 50, 70, 80, 85, 80, 70, 55, 25, 10],
  plumbing: [80, 75, 60, 55, 55, 60, 65, 60, 55, 55, 60, 75],
  electrical: [55, 55, 60, 65, 70, 70, 70, 70, 65, 60, 55, 55],
  painting: [10, 15, 40, 75, 85, 90, 90, 85, 80, 60, 25, 10],
};

export function requestIndex(trade: Trade, month: Month = calendarMonth()): number {
  return REQUEST_INDEX[trade][month - 1];
}

export function isOffSeason(trade: Trade, month: Month = calendarMonth(), threshold = 35): boolean {
  return requestIndex(trade, month) < threshold;
}

export function tradeSeasonNote(trade: Trade, month: Month = calendarMonth()): string {
  const index = requestIndex(trade, month);
  const label = TRADE_LABELS[trade];
  if (trade === "lawn-care") {
    if (month >= 12 || month <= 2) {
      return "Mowing is dormant in the Piedmont. Leaf leftover or a March route — not a Saturday cut.";
    }
    if (month === 10 || month === 11) {
      return "Weekly cuts are winding down. Leaf, fescue overseed, and a spring book are the job.";
    }
    if (month === 3) {
      return "First cuts are back. This is when a lawn board can start proving itself.";
    }
  }
  if (trade === "hvac") {
    if (month >= 3 && month <= 5) return "Spring AC / heat-pump tune-up window. The membership is the money, not the first 90° no-cool.";
    if (month >= 9 && month <= 11) return "Fall heat tune-up window. Sell the plan now; emergency heat is the overflow.";
  }
  if (trade === "pest-control" && (month >= 10 || month <= 2)) {
    return "Outdoor routes slow; rodents move inside. Quarterly plans do not freeze.";
  }
  if (trade === "appliance-repair") {
    return "Washers and fridges die year-round. This board does not freeze with the grass.";
  }
  if (trade === "mobile-detailing" && (month >= 11 || month <= 2)) {
    return "Wash memberships slow in the Piedmont winter. The page is for the spring book, not this week's van.";
  }
  if (trade === "gutter-cleaning") {
    if (month === 10 || month === 11) return "Leaf season. Gutters and dryer vents are the job; windows if the pollen wait is over.";
    if (month >= 3 && month <= 4) return "Spring gutter and window pass after pollen. Book it; do not wait for October overflow.";
  }
  if (trade === "courier") {
    return "Shops and parts counters, not food bags. Volume holds in winter when lawn does not.";
  }
  if ((trade === "roadside-assistance" || trade === "towing") && (month === 11 || month === 12 || month === 5 || month === 7)) {
    return "Holiday-travel spike in the world. AAA still owns most household calls.";
  }
  if (index < 35) {
    return `${label} is off-peak in the Piedmont this month. A listing here is for the next season, not this week's board.`;
  }
  return `${label} is in season in the Piedmont. First crew to claim still owns the job.`;
}
