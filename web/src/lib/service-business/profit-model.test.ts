import { describe, expect, it } from "vitest";
import {
  PROFIT_MODEL,
  canChargeDispatchTake,
  dispatchTakeUsd,
  lineForRevenue,
  monthlySpendCapUsd,
  winterFloorUsd,
} from "./profit-model";

describe("official profit model", () => {
  it("keeps agency prices as the floor and dispatch take at 5% only after gates", () => {
    expect(PROFIT_MODEL.launchUsd).toBe(1200);
    expect(PROFIT_MODEL.managedUsd).toBe(497);
    expect(PROFIT_MODEL.dispatchTakeRate).toBe(0.05);
    expect(winterFloorUsd()).toBe(1491);

    const closed = { claimingCrews: 2, paidDispatchJobsThisMonth: 40 };
    expect(canChargeDispatchTake(closed)).toBe(false);
    expect(dispatchTakeUsd(55, closed)).toBe(0);

    const open = { claimingCrews: 3, paidDispatchJobsThisMonth: 20 };
    expect(canChargeDispatchTake(open)).toBe(true);
    expect(dispatchTakeUsd(55, open)).toBe(2.75);
  });

  it("caps ads and Twilio at this month's Managed + Launch, and never takes calendar bookings", () => {
    expect(monthlySpendCapUsd({ managedCount: 3, launchesClosedThisMonth: 1 })).toBe(1491 + 1200);
    expect(monthlySpendCapUsd({ managedCount: 0, launchesClosedThisMonth: 0 })).toBe(0);
    expect(lineForRevenue("managed")).toBe("floor");
    expect(lineForRevenue("os")).toBe("growth");
    expect(lineForRevenue("dispatch-take")).toBe("bonus");
    expect(lineForRevenue("calendar-booking")).toBe("bonus");
  });
});
