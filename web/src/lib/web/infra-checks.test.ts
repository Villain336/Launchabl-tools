import { describe, expect, it } from "vitest";
import { analyzeSpf, detectProvider, normalizeDomain, parseTags } from "@/lib/web/dns-email";
import { analyzeCsp, parseSetCookie } from "@/lib/web/security-headers";
import { analyzeAccessibilityHtml } from "@/lib/web/accessibility";
import { coversHost, parseSans } from "@/lib/web/ssl";
import { buildPatterns, classifyLocalPart, splitName } from "@/lib/web/email-finder";
import { handoffFor } from "@/lib/chat/handoffs";

describe("dns-email", () => {
  it("normalises domains from URLs and addresses, rejects junk", () => {
    expect(normalizeDomain("https://www.Example.com/path?x=1")).toBe("www.example.com");
    expect(normalizeDomain("jane@acme.io")).toBe("acme.io");
    expect(normalizeDomain("Example.com.")).toBe("example.com");
    expect(() => normalizeDomain("not a domain")).toThrow();
    expect(() => normalizeDomain("localhost")).toThrow();
  });

  it("parses DMARC tags and detects providers", () => {
    expect(parseTags("v=DMARC1; p=quarantine; pct=50; rua=mailto:d@x.com")).toMatchObject({ v: "DMARC1", p: "quarantine", pct: "50", rua: "mailto:d@x.com" });
    expect(detectProvider(["aspmx.l.google.com"])).toBe("Google Workspace");
    expect(detectProvider(["acme-com.mail.protection.outlook.com"])).toBe("Microsoft 365");
    expect(detectProvider(["mx.custom.example"])).toBeNull();
  });

  it("counts SPF lookups through includes and reads the qualifier", async () => {
    const zone: Record<string, string[]> = {
      "_spf.google.com": ["v=spf1 include:_netblocks.google.com include:_netblocks2.google.com ~all"],
      "_netblocks.google.com": ["v=spf1 ip4:35.190.247.0/24 ~all"],
      "_netblocks2.google.com": ["v=spf1 ip6:2001:4860:4000::/36 ~all"],
      "spf.mailer.example": ["v=spf1 a mx ptr ~all"],
    };
    const resolver = {
      resolveTxt: async (name: string) => {
        if (!zone[name]) throw new Error("ENODATA");
        return zone[name].map((r) => [r]);
      },
      resolveMx: async () => [],
      resolve4: async () => [],
      resolve6: async () => [],
    };
    const a = await analyzeSpf("v=spf1 include:_spf.google.com include:spf.mailer.example include:dead.example -all", resolver);
    // google (1) + 2 netblocks + mailer (1) + a + mx + ptr + dead (1) = 8
    expect(a.lookups).toBe(8);
    expect(a.qualifier).toBe("-");
    expect(a.hasPtr).toBe(true);
    expect(a.unresolved).toEqual(["dead.example"]);
    expect(a.overBudget).toBe(false);
    const b = await analyzeSpf("v=spf1 ip4:1.2.3.4 +all", resolver);
    expect(b.qualifier).toBe("+");
    expect(b.allowsAll).toBe(true);
    expect(b.lookups).toBe(0);
  });
});

describe("security headers", () => {
  it("judges CSP quality, not presence", () => {
    const weak = analyzeCsp("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; frame-ancestors 'none'");
    expect(weak.unsafeInlineScript).toBe(true);
    expect(weak.unsafeEval).toBe(true);
    expect(weak.wildcardScript).toBe(true);
    expect(weak.hasFrameAncestors).toBe(true);
    expect(weak.hasObjectSrc).toBe(false);
    const strong = analyzeCsp("default-src 'none'; script-src 'nonce-abc' 'strict-dynamic' 'unsafe-inline'; base-uri 'self'; report-to csp");
    expect(strong.unsafeInlineScript).toBe(false); // nonce present → 'unsafe-inline' is ignored by browsers
    expect(strong.usesNonceOrHash).toBe(true);
    expect(strong.strictDynamic).toBe(true);
    expect(strong.hasObjectSrc).toBe(true); // via default-src 'none'
    expect(strong.reportTo).toBe(true);
  });

  it("reads cookie flags", () => {
    const cookies = parseSetCookie(["sid=abc; Path=/; Secure; HttpOnly; SameSite=Lax", "theme=dark; Path=/"]);
    expect(cookies[0]).toMatchObject({ name: "sid", secure: true, httpOnly: true, sameSite: "lax" });
    expect(cookies[1]).toMatchObject({ name: "theme", secure: false, httpOnly: false, sameSite: null });
  });
});

describe("accessibility", () => {
  const html = `<html><head><title>Shop</title><meta name="viewport" content="width=device-width, user-scalable=no"></head>
  <body><header><nav><a href="/"><img src="/logo.png"></a></nav></header>
  <h1>Welcome</h1><h3>Skipped</h3>
  <img src="/hero.jpg" alt="IMG_2231.jpg"><img src="/deco.png" alt="">
  <form><input type="email" placeholder="Email"><label for="n">Name</label><input id="n" type="text"><button><svg></svg></button></form>
  <a href="/a">Read more</a><a href="/b">Read more</a><a href="/c">Read more</a>
  <iframe src="https://maps.example"></iframe>
  <div id="x"></div><div id="x"></div>
  </body></html>`;

  it("finds the classic barriers with concrete offenders", () => {
    const report = analyzeAccessibilityHtml(html, "https://example.com", "https://example.com/", 200);
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c]));
    expect(byId.lang.status).toBe("fail");
    expect(byId.zoom.status).toBe("fail");
    expect(byId["heading-order"].status).toBe("warn");
    expect(byId.landmarks.status).toBe("warn");
    expect(byId.alt.status).toBe("fail"); // 1 of 3 missing is over the 25% threshold
    expect(report.examples.alt).toEqual(["/logo.png"]);
    expect(byId["alt-quality"].status).toBe("warn");
    expect(byId.labels.status).toBe("fail");
    expect(byId.labels.title).toContain("1 of 2");
    expect(byId["button-names"].status).toBe("fail");
    expect(byId["link-names"].status).toBe("fail"); // the logo link has an image without alt
    expect(byId["link-text"].status).toBe("warn");
    expect(byId["iframe-title"].status).toBe("warn");
    expect(byId["duplicate-ids"].status).toBe("warn");
    expect(report.stats).toMatchObject({ images: 3, imagesMissingAlt: 1, formFields: 2, unlabeledFields: 1, iframes: 1 });
    expect(report.score).toBeLessThan(50);
  });

  it("passes a well-built page", () => {
    const good = `<html lang="en"><head><title>Good</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body><a href="#main">Skip to content</a><header><nav><a href="/" aria-label="Home"><svg><title>Logo</title></svg></a></nav></header>
    <main id="main"><h1>Title</h1><h2>Section</h2><img src="/a.jpg" alt="Team at the offsite">
    <form><label>Email <input type="email"></label><button type="submit">Subscribe</button></form></main></body></html>`;
    const report = analyzeAccessibilityHtml(good, "https://example.com", "https://example.com/", 200);
    expect(report.summary.fail).toBe(0);
    expect(report.summary.warn).toBe(0);
    expect(report.score).toBe(100);
  });
});

describe("ssl", () => {
  it("parses SANs and matches wildcards one level deep", () => {
    const sans = parseSans("DNS:example.com, DNS:*.example.com, IP Address:1.2.3.4");
    expect(sans).toEqual(["example.com", "*.example.com"]);
    expect(coversHost("example.com", sans, null)).toBe(true);
    expect(coversHost("www.example.com", sans, null)).toBe(true);
    expect(coversHost("a.b.example.com", sans, null)).toBe(false);
    expect(coversHost("other.com", [], "other.com")).toBe(true);
  });

  it("hands HSTS gaps to the headers checker and back", () => {
    const base = { requestedUrl: "example.com", finalUrl: "https://example.com", status: 200, title: null, checks: [], summary: { pass: 0, warn: 0, fail: 0, info: 0 }, score: 0, facts: {} };
    const fromSsl = handoffFor({ ...base, kind: "ssl" }, "hsts", "ssl-certificate-checker");
    expect(fromSsl?.slug).toBe("security-headers-checker");
    const fromHeaders = handoffFor({ ...base, kind: "security-headers" }, "https", "security-headers-checker");
    expect(fromHeaders?.slug).toBe("ssl-certificate-checker");
    expect(decodeURIComponent(fromHeaders?.href ?? "")).toContain("certificate for example.com");
  });
});

describe("email finder", () => {
  it("splits names, builds patterns and classifies observed addresses", () => {
    expect(splitName("Dr. José Álvarez-Ruiz")).toEqual({ first: "jose", last: "alvarezruiz" });
    expect(splitName("Cher")).toEqual({ first: "cher", last: "" });
    const p = buildPatterns("jane", "doe");
    expect(p["first.last"]).toBe("jane.doe");
    expect(p.flast).toBe("jdoe");
    expect(p["last.f"]).toBe("doe.j");
    expect(classifyLocalPart("jane.doe")).toBe("first.last");
    expect(classifyLocalPart("j.doe")).toBe("f.last");
    expect(classifyLocalPart("jane_doe")).toBe("first_last");
    expect(classifyLocalPart("info")).toBeNull();
    expect(classifyLocalPart("jane")).toBe("first");
    expect(classifyLocalPart("janedoe")).toBe("firstlast-or-flast");
  });
});
