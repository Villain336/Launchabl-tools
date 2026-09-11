import { describe, expect, it } from "vitest";
import { analyzeVoiceSearchHtml, isQuestion } from "@/lib/web/voice-search";
import { scanComplianceHtml } from "@/lib/web/compliance";
import { analyzeLlmReadabilityHtml, crawlerAccess, parseRobots } from "@/lib/web/llm-readability";
import { finalizeChecklist } from "@/lib/web/checklist";

const page = (head: string, body: string) => `<!doctype html><html lang="en"><head><title>Test page</title>${head}</head><body>${body}</body></html>`;
const byId = <T extends { id: string }>(checks: T[], id: string) => checks.find((c) => c.id === id)!;

describe("finalizeChecklist", () => {
  it("scores passes fully, warnings partially, ignores info", () => {
    const report = finalizeChecklist(
      { kind: "compliance", requestedUrl: "a", finalUrl: "https://a.com/", status: 200, title: null, facts: {} },
      [
        { id: "a", status: "pass", title: "", detail: "" },
        { id: "b", status: "warn", title: "", detail: "" },
        { id: "c", status: "fail", title: "", detail: "" },
        { id: "d", status: "info", title: "", detail: "" },
      ],
    );
    expect(report.summary).toEqual({ pass: 1, warn: 1, fail: 1, info: 1 });
    expect(report.score).toBe(47);
    expect(report.checks.map((c) => c.id)).toEqual(["c", "b", "d", "a"]);
  });
});

describe("voice search", () => {
  it("recognises spoken questions", () => {
    expect(isQuestion("How much does it cost?")).toBe(true);
    expect(isQuestion("Can I cancel anytime")).toBe(true);
    expect(isQuestion("Pricing")).toBe(false);
  });

  it("rewards question headings with direct answers and FAQ schema", () => {
    const answer = "You can cancel your plan at any time from the billing page and you will keep access until the end of the period you already paid for, with no fees.";
    const body = `<main><h1>How does Acme billing work for small teams?</h1>
      <h2>Can I cancel anytime?</h2><p>${answer}</p>
      <h2>How much does it cost?</h2><p>${answer}</p>
      <h2>Do you offer refunds?</h2><p>${answer}</p>
      <ol><li>Open billing</li><li>Click cancel</li></ol>
      <script type="application/ld+json">{"@type":"FAQPage"}</script></main>`;
    const report = analyzeVoiceSearchHtml({
      html: page(`<meta name="viewport" content="width=device-width"><meta name="description" content="Everything about Acme billing, cancellation and refunds in plain words.">`, body),
      finalUrl: "https://acme.com/billing",
      requestedUrl: "acme.com/billing",
      status: 200,
      loadTimeMs: 400,
      ttfbMs: 120,
    });
    expect(byId(report.checks, "question-headings").status).toBe("pass");
    expect(byId(report.checks, "direct-answers").status).toBe("pass");
    expect(byId(report.checks, "faq-schema").status).toBe("pass");
    expect(byId(report.checks, "howto-schema").status).toBe("warn");
    expect(byId(report.checks, "https").status).toBe("pass");
    expect(report.facts.questionHeadings).toBe(4);
    expect(report.score).toBeGreaterThan(70);
  });

  it("fails a page with no questions, no schema and no viewport", () => {
    const report = analyzeVoiceSearchHtml({
      html: page("", "<h1>Acme</h1><p>Enterprise synergy platform.</p>"),
      finalUrl: "http://acme.com/",
      requestedUrl: "acme.com",
      status: 200,
    });
    expect(byId(report.checks, "question-headings").status).toBe("fail");
    expect(byId(report.checks, "https").status).toBe("fail");
    expect(byId(report.checks, "mobile").status).toBe("fail");
    expect(byId(report.checks, "h1").status).toBe("warn");
  });
});

describe("compliance", () => {
  it("flags trackers without a CMP, missing policies and weak headers", () => {
    const html = page(
      `<script src="https://www.googletagmanager.com/gtag/js?id=G-1"></script><script>fbq('init','1')</script><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">`,
      `<form><input type="email" name="email"><button>Join</button></form><img src="a.png"><img src="b.png" alt="B">`,
    );
    const report = scanComplianceHtml({ html, finalUrl: "https://acme.com/", requestedUrl: "acme.com", status: 200, headers: new Headers() });
    expect(byId(report.checks, "trackers").detail).toContain("Meta Pixel");
    expect(byId(report.checks, "cmp").status).toBe("fail");
    expect(byId(report.checks, "google-fonts").status).toBe("warn");
    expect(byId(report.checks, "privacy").status).toBe("fail");
    expect(byId(report.checks, "form-consent").status).toBe("warn");
    expect(byId(report.checks, "ccpa").status).toBe("warn");
    expect(byId(report.checks, "hsts").status).toBe("warn");
    expect(byId(report.checks, "alt").status).toBe("fail");
    expect(report.facts.consentManager).toBeNull();
  });

  it("passes a well-configured page", () => {
    const html = page(
      `<script src="https://consent.cookiebot.com/uc.js" data-cbid="x"></script><script src="https://www.googletagmanager.com/gtag/js?id=G-1"></script>`,
      `<footer><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/cookies">Cookie settings</a><a href="/contact">Contact</a><a href="/privacy-choices">Your Privacy Choices</a></footer>`,
    );
    const headers = new Headers({
      "strict-transport-security": "max-age=63072000",
      "content-security-policy": "default-src 'self'; frame-ancestors 'self'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "set-cookie": "sid=1; Path=/; Secure; HttpOnly; SameSite=Lax",
    });
    const report = scanComplianceHtml({ html, finalUrl: "https://acme.com/", requestedUrl: "acme.com", status: 200, headers });
    expect(byId(report.checks, "cmp").status).toBe("pass");
    expect(byId(report.checks, "cmp").title).toContain("Cookiebot");
    expect(byId(report.checks, "privacy").detail).toBe("https://acme.com/privacy");
    expect(byId(report.checks, "framing").status).toBe("pass");
    expect(byId(report.checks, "cookies").status).toBe("pass");
    expect(byId(report.checks, "ccpa").status).toBe("pass");
    expect(report.summary.fail).toBe(0);
  });
});

describe("llm readability", () => {
  const robots = `User-agent: *\nDisallow: /admin\n\nUser-agent: GPTBot\nUser-agent: CCBot\nDisallow: /\n\nUser-agent: PerplexityBot\nDisallow: /\nAllow: /\n\nSitemap: https://acme.com/sitemap.xml`;

  it("parses robots.txt groups and resolves per-agent access", () => {
    const parsed = parseRobots(robots);
    expect(parsed.groups).toHaveLength(3);
    expect(parsed.sitemaps).toEqual(["https://acme.com/sitemap.xml"]);
    expect(crawlerAccess(parsed, "GPTBot")).toEqual({ access: "blocked", via: "GPTBot" });
    expect(crawlerAccess(parsed, "ccbot", "/blog/post")).toEqual({ access: "blocked", via: "ccbot" });
    expect(crawlerAccess(parsed, "ClaudeBot", "/blog/post")).toEqual({ access: "allowed", via: "*" });
    expect(crawlerAccess(parsed, "ClaudeBot", "/admin/users")).toEqual({ access: "blocked", via: "*" });
    expect(crawlerAccess(parsed, "PerplexityBot").access).toBe("allowed");
  });

  it("applies longest-match with wildcards and end anchors", () => {
    const parsed = parseRobots("User-agent: *\nDisallow: /docs/\nAllow: /docs/public/\nDisallow: /*.pdf$\nDisallow: /search?*q=");
    expect(crawlerAccess(parsed, "GPTBot", "/docs/internal").access).toBe("blocked");
    expect(crawlerAccess(parsed, "GPTBot", "/docs/public/intro").access).toBe("allowed");
    expect(crawlerAccess(parsed, "GPTBot", "/files/report.pdf").access).toBe("blocked");
    expect(crawlerAccess(parsed, "GPTBot", "/files/report.pdf.html").access).toBe("allowed");
    expect(crawlerAccess(parsed, "GPTBot", "/search?lang=en&q=x").access).toBe("blocked");
    expect(crawlerAccess(parsed, "GPTBot", "/").access).toBe("allowed");
  });

  it("separates training blocks from search blocks and detects llms.txt", () => {
    const body = `<main><article><h1>Acme Ledger</h1><p>Acme Ledger is an invoicing app that helps freelancers get paid faster with automatic reminders.</p>
      <h2>What does it cost?</h2><p>${"Plans start at nine dollars a month. ".repeat(12)}</p>
      <h2>How do reminders work?</h2><ul><li>Day 1</li><li>Day 7</li></ul><table><tr><td>Plan</td></tr></table>
      <p>${"More detail about the product and how teams use it every day. ".repeat(40)}</p>
      <time datetime="2026-01-01">1 Jan 2026</time>
      <script type="application/ld+json">{"@type":"SoftwareApplication","author":{"@type":"Organization"},"dateModified":"2026-01-01"}</script></article></main>`;
    const report = analyzeLlmReadabilityHtml({
      html: page(`<link rel="canonical" href="https://acme.com/"><meta name="description" content="Acme Ledger is an invoicing app for freelancers with automatic payment reminders."><meta property="og:title" content="Acme">`, body),
      finalUrl: "https://acme.com/",
      requestedUrl: "acme.com",
      status: 200,
      bytes: 5000,
      robotsText: robots,
      llmsText: "# Acme Ledger\n\n> Invoicing for freelancers\n\n## Docs\n- [Getting started](https://acme.com/docs): setup",
    });
    expect(byId(report.checks, "robots").status).toBe("pass");
    expect(byId(report.checks, "robots").detail).toContain("GPTBot");
    expect(byId(report.checks, "llms-txt").status).toBe("pass");
    expect(byId(report.checks, "entity").status).toBe("pass");
    expect(byId(report.checks, "headings").status).toBe("pass");
    expect(byId(report.checks, "json-ld").status).toBe("pass");
    expect(byId(report.checks, "dates").status).toBe("pass");
    expect(byId(report.checks, "author").status).toBe("pass");
    expect(byId(report.checks, "semantic").status).toBe("pass");
    expect(report.crawlers.find((c) => c.agent === "GPTBot")?.access).toBe("blocked");
    expect(report.crawlers.find((c) => c.agent === "OAI-SearchBot")?.access).toBe("allowed");
    expect(report.llmsTxt.present).toBe(true);
    expect(report.robotsTxt.sitemaps).toHaveLength(1);
  });

  it("fails JavaScript-only pages and blanket robots blocks", () => {
    const report = analyzeLlmReadabilityHtml({
      html: page(`<script src="/a.js"></script><script src="/b.js"></script><script src="/c.js"></script><script src="/d.js"></script><script src="/e.js"></script><script src="/f.js"></script>`, `<div id="root"></div>`),
      finalUrl: "https://spa.com/",
      requestedUrl: "spa.com",
      status: 200,
      bytes: 800,
      robotsText: "User-agent: *\nDisallow: /",
      llmsText: null,
    });
    expect(byId(report.checks, "text-volume").status).toBe("fail");
    expect(byId(report.checks, "robots").status).toBe("fail");
    expect(byId(report.checks, "llms-txt").status).toBe("warn");
    expect(report.crawlers.every((c) => c.access === "blocked")).toBe(true);
  });
});
