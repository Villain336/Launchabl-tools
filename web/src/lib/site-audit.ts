// Shared server-side audit engine.
//
// Production notes: v1 uses a plain `fetch` + regex-based HTML parsing, which
// is enough to score static/server-rendered markup. A production version
// should add a headless-browser fallback (for JS-rendered sites) and real
// performance data (e.g. a Core Web Vitals API) rather than the load-time
// heuristic used here. The shape of `AuditResult` is intentionally stable so
// every tool built on top of it (Website Audit, Landing Page Grader,
// Competitor Gap Report) can keep working if the internals improve.

export type AuditFinding = {
  id: string;
  label: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  detail: string;
};

export type AuditResult = {
  url: string;
  fetchedAt: string;
  loadTimeMs: number;
  pageSizeKb: number;
  isHttps: boolean;
  title: string | null;
  metaDescription: string | null;
  hasViewportMeta: boolean;
  h1Count: number;
  wordCount: number;
  schemaTypes: string[];
  ogTags: { title: boolean; description: boolean; image: boolean };
  images: { total: number; withAlt: number };
  forms: number;
  ctaKeywordCount: number;
  hasPhoneNumber: boolean;
  hasTestimonialSignal: boolean;
  score: number;
  findings: AuditFinding[];
};

function matchAll(html: string, regex: RegExp): string[] {
  return Array.from(html.matchAll(regex)).map((m) => m[0]);
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CTA_KEYWORDS = [
  "buy now",
  "sign up",
  "get started",
  "book a call",
  "book now",
  "contact us",
  "learn more",
  "get a quote",
  "request a demo",
  "start free trial",
  "subscribe",
  "download",
];

export async function auditUrl(rawUrl: string): Promise<AuditResult> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  const parsed = new URL(url);
  const start = Date.now();

  const res = await fetch(parsed.toString(), {
    redirect: "follow",
    headers: { "User-Agent": "LaunchablAuditBot/1.0 (+https://launchabl.example/tools)" },
    signal: AbortSignal.timeout(12000),
  });

  const html = await res.text();
  const loadTimeMs = Date.now() - start;
  const pageSizeKb = Math.round((new TextEncoder().encode(html).length / 1024) * 10) / 10;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : null;

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : null;

  const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
  const h1Count = matchAll(html, /<h1[\s>]/gi).length;
  const wordCount = stripTags(html).split(/\s+/).filter(Boolean).length;

  const schemaBlocks = matchAll(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const schemaTypes = new Set<string>();
  for (const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(block[1]);
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const type = item["@type"];
        if (typeof type === "string") schemaTypes.add(type);
        else if (Array.isArray(type)) type.forEach((t) => schemaTypes.add(String(t)));
      }
    } catch {
      // malformed JSON-LD — ignore for scoring, still counts as "has schema" below
    }
  }

  const ogTags = {
    title: /<meta[^>]+property=["']og:title["']/i.test(html),
    description: /<meta[^>]+property=["']og:description["']/i.test(html),
    image: /<meta[^>]+property=["']og:image["']/i.test(html),
  };

  const imgTags = matchAll(html, /<img\b[^>]*>/gi);
  const imagesWithAlt = imgTags.filter((tag) => /\balt=["'][^"']+["']/i.test(tag)).length;

  const forms = matchAll(html, /<form[\s>]/gi).length;

  const lowerText = stripTags(html).toLowerCase();
  const ctaKeywordCount = CTA_KEYWORDS.reduce(
    (count, kw) => count + (lowerText.includes(kw) ? 1 : 0),
    0,
  );
  const hasPhoneNumber = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(html);
  const hasTestimonialSignal = /(testimonial|reviews?|verified purchase|★★★|customers say)/i.test(html);

  const findings: AuditFinding[] = [
    {
      id: "https",
      label: "Uses HTTPS",
      passed: parsed.protocol === "https:",
      severity: "critical",
      detail:
        parsed.protocol === "https:"
          ? "Site is served over HTTPS."
          : "Site is not served over HTTPS — this hurts trust and SEO rankings directly.",
    },
    {
      id: "title",
      label: "Has a page title",
      passed: Boolean(title && title.length > 0),
      severity: "critical",
      detail: title ? `Title: "${title}" (${title.length} characters)` : "No <title> tag found.",
    },
    {
      id: "meta-description",
      label: "Has a meta description",
      passed: Boolean(metaDescription),
      severity: "warning",
      detail: metaDescription
        ? `Description found (${metaDescription.length} characters).`
        : "No meta description — search engines will generate their own snippet.",
    },
    {
      id: "viewport",
      label: "Mobile viewport tag present",
      passed: hasViewportMeta,
      severity: "critical",
      detail: hasViewportMeta
        ? "Viewport meta tag found."
        : "Missing viewport meta tag — page likely isn't mobile-responsive.",
    },
    {
      id: "h1",
      label: "Exactly one H1 heading",
      passed: h1Count === 1,
      severity: "warning",
      detail: `Found ${h1Count} <h1> tag(s). Aim for exactly one per page.`,
    },
    {
      id: "schema",
      label: "Has structured data (JSON-LD)",
      passed: schemaBlocks.length > 0,
      severity: "warning",
      detail:
        schemaBlocks.length > 0
          ? `Found ${schemaBlocks.length} schema block(s): ${Array.from(schemaTypes).join(", ") || "type unreadable"}.`
          : "No JSON-LD structured data found — see the Schema Markup Generator.",
    },
    {
      id: "og-tags",
      label: "Open Graph tags present",
      passed: ogTags.title && ogTags.description && ogTags.image,
      severity: "info",
      detail: `og:title ${ogTags.title ? "✓" : "✗"}, og:description ${ogTags.description ? "✓" : "✗"}, og:image ${ogTags.image ? "✓" : "✗"}.`,
    },
    {
      id: "image-alt",
      label: "Images have alt text",
      passed: imgTags.length === 0 || imagesWithAlt / imgTags.length >= 0.9,
      severity: "warning",
      detail:
        imgTags.length === 0
          ? "No <img> tags found."
          : `${imagesWithAlt}/${imgTags.length} images have alt text.`,
    },
    {
      id: "word-count",
      label: "Sufficient page content",
      passed: wordCount >= 250,
      severity: "info",
      detail: `Approximately ${wordCount} words of visible text.`,
    },
    {
      id: "load-time",
      label: "Responds quickly",
      passed: loadTimeMs < 1500,
      severity: "warning",
      detail: `Server responded in ${loadTimeMs}ms.`,
    },
  ];

  const weights: Record<string, number> = {
    https: 15,
    title: 15,
    "meta-description": 10,
    viewport: 15,
    h1: 8,
    schema: 12,
    "og-tags": 8,
    "image-alt": 7,
    "word-count": 5,
    "load-time": 5,
  };
  const maxScore = Object.values(weights).reduce((a, b) => a + b, 0);
  const rawScore = findings.reduce((sum, f) => sum + (f.passed ? weights[f.id] ?? 0 : 0), 0);
  const score = Math.round((rawScore / maxScore) * 100);

  return {
    url: parsed.toString(),
    fetchedAt: new Date().toISOString(),
    loadTimeMs,
    pageSizeKb,
    isHttps: parsed.protocol === "https:",
    title,
    metaDescription,
    hasViewportMeta,
    h1Count,
    wordCount,
    schemaTypes: Array.from(schemaTypes),
    ogTags,
    images: { total: imgTags.length, withAlt: imagesWithAlt },
    forms,
    ctaKeywordCount,
    hasPhoneNumber,
    hasTestimonialSignal,
    score,
    findings,
  };
}
