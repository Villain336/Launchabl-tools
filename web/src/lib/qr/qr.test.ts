import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import { canEncode, renderQrSvg } from "@/lib/qr/render";
import { decodeStyle, encodeStyle, hostedQrUrl } from "@/lib/qr/share";
import { contrastRatio, defaultQrStyle, normalizeQrStyle, styleWarnings } from "@/lib/qr/style";

const URL_ = "https://launchabl.com";

describe("renderQrSvg", () => {
  it("produces a standalone SVG sized in modules", () => {
    const { svg, modules, version } = renderQrSvg(URL_, defaultQrStyle, { size: 300 });
    expect(svg.startsWith("<svg xmlns=")).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${modules + 4} ${modules + 4}"`);
    expect(svg).toContain('width="300"');
    expect(version).toBeGreaterThan(0);
  });

  it("paints every dark data module for square style", () => {
    const style = normalizeQrStyle({ margin: 0 });
    const { svg } = renderQrSvg(URL_, style);
    const qr = QRCode.create(URL_, { errorCorrectionLevel: "H" });
    const n = qr.modules.size;
    let dark = 0;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const eye = (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
        if (!eye && qr.modules.get(r, c)) dark++;
      }
    }
    expect((svg.match(/h1v1h-1Z/g) ?? []).length).toBe(dark);
    // Three finder patterns → three frames and three pupils.
    expect((svg.match(/stroke-width="1"/g) ?? []).length).toBe(3);
  });

  it("emits gradient defs, eye colour and transparent background when asked", () => {
    const style = normalizeQrStyle({
      moduleShape: "fluid",
      eyeFrameShape: "circle",
      eyePupilShape: "leaf",
      gradient: { type: "radial", from: "#FF6600", to: "#111111" },
      eyeColor: "#0000ff",
      background: "transparent",
    });
    const { svg } = renderQrSvg(URL_, style);
    expect(svg).toContain("<radialGradient");
    expect(svg).toContain('fill="url(#qrg)"');
    expect(svg).toContain('stroke="#0000ff"');
    expect(svg).not.toContain("<rect width=");
  });

  it("knocks out the centre and places the logo image", () => {
    const style = normalizeQrStyle({ logo: { sizeRatio: 0.2 } });
    const withLogo = renderQrSvg(URL_, style, { logoHref: "data:image/png;base64,AAAA" }).svg;
    const without = renderQrSvg(URL_, style).svg;
    expect(withLogo).toContain("<image href=");
    expect(withLogo.length).toBeGreaterThan(0);
    expect((without.match(/h1v1h-1Z/g) ?? []).length).toBeGreaterThan((withLogo.match(/h1v1h-1Z/g) ?? []).length);
  });

  it("escapes attribute characters in logo hrefs", () => {
    const style = normalizeQrStyle({ logo: {} });
    const { svg } = renderQrSvg(URL_, style, { logoHref: 'x" onload="alert(1)' });
    expect(svg).not.toContain('onload="alert');
    expect(svg).toContain("&quot;");
  });

  it("reports when a payload cannot be encoded", () => {
    expect(canEncode(URL_, "H")).toBe(true);
    expect(canEncode("x".repeat(5000), "H")).toBe(false);
  });
});

describe("style helpers", () => {
  it("normalises partial input and falls back on garbage", () => {
    expect(normalizeQrStyle({ moduleShape: "dots" }).moduleShape).toBe("dots");
    expect(normalizeQrStyle({ moduleShape: "dots" }).errorCorrection).toBe("H");
    expect(normalizeQrStyle({ foreground: "red" })).toEqual(defaultQrStyle);
  });

  it("warns about scanner-hostile choices", () => {
    const risky = normalizeQrStyle({ foreground: "#eeeeee", background: "#ffffff", margin: 0, logo: { sizeRatio: 0.3 }, errorCorrection: "L" });
    const warnings = styleWarnings(risky);
    expect(warnings.some((w) => /contrast/i.test(w))).toBe(true);
    expect(warnings.some((w) => /quiet zone/i.test(w))).toBe(true);
    expect(warnings.some((w) => /error correction H/i.test(w))).toBe(true);
    expect(styleWarnings(defaultQrStyle)).toEqual([]);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("round-trips a style through the URL encoding, keeping only non-defaults", () => {
    const style = normalizeQrStyle({ moduleShape: "leaf", foreground: "#FF6600", cornerRadius: 0.1 });
    const encoded = encodeStyle(style);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeStyle(encoded)).toEqual(style);
    expect(decodeStyle("not-base64!!")).toEqual(defaultQrStyle);
    expect(encodeStyle(defaultQrStyle)).toBe(encodeStyle(normalizeQrStyle({})));
    expect(hostedQrUrl("https://launchabl.com", URL_, style, 256)).toMatch(/^https:\/\/launchabl\.com\/api\/qr\?data=.*&s=.*&size=256$/);
  });
});
