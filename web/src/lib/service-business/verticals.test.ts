import { describe, expect, it } from "vitest";
import { TRADES } from "./profile";
import { AGENCY_VERTICAL_GROUPS, UNLISTED_AGENCY_VERTICALS } from "./verticals";

describe("agency verticals (§37)", () => {
  it("sells no-platform demand without minting empty city trades", () => {
    expect(AGENCY_VERTICAL_GROUPS.map((group) => group.id)).toEqual(["home-services", "open-demand", "local-care"]);
    const open = AGENCY_VERTICAL_GROUPS.find((group) => group.id === "open-demand");
    expect(open?.examples).toContain("Appliance repair");
    expect(open?.examples).toContain("Mobile detailing");
    for (const slug of UNLISTED_AGENCY_VERTICALS) {
      expect((TRADES as readonly string[]).includes(slug)).toBe(false);
    }
  });
});
