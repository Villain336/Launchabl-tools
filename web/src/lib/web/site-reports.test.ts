import { describe, expect, it } from "vitest";
import { gradeLandingPageHtml } from "@/lib/web/landing-page";
import { auditWebsiteHtml } from "@/lib/web/website-audit";
import { buildComparison, COMPARE_METRICS, leaderFor, type ComparedSite } from "@/lib/web/compare-sites";
import { buildRobotsTxt, buildSitemapXml } from "@/lib/web/crawl";
import { callsToAction, forms, topKeywords } from "@/lib/web/html";
import { validateJsonLd, expandCalendar } from "@/lib/ai/tools/marketing-kits";

const GOOD_LANDING = `<!doctype html><html lang="en"><head><title>Invoices out in 60 seconds — Ledgerly</title>
<meta name="description" content="Ledgerly gets freelancers paid twice as fast with one-click invoices, reminders and card payments. Free for 14 days, no credit card.">
<meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
<main>
<h1>Get paid twice as fast with one-click invoices</h1>
<p>Ledgerly helps you send invoices in 60 seconds, chase late payers automatically and take card payments — so you spend less time on admin.</p>
<a class="btn" href="/signup">Start my free trial</a>
<p>No credit card required. Cancel anytime.</p>
<img src="/hero.png" alt="Ledgerly dashboard">
<section><h2>Trusted by 2,400 freelancers</h2>
<blockquote class="testimonial">“I got paid in 3 days instead of 30.” — Sam Lee, designer</blockquote>
<blockquote class="testimonial">“Set up in five minutes.” — Priya N., consultant</blockquote></section>
<form action="/signup"><input type="email" name="email" required><button type="submit">Start my free trial</button><p>We never share your email. Privacy policy.</p></form>
<p>${"Freelancers deserve simple invoicing that works. ".repeat(30)}</p>
<a href="tel:+15550100">+1 555 0100</a>
<a href="/privacy">Privacy policy</a>
</main></body></html>`;

const BAD_LANDING = `<html><head><title>Acme</title></head><body>
<nav>${Array.from({ length: 12 }, (_, i) => `<a href="/p${i}">Link ${i}</a>`).join("")}</nav>
<h1>Acme</h1><h1>Welcome</h1>
<p>${"Words about things. ".repeat(20)}</p>
<a href="https://twitter.com/x">Twitter</a><a href="https://facebook.com/x">Facebook</a><a href="https://linkedin.com/x">LinkedIn</a><a href="https://youtube.com/x">YouTube</a>
<form>${Array.from({ length: 8 }, (_, i) => `<input name="f${i}">`).join("")}<input type="tel" name="phone"><input type="submit" value="Submit"></form>
</body></html>`;

const base = { requestedUrl: "https://example.com", status: 200, loadTimeMs: 400, ttfbMs: 120, bytes: 20_000 };

describe("landing page grader", () => {
  it("rewards a focused page with one CTA, proof and a short form", () => {
    const report = gradeLandingPageHtml({ ...base, html: GOOD_LANDING, finalUrl: "https://example.com/" });
    expect(report.kind).toBe("landing-page");
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.headline).toMatch(/Get paid twice as fast/);
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c.status]));
    expect(byId.headline).toBe("pass");
    expect(byId["cta-present"]).toBe("pass");
    expect(byId["cta-fold"]).toBe("pass");
    expect(byId.form).toBe("pass");
    expect(byId.testimonials).toBe("pass");
    expect(byId.logos).toBe("pass");
    expect(byId["form-privacy"]).toBe("pass");
    expect(report.ctas[0].text).toBe("Start my free trial");
  });

  it("flags the classic conversion killers", () => {
    const report = gradeLandingPageHtml({ ...base, html: BAD_LANDING, finalUrl: "http://example.com/", loadTimeMs: 3_400 });
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c.status]));
    expect(report.score).toBeLessThan(50);
    expect(byId.headline).toBe("warn"); // two H1s
    expect(byId["cta-wording"]).toBe("warn"); // "Submit"
    expect(byId.form).toBe("fail"); // 9 fields
    expect(byId["form-phone"]).toBe("warn");
    expect(byId.testimonials).toBe("fail");
    expect(byId.nav).toBe("warn");
    expect(byId.leaks).toBe("warn");
    expect(byId.https).toBe("fail");
    expect(byId.speed).toBe("fail");
    expect(byId.mobile).toBe("fail");
  });
});

describe("html helpers", () => {
  it("detects CTAs, weak labels and form fields", () => {
    const ctas = callsToAction(`<a class="button" href="/x">Book a demo</a><button>Submit</button><input type="submit" value="Go"><a href="/about">About us and our long company history</a>`);
    expect(ctas.map((c) => c.text)).toEqual(["Book a demo", "Submit", "Go"]);
    expect(ctas.filter((c) => c.weak).length).toBe(2);
    const [form] = forms(`<form><input type="hidden" name="t"><input type="email" name="email" required><select></select><textarea></textarea><input type="submit"></form>`);
    expect(form.fields).toBe(3);
    expect(form.hasEmail).toBe(true);
  });

  it("extracts topical keywords without stop words", () => {
    const words = topKeywords("The invoicing app for freelancers. Invoicing that freelancers love. The best invoicing.", 3).map((k) => k.word);
    expect(words[0]).toBe("invoicing");
    expect(words).toContain("freelancers");
    expect(words).not.toContain("the");
  });
});

const AUDIT_HTML = `<!doctype html><html lang="en"><head>
<title>Ledgerly — invoicing for freelancers that gets you paid fast</title>
<meta name="description" content="Ledgerly is invoicing software for freelancers: one-click invoices, automatic reminders and card payments so you get paid in days, not months.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://example.com/">
<link rel="icon" href="/icon.png">
<meta property="og:title" content="Ledgerly"><meta property="og:description" content="Invoicing for freelancers"><meta property="og:image" content="https://example.com/og.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Ledgerly","url":"https://example.com"}</script>
</head><body><main><h1>Invoicing for freelancers</h1><h2>Why Ledgerly</h2><h2>Pricing</h2><h2>FAQ</h2>
${Array.from({ length: 6 }, (_, i) => `<a href="/page-${i}">Page ${i}</a>`).join("")}
<img src="/a.png" alt="a"><img src="/b.png" alt="b" loading="lazy">
<p>${"Freelancers use Ledgerly to invoice clients and get paid faster. ".repeat(40)}</p></main></body></html>`;

describe("website audit", () => {
  it("passes a well-formed page and exposes comparable metrics", () => {
    const headers = new Headers({ "content-encoding": "br", "cache-control": "public, max-age=60", "strict-transport-security": "max-age=1", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer" });
    const report = auditWebsiteHtml({ ...base, html: AUDIT_HTML, finalUrl: "https://example.com/", headers });
    expect(report.kind).toBe("website-audit");
    expect(report.summary.fail).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.metrics.jsonLdTypes).toEqual(["Organization"]);
    expect(report.metrics.securityHeaders).toBe(4);
    expect(report.metrics.h1Count).toBe(1);
    expect(report.metrics.keywords[0]).toBe("ledgerly");
  });

  it("fails on noindex, invalid JSON-LD and missing basics", () => {
    const html = `<html><head><meta name="robots" content="noindex"><script type="application/ld+json">{oops}</script></head><body><p>hi</p></body></html>`;
    const report = auditWebsiteHtml({ ...base, html, finalUrl: "http://example.com/", headers: new Headers() });
    const byId = Object.fromEntries(report.checks.map((c) => [c.id, c.status]));
    expect(byId.indexable).toBe("fail");
    expect(byId.schema).toBe("fail");
    expect(byId.title).toBe("fail");
    expect(byId.description).toBe("fail");
    expect(byId.h1).toBe("fail");
    expect(byId.https).toBe("fail");
    expect(byId.viewport).toBe("fail");
    expect(byId["security-headers"]).toBe("fail");
  });
});

describe("competitor comparison", () => {
  const site = (host: string, values: Partial<ComparedSite["values"]>, keywords: string[] = []): ComparedSite => ({
    requestedUrl: `https://${host}`,
    finalUrl: `https://${host}/`,
    title: host,
    ok: true,
    values: { ...(Object.fromEntries(COMPARE_METRICS.map((m) => [m.key, null])) as ComparedSite["values"]), ...values },
    schemaTypes: [],
    keywords,
    failing: [],
  });

  it("picks leaders by direction and leaves ties open", () => {
    const higher = COMPARE_METRICS.find((m) => m.key === "words")!;
    const lower = COMPARE_METRICS.find((m) => m.key === "loadTimeMs")!;
    const flag = COMPARE_METRICS.find((m) => m.key === "https")!;
    expect(leaderFor(higher, [100, 900, null])).toBe(1);
    expect(leaderFor(lower, [900, 100])).toBe(1);
    expect(leaderFor(flag, [false, true])).toBe(1);
    expect(leaderFor(higher, [5, 5])).toBeNull();
  });

  it("computes gaps, wins and missing keywords for the first site", () => {
    const report = buildComparison([
      site("you.com", { score: 60, words: 300, loadTimeMs: 300, https: true }, ["invoicing", "freelancers"]),
      site("them.com", { score: 85, words: 1_200, loadTimeMs: 900, https: true }, ["invoicing", "accounting", "tax"]),
      site("other.com", { score: 70, words: 800, loadTimeMs: 1_200, https: false }, ["accounting", "payroll"]),
    ]);
    expect(report.wins).toContain("loadTimeMs");
    expect(report.gaps.map((g) => g.key)).toEqual(expect.arrayContaining(["score", "words"]));
    expect(report.gaps.find((g) => g.key === "words")).toMatchObject({ yours: 300, best: 1_200, leader: 1 });
    expect(report.missingKeywords[0]).toBe("accounting");
    expect(report.leaders.https).toBeNull(); // you and them tie
  });
});

describe("sitemap and robots builders", () => {
  const pages = [
    { url: "https://example.com/", status: 200, title: "Home", depth: 0, excluded: null, lastModified: "Tue, 01 Sep 2026 10:00:00 GMT" },
    { url: "https://example.com/about", status: 200, title: "About", depth: 1, excluded: null, lastModified: null },
    { url: "https://example.com/old", status: 301, title: null, depth: 1, excluded: "redirects to /about", lastModified: null },
    { url: "https://example.com/gone", status: 404, title: null, depth: 2, excluded: "HTTP 404", lastModified: null },
    { url: "https://example.com/a&b", status: 200, title: null, depth: 2, excluded: null, lastModified: null },
  ];

  it("includes only live, indexable pages and escapes URLs", () => {
    const xml = buildSitemapXml(pages);
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<lastmod>2026-09-01</lastmod>");
    expect(xml).toContain("<loc>https://example.com/a&amp;b</loc>");
    expect(xml).not.toContain("/old");
    expect(xml).not.toContain("/gone");
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toContain("<priority>0.8</priority>");
    expect(xml).not.toContain("<changefreq>");
  });

  it("writes robots rules with optional AI training blocks", () => {
    const plain = buildRobotsTxt({ sitemapUrl: "https://example.com/sitemap.xml" });
    expect(plain).toContain("User-agent: *\nAllow: /");
    expect(plain).toContain("Sitemap: https://example.com/sitemap.xml");
    const strict = buildRobotsTxt({ sitemapUrl: "https://example.com/sitemap.xml", disallow: ["/drafts", "admin"], blockAiTraining: true });
    expect(strict).toContain("Disallow: /drafts");
    expect(strict).toContain("Disallow: /admin");
    expect(strict).toContain("User-agent: GPTBot");
    expect(strict).not.toContain("User-agent: OAI-SearchBot");
    const all = buildRobotsTxt({ sitemapUrl: "https://example.com/sitemap.xml", blockAllAi: true });
    expect(all).toContain("User-agent: OAI-SearchBot");
  });
});

describe("schema validation", () => {
  it("checks required properties per type, including @graph and subtypes", () => {
    const result = validateJsonLd(
      JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Dentist", name: "Bright Smile", address: { "@type": "PostalAddress", addressLocality: "Austin" }, telephone: "+1-512-555-0100" },
          { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Do you take insurance?", acceptedAnswer: { "@type": "Answer", text: "Yes." } }] },
        ],
      }),
    );
    expect(result.valid).toBe(true);
    expect(result.types).toEqual(["Dentist", "FAQPage"]); // nested Question is checked but not headlined
    expect(result.checks.some((c) => c.type === "Question")).toBe(true);
    expect(result.checks.find((c) => c.type === "Dentist" && c.property === "address")?.present).toBe(true);
    expect(result.checks.find((c) => c.type === "Dentist" && c.property === "url")?.present).toBe(false);
  });

  it("fails on missing required fields, missing context, placeholders and relative URLs", () => {
    const result = validateJsonLd(JSON.stringify({ "@type": "Product", description: "TODO", image: "/img.png" }));
    expect(result.valid).toBe(false);
    expect(result.warnings.join(" ")).toMatch(/@context/);
    expect(result.warnings.join(" ")).toMatch(/placeholder/i);
    expect(result.warnings.join(" ")).toMatch(/absolute URL/);
    expect(result.checks.find((c) => c.property === "name")?.present).toBe(false);
    expect(validateJsonLd("{not json").valid).toBe(false);
  });
});

describe("calendar expansion", () => {
  it("dates entries from the start, groups by week and drops out-of-range days", () => {
    const cal = expandCalendar({
      title: "Launch plan",
      brand: "Ledgerly",
      goal: "Drive trials",
      audience: "Freelancers",
      startDate: "2026-09-14",
      days: 14,
      pillars: [{ name: "Education", description: "" }, { name: "Proof", description: "" }],
      cadence: "3/week",
      entries: [
        { day: 1, channel: "linkedin", format: "post", title: "Kickoff", brief: "Say hello to the audience and set up the series.", cta: "Follow", pillar: "Education", stage: "awareness", campaign: null },
        { day: 8, channel: "blog", format: "article", title: "Deep dive", brief: "Explain the problem in depth with a worked example.", cta: "Read", pillar: "Education", stage: "consideration", campaign: "Launch" },
        { day: 20, channel: "email", format: "email", title: "Too late", brief: "This one is outside the plan window and should be dropped.", cta: "x", pillar: "Proof", stage: "conversion", campaign: null },
      ],
      kpis: [{ metric: "Trials", target: "50" }, { metric: "Followers", target: "+200" }],
      notes: "",
    });
    expect(cal.entries).toHaveLength(2);
    expect(cal.entries[0]).toMatchObject({ date: "2026-09-14", weekday: "Monday", week: 1 });
    expect(cal.entries[1]).toMatchObject({ date: "2026-09-21", weekday: "Monday", week: 2 });
    expect(cal.endDate).toBe("2026-09-27");
    expect(cal.channels).toEqual(["linkedin", "blog"]);
  });
});
