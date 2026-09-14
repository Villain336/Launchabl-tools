import { describe, expect, it } from "vitest";
import { createMemoryStore } from "@/lib/ai/store";
import { UNLISTED_AGENCY_VERTICALS } from "./verticals";
import { submitAgencyIntake, getAgencyIntake } from "./agency-intake";
import {
  AGENCY_INTAKE_VERTICALS,
  AGENCY_MODEL,
  AGENCY_WONT,
  BUILD_SEQUENCE,
  REPLY_KIT,
  WINTER_HUNT,
  canOpenCityTradeBoard,
  intakeVerticalIsUnlisted,
  networkPriceAfterBuild,
  networkSeatIncludedWithBuild,
  parseAgencyIntake,
  willSellRun,
} from "./agency-model";

describe("agency operating model (§38)", () => {
  it("includes 90 days of Network with Build, then $99, and refunds if not live in 14 days", () => {
    expect(AGENCY_MODEL.buildUsd).toBe(1200);
    expect(AGENCY_MODEL.networkUsd).toBe(99);
    expect(AGENCY_MODEL.runUsd).toBe(497);
    expect(AGENCY_MODEL.buildSlaDays).toBe(14);
    expect(AGENCY_MODEL.buildIncludesNetworkDays).toBe(90);
    expect(AGENCY_MODEL.guarantee).toMatch(/14 days/i);
    expect(AGENCY_MODEL.guarantee).toMatch(/refunded/i);

    expect(networkPriceAfterBuild(0)).toBe(0);
    expect(networkPriceAfterBuild(89)).toBe(0);
    expect(networkSeatIncludedWithBuild(89)).toBe(true);
    expect(networkPriceAfterBuild(90)).toBe(99);
    expect(networkSeatIncludedWithBuild(90)).toBe(false);
    expect(networkPriceAfterBuild(-1)).toBe(99);
  });

  it("does not open a city×trade board or sell Run on hope", () => {
    expect(canOpenCityTradeBoard(2)).toBe(false);
    expect(canOpenCityTradeBoard(3)).toBe(true);
    expect(willSellRun(false)).toBe(false);
    expect(willSellRun(true)).toBe(true);
    expect(AGENCY_MODEL.proof.name).toBe("Atlas Lot Care");
    expect(REPLY_KIT.rule).toMatch(/do not scrape/i);
    expect(AGENCY_WONT.some((line) => /scrape/i.test(line))).toBe(true);
    expect(BUILD_SEQUENCE).toHaveLength(4);
    expect(WINTER_HUNT[0]).toBe("cleaning");
    expect(WINTER_HUNT[1]).toBe("appliance-repair");
  });

  it("rejects thin intake and keeps clinic/hood verticals off the public trade list", () => {
    expect(parseAgencyIntake({}).ok).toBe(false);
    expect(parseAgencyIntake({ name: "Sam", businessName: "Sam's Clean", email: "not-an-email", city: "Greensboro", vertical: "cleaning", offer: "build" }).ok).toBe(
      false,
    );
    const ok = parseAgencyIntake({
      name: "Sam Lee",
      businessName: "Sam's Clean Co",
      email: "sam@example.com",
      city: "Greensboro",
      vertical: "cleaning",
      offer: "run",
      notes: "Already on Nextdoor.",
    });
    expect(ok).toEqual({
      ok: true,
      intake: expect.objectContaining({ email: "sam@example.com", offer: "run", vertical: "cleaning" }),
    });
    expect(INTAKE_HAS_UNLISTED()).toBe(true);
    expect(intakeVerticalIsUnlisted("kitchen-hood")).toBe(true);
    expect(intakeVerticalIsUnlisted("cleaning")).toBe(false);
  });

  it("stores intake even when email sending is a no-op", async () => {
    const store = createMemoryStore();
    const emailed: string[] = [];
    const result = await submitAgencyIntake(
      {
        name: "Sam Lee",
        businessName: "Sam's Clean Co",
        email: "sam@example.com",
        city: "Greensboro",
        vertical: "appliance-repair",
        offer: "build",
      },
      store,
      { email: async (_to, subject) => {
          emailed.push(subject);
          return true;
        } },
    );
    if ("error" in result) throw new Error(result.error);
    const saved = await getAgencyIntake(result.id, store);
    expect(saved?.businessName).toBe("Sam's Clean Co");
    expect(saved?.vertical).toBe("appliance-repair");
    expect(emailed[0]).toMatch(/Sam's Clean Co/);
  });
});

function INTAKE_HAS_UNLISTED(): boolean {
  const ids = new Set(AGENCY_INTAKE_VERTICALS.map((item) => item.id));
  return UNLISTED_AGENCY_VERTICALS.every((slug) => ids.has(slug));
}
