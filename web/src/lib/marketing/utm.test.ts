import { describe, expect, it } from "vitest";
import { buildUtmLinks, normalizeMedium, normalizeUtmValue, utmCsv } from "./utm";

describe("normalizeUtmValue", () => {
  it("lowercases, replaces spaces and hyphens, strips junk", () => {
    expect(normalizeUtmValue("Spring Launch - V1!")).toBe("spring_launch_v1");
    expect(normalizeUtmValue("  __x__ ")).toBe("x");
  });
});

describe("normalizeMedium", () => {
  it("maps aliases onto the standard taxonomy", () => {
    expect(normalizeMedium("PPC").medium).toBe("cpc");
    expect(normalizeMedium("Paid Social").medium).toBe("paid_social");
    expect(normalizeMedium("email")).toEqual({ medium: "email", changed: false });
  });
});

describe("buildUtmLinks", () => {
  it("builds normalised links and preserves existing query strings", () => {
    const build = buildUtmLinks({
      baseUrl: "example.com/pricing?ref=home#plans",
      campaign: "2026 Q4 Launch",
      links: [
        { label: "LinkedIn post", source: "LinkedIn", medium: "social", content: "Carousel 1" },
        { source: "google", medium: "ppc", term: "invoicing software" },
      ],
    });
    expect(build.campaign).toBe("2026_q4_launch");
    expect(build.rows).toHaveLength(2);
    const first = new URL(build.rows[0].url);
    expect(first.searchParams.get("ref")).toBe("home");
    expect(first.searchParams.get("utm_source")).toBe("linkedin");
    expect(first.searchParams.get("utm_medium")).toBe("social");
    expect(first.searchParams.get("utm_content")).toBe("carousel_1");
    expect(first.hash).toBe("#plans");
    expect(build.rows[1].params.utm_medium).toBe("cpc");
    expect(build.rows[1].params.utm_term).toBe("invoicing_software");
    expect(build.rows[1].label).toBe("google · cpc");
    expect(build.warnings.some((w) => w.includes("fragment"))).toBe(true);
    expect(build.warnings.some((w) => w.includes("normalised"))).toBe(true);
  });

  it("replaces existing utm params, flags duplicates and non-standard mediums", () => {
    const build = buildUtmLinks({
      baseUrl: "https://example.com/?utm_source=old",
      campaign: "launch",
      links: [
        { source: "x", medium: "social" },
        { source: "x", medium: "social" },
        { source: "partner", medium: "sponsorship" },
      ],
    });
    expect(build.warnings.some((w) => w.includes("utm_source"))).toBe(true);
    expect(build.rows[0].params.utm_source).toBe("x");
    expect(build.rows[1].warnings.some((w) => w.includes("Duplicate"))).toBe(true);
    expect(build.rows[2].warnings.some((w) => w.includes("standard medium"))).toBe(true);
  });

  it("rejects invalid input", () => {
    expect(() => buildUtmLinks({ baseUrl: "not a url at all", campaign: "x", links: [] })).toThrow();
    expect(() => buildUtmLinks({ baseUrl: "https://example.com", campaign: "!!!", links: [] })).toThrow(/Campaign/);
  });
});

describe("utmCsv", () => {
  it("emits a header and escapes commas", () => {
    const build = buildUtmLinks({ baseUrl: "https://example.com", campaign: "c", links: [{ label: "A, B", source: "s", medium: "email" }] });
    const csv = utmCsv(build);
    expect(csv.split("\n")[0]).toBe("label,url,utm_source,utm_medium,utm_campaign,utm_content,utm_term");
    expect(csv.split("\n")[1].startsWith('"A, B",https://example.com/?utm_source=s')).toBe(true);
  });
});
