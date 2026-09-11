import { describe, expect, it } from "vitest";
import { FetchPageError, normalizeUrl, parseHtml } from "@/lib/web/fetch-page";

const html = `<!doctype html>
<html lang="en">
<head>
  <title>  Free QR Code Generator &amp; Designer | Launchabl </title>
  <meta name="description" content="Styled QR codes that scan.">
  <meta name='robots' content='index,follow'>
  <link rel="canonical" href="https://launchabl.com/tools/qr">
  <link rel="alternate" hreflang="fr" href="https://launchabl.com/fr/tools/qr">
  <meta property="og:title" content="QR Designer">
  <meta property="og:image" content="https://launchabl.com/og.png">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"QR"}</script>
</head>
<body>
  <nav><a href="/tools">Tools</a></nav>
  <h1>Design a <em>QR code</em></h1>
  <h2>Shapes</h2><h2>Colours</h2>
  <p>Describe the look you want and download SVG or PNG.</p>
  <img src="/a.png" alt="preview"><img src="/b.png">
  <a href="/pricing">Pricing</a><a href="https://vercel.com">Vercel</a><a href="#top">Top</a><a href="mailto:x@y.z">Mail</a>
  <footer>© Launchabl</footer>
</body></html>`;

describe("parseHtml", () => {
  const page = parseHtml(html, "launchabl.com/tools/qr", "https://launchabl.com/tools/qr");

  it("reads head tags with entity decoding and whitespace collapsing", () => {
    expect(page.title).toBe("Free QR Code Generator & Designer | Launchabl");
    expect(page.metaDescription).toBe("Styled QR codes that scan.");
    expect(page.metaRobots).toBe("index,follow");
    expect(page.canonical).toBe("https://launchabl.com/tools/qr");
    expect(page.lang).toBe("en");
    expect(page.og).toEqual({ title: "QR Designer", image: "https://launchabl.com/og.png" });
    expect(page.twitter).toEqual({ card: "summary_large_image" });
    expect(page.hreflang).toEqual([{ lang: "fr", href: "https://launchabl.com/fr/tools/qr" }]);
    expect(page.jsonLdTypes).toEqual(["SoftwareApplication"]);
  });

  it("extracts headings, counts and an excerpt without nav/footer noise", () => {
    expect(page.h1).toEqual(["Design a QR code"]);
    expect(page.h2).toEqual(["Shapes", "Colours"]);
    expect(page.excerpt).toContain("Describe the look you want");
    expect(page.excerpt).not.toContain("© Launchabl");
    expect(page.images).toEqual({ total: 2, withAlt: 1 });
    expect(page.links).toEqual({ total: 3, internal: 2, external: 1 });
    expect(page.wordCount).toBeGreaterThan(5);
  });
});

describe("normalizeUrl", () => {
  it("adds https and strips fragments", () => {
    expect(normalizeUrl("launchabl.com/tools#x").toString()).toBe("https://launchabl.com/tools");
  });

  it("refuses private and non-http targets", () => {
    for (const bad of ["http://localhost:3000", "http://127.0.0.1", "http://10.0.0.5", "http://192.168.1.1", "http://169.254.169.254/latest", "ftp://example.com", "http://intranet"]) {
      expect(() => normalizeUrl(bad), bad).toThrow(FetchPageError);
    }
  });
});
