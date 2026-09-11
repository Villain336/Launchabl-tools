import { describe, expect, it } from "vitest";
import { analyzeCanonicalHtml, stripTracking } from "@/lib/web/canonical";
import { extractLinks, pathSimilarity } from "@/lib/web/links";
import { analyzeHtmlPerformance } from "@/lib/web/performance";
import { findLinksTo } from "@/lib/web/backlinks";

const page = (head: string, body = "") => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;

describe("analyzeCanonicalHtml", () => {
  it("collects HTML canonicals, header canonical, og:url and robots", () => {
    const html = page(
      `<link rel="canonical" href="/tools/qr"><link rel="canonical" href="https://a.com/other"><meta property="og:url" content="https://a.com/tools/qr"><meta name="robots" content="noindex">`,
    );
    const headers = new Headers({ link: '<https://a.com/tools/qr>; rel="canonical", <https://a.com/next>; rel="next"' });
    const result = analyzeCanonicalHtml({ html, finalUrl: "https://a.com/tools/qr", requestedUrl: "a.com/tools/qr", status: 200, headers });
    expect(result.htmlCanonicals).toEqual(["/tools/qr", "https://a.com/other"]);
    expect(result.headerCanonical).toBe("https://a.com/tools/qr");
    expect(result.ogUrl).toBe("https://a.com/tools/qr");
    expect(result.robots).toBe("noindex");
    expect(result.canonicalInBody).toBe(false);
  });

  it("flags canonical tags placed in the body", () => {
    const html = page("", `<link rel="canonical" href="https://a.com/">`);
    const result = analyzeCanonicalHtml({ html, finalUrl: "https://a.com/", requestedUrl: "a.com", status: 200, headers: new Headers() });
    expect(result.canonicalInBody).toBe(true);
  });

  it("strips tracking params but keeps meaningful ones", () => {
    const clean = stripTracking(new URL("https://a.com/p?id=3&utm_source=x&gclid=1#top"));
    expect(clean.toString()).toBe("https://a.com/p?id=3");
  });
});

describe("extractLinks", () => {
  it("dedupes, resolves relative hrefs, classifies and counts occurrences", () => {
    const html = `<a href="/pricing">Pricing</a><a href="https://a.com/pricing#faq">Again</a><a href="https://b.org/x"><img alt="B logo"></a><a href="mailto:x@y.z">m</a><a href="#top">t</a>`;
    const links = extractLinks(html, "https://a.com/");
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ url: "https://a.com/pricing", anchor: "Pricing", kind: "internal", occurrences: 2 });
    expect(links[1]).toMatchObject({ url: "https://b.org/x", anchor: "[image: B logo]", kind: "external" });
  });

  it("scores similar paths highly", () => {
    expect(pathSimilarity("/blog/launch-checklist", "/blog/launch-checklist-2024")).toBeGreaterThan(0.7);
    expect(pathSimilarity("/blog/launch-checklist", "/pricing")).toBeLessThan(0.4);
  });
});

describe("analyzeHtmlPerformance", () => {
  it("detects blocking scripts, styles, images, fonts and third parties", () => {
    const html = page(
      `<meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter&display=swap"><script src="/blocking.js"></script><script src="https://cdn.tracker.io/t.js" async></script><script type="module" src="/app.js"></script>`,
      `<img src="/hero.webp" width="800" height="400"><img src="/b.jpg" loading="lazy"><iframe src="https://www.youtube.com/embed/x"></iframe><script>window.__DATA__=${JSON.stringify("x".repeat(100))}</script>`,
    );
    const a = analyzeHtmlPerformance(html, "https://a.com/");
    expect(a.external).toHaveLength(3);
    expect(a.external.filter((s) => s.blocking).map((s) => s.url)).toEqual(["https://a.com/blocking.js"]);
    expect(a.stylesheets).toBe(2);
    expect(a.googleFonts).toBe(true);
    expect(a.fontDisplayHint).toBe(true);
    expect(a.images).toMatchObject({ total: 2, lazy: 1, missingDimensions: 1, modernFormat: 1, missingAlt: 2 });
    expect(a.thirdParties).toEqual(["cdn.tracker.io", "fonts.googleapis.com", "youtube.com"]);
    expect(a.iframes).toBe(1);
    expect(a.inlineScriptBytes).toBeGreaterThan(100);
    expect(a.hasViewport).toBe(true);
  });
});

describe("findLinksTo", () => {
  it("finds links to the target host and reads rel, anchor and exactness", () => {
    const html = `<a href="https://www.target.com/pricing/" rel="nofollow sponsored">Pricing</a><a href="https://target.com/">Home</a><a href="https://other.com/">x</a>`;
    const links = findLinksTo(html, "https://ref.com/post", new URL("https://target.com/pricing"));
    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({ anchor: "Pricing", follow: false, exact: true });
    expect(links[1]).toMatchObject({ anchor: "Home", follow: true, exact: false });
  });
});
