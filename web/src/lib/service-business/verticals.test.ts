import { describe, expect, it } from "vitest";
import { TRADES } from "./profile";
import { AGENCY_VERTICAL_GROUPS, LISTED_OPEN_DEMAND_TRADES, UNLISTED_AGENCY_VERTICALS } from "./verticals";

describe("agency verticals (§37)", () => {
  it("lists the first three no-platform asks and keeps the rest off TRADES", () => {
    expect(AGENCY_VERTICAL_GROUPS.map((group) => group.id)).toEqual(["home-services", "open-demand", "local-care"]);
    expect([...LISTED_OPEN_DEMAND_TRADES]).toEqual(["appliance-repair", "mobile-detailing", "gutter-cleaning"]);
    for (const slug of LISTED_OPEN_DEMAND_TRADES) {
      expect((TRADES as readonly string[]).includes(slug)).toBe(true);
    }
    for (const slug of UNLISTED_AGENCY_VERTICALS) {
      expect((TRADES as readonly string[]).includes(slug)).toBe(false);
    }
  });
});
