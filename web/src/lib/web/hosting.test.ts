import { describe, expect, it } from "vitest";
import { detectStack, dnsRecordsFor, dnsRecordsText, getProvider, HOSTING_PROVIDERS } from "./hosting";

describe("hosting", () => {
  it("every provider has DNS records for apex or www and a docs link", () => {
    for (const p of HOSTING_PROVIDERS) {
      expect(p.dns.length).toBeGreaterThan(0);
      expect(p.connectDocs).toMatch(/^https:\/\//);
      expect(p.deploy.length).toBeGreaterThan(1);
    }
  });

  it("renders paste-ready DNS text for a domain", () => {
    const vercel = getProvider("vercel")!;
    const text = dnsRecordsText(dnsRecordsFor(vercel, "acme.com"), "acme.com");
    expect(text).toContain("acme.com\tA\t76.76.21.21");
    expect(text).toContain("www.acme.com\tCNAME\tcname.vercel-dns.com");
  });

  it("detects framework, cms, host and cdn from headers and html", () => {
    const headers = new Headers({ server: "cloudflare", "cf-ray": "abc", "x-vercel-id": "iad1::xyz" });
    const html = `<html><head><meta name="generator" content="Next.js"></head><body><script src="/_next/static/chunks/main.js"></script></body></html>`;
    const d = detectStack(headers, html);
    expect(d.framework).toBe("Next.js");
    expect(d.host).toBe("Vercel");
    expect(d.cdn).toBe("Cloudflare");
    expect(d.cms).toBeNull();
    expect(d.signals.join(" ")).toContain("generator: Next.js");

    const wp = detectStack(new Headers({ "x-kinsta-cache": "HIT" }), `<link rel="stylesheet" href="/wp-content/themes/x/style.css">`);
    expect(wp.cms).toBe("WordPress");
    expect(wp.host).toBe("Kinsta");
  });
});
