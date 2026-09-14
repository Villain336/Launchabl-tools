import { describe, expect, it } from "vitest";
import { AGENCY_PACKAGES, LEAD_TIERS, hasNetworkSeat } from "./pricing";

describe("Build / Network / Run prices (§36)", () => {
  it("prices the DoorDash seat at $99 and includes it in Run", () => {
    expect(AGENCY_PACKAGES.launch).toMatchObject({ label: "Build", price: 1200 });
    expect(AGENCY_PACKAGES.network).toMatchObject({ label: "Network", price: 99 });
    expect(AGENCY_PACKAGES["managed-growth"]).toMatchObject({ label: "Run", price: 497 });
    expect(LEAD_TIERS.network.priceMonthly).toBe(99);
    expect(LEAD_TIERS.managed.priceMonthly).toBe(497);
  });

  it("gives pings only to Network and Run", () => {
    expect(hasNetworkSeat("network")).toBe(true);
    expect(hasNetworkSeat("managed")).toBe(true);
    expect(hasNetworkSeat("listing")).toBe(false);
    expect(hasNetworkSeat("os")).toBe(false);
    expect(hasNetworkSeat("os-plus")).toBe(false);
  });
});
