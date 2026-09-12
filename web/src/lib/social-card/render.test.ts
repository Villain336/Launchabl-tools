import { describe, expect, it } from "vitest";
import { CARD_SIZES, estimateMeasure, fitText, luminance, mix, palette, renderSocialCardSvg, wrapText } from "./render";
import { socialCardSchema } from "@/lib/ai/tools/image-gen";

const base = socialCardSchema.parse({
  title: "Why your DMARC policy is still p=none — and what it costs you",
  subtitle: "A deliverability engineer's checklist for getting to p=reject without losing mail.",
  badge: "Guide",
  brand: { name: "Launchabl", domain: "launchabl.io", accent: "#FF6600" },
  author: { name: "Sam Lee", role: "Head of Deliverability" },
});

describe("text layout", () => {
  it("wraps on word boundaries and truncates with an ellipsis", () => {
    const { lines, truncated } = wrapText("one two three four five six seven eight", 120, 20, 700, estimateMeasure, 2);
    expect(lines).toHaveLength(2);
    expect(truncated).toBe(true);
    expect(lines[1].endsWith("…")).toBe(true);
    expect(lines.every((l) => estimateMeasure(l, 20, 700) <= 120 || !l.includes(" "))).toBe(true);
  });

  it("shrinks the font until the title fits", () => {
    const long = "A very long headline that absolutely will not fit at the starting size no matter what";
    const fitted = fitText(long, 900, 96, 40, 800, estimateMeasure, 3);
    expect(fitted.fontSize).toBeLessThan(96);
    expect(fitted.lines.length).toBeLessThanOrEqual(3);
    expect(fitted.lines.join(" ").includes("…")).toBe(false);
  });
});

describe("palette", () => {
  it("picks readable text on the accent", () => {
    expect(palette({ ...base, theme: "accent", brand: { ...base.brand, accent: "#FFE9D6" } }).text).toBe("#111111");
    expect(palette({ ...base, theme: "accent", brand: { ...base.brand, accent: "#1D4ED8" } }).text).toBe("#FFFFFF");
    expect(luminance("#FFFFFF")).toBeCloseTo(1, 3);
    expect(mix("#000000", "#FFFFFF", 0.5)).toBe("#808080");
  });
});

describe("renderSocialCardSvg", () => {
  it("renders every size with the copy typeset and escaped", () => {
    for (const size of CARD_SIZES) {
      const svg = renderSocialCardSvg({ spec: { ...base, title: 'Ship "faster" & <safer>' }, size });
      expect(svg.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}"`)).toBe(true);
      expect(svg).toContain("&quot;faster&quot;");
      expect(svg).toContain("&lt;safer&gt;");
      expect(svg).toContain("&amp;");
      expect(svg).not.toContain("<safer>");
      expect(svg).toContain("GUIDE");
      expect(svg).toContain("Launchabl  ·  launchabl.io");
      expect(svg).not.toContain("<script");
    }
  });

  it("shows the author only in left layouts and uses the backdrop when given", () => {
    const left = renderSocialCardSvg({ spec: base, size: CARD_SIZES[0] });
    expect(left).toContain("Sam Lee · Head of Deliverability");
    const center = renderSocialCardSvg({ spec: { ...base, layout: "center" }, size: CARD_SIZES[0] });
    expect(center).not.toContain("Sam Lee");
    const art = renderSocialCardSvg({ spec: { ...base, background: { kind: "generated" } }, size: CARD_SIZES[0], backgroundImage: "data:image/webp;base64,AAAA" });
    expect(art).toContain('<image href="data:image/webp;base64,AAAA"');
    const missingArt = renderSocialCardSvg({ spec: { ...base, background: { kind: "generated" } }, size: CARD_SIZES[0], backgroundImage: null });
    expect(missingArt).not.toContain("<image");
    expect(missingArt).toContain("linearGradient");
  });
});
