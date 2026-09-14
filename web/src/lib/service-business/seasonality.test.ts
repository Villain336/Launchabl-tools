import { describe, expect, it } from "vitest";
import { isOffSeason, requestIndex, tradeSeasonNote } from "./seasonality";

describe("Piedmont seasonality", () => {
  it("treats lawn as peak in June and dormant in January", () => {
    expect(requestIndex("lawn-care", 6)).toBe(100);
    expect(requestIndex("lawn-care", 1)).toBeLessThan(15);
    expect(isOffSeason("lawn-care", 1)).toBe(true);
    expect(isOffSeason("lawn-care", 6)).toBe(false);
    expect(tradeSeasonNote("lawn-care", 1)).toMatch(/dormant/i);
    expect(tradeSeasonNote("lawn-care", 10)).toMatch(/winding down/i);
  });

  it("keeps cleaning and pest requestable through winter", () => {
    expect(requestIndex("cleaning", 1)).toBeGreaterThan(80);
    expect(isOffSeason("cleaning", 1)).toBe(false);
    expect(isOffSeason("pest-control", 1)).toBe(false);
    expect(tradeSeasonNote("pest-control", 1)).toMatch(/rodents/i);
  });

  it("marks HVAC spring and fall as membership windows, not off-season", () => {
    expect(requestIndex("hvac", 4)).toBeGreaterThanOrEqual(90);
    expect(requestIndex("hvac", 10)).toBeGreaterThanOrEqual(90);
    expect(tradeSeasonNote("hvac", 4)).toMatch(/tune-up/i);
    expect(tradeSeasonNote("hvac", 10)).toMatch(/heat/i);
  });

  it("holds courier through winter and does not treat painting as a January board", () => {
    expect(isOffSeason("courier", 1)).toBe(false);
    expect(isOffSeason("painting", 1)).toBe(true);
  });

  it("keeps appliance repair year-round and treats January gutters as off-peak", () => {
    expect(isOffSeason("appliance-repair", 1)).toBe(false);
    expect(tradeSeasonNote("appliance-repair", 1)).toMatch(/year-round/i);
    expect(isOffSeason("gutter-cleaning", 1)).toBe(true);
    expect(requestIndex("gutter-cleaning", 10)).toBe(100);
  });
});
