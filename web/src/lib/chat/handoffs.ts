import type { ChecklistReport } from "@/lib/web/checklist";
import { getToolBySlug } from "@/lib/site-config";

/**
 * Cross-tool handoffs: a failing check in one report links straight to the
 * tool that fixes it, with the prompt pre-filled. This is what makes the
 * free tools compound instead of dead-ending at a list of problems.
 */

export type Handoff = { slug: string; name: string; href: string; prompt: string | null };

type Target = { slug: string; prompt?: (url: string, report: ChecklistReport) => string };

const META = (url: string) => `Write the title tag, meta description and Open Graph tags for ${url}`;
const SCHEMA = (url: string) => `Write the JSON-LD structured data for ${url}`;
const SPEED = (url: string) => `Audit page speed for ${url}`;
const LINKS = (url: string) => `Check every link on ${url}`;
const CANONICAL = (url: string) => `Check the canonical tags on ${url}`;
const SITEMAP = (url: string) => `Generate a sitemap.xml and robots.txt for ${url}`;
const LLM = (url: string) => `Check how AI crawlers read ${url}`;
const LOCAL = (url: string) => `Build a local SEO kit for the business at ${url}`;
const COMPLIANCE = (url: string) => `Scan ${url} for privacy and compliance issues`;
const HEADLINE = (url: string, report: ChecklistReport) => {
  const headline = "headline" in report && typeof report.headline === "string" ? report.headline : null;
  return headline ? `Write 4 headline variants for this landing-page hero (${url}). Current: "${headline}"` : `Write 4 headline variants for the landing page at ${url}`;
};

const CHECK_TARGETS: Partial<Record<ChecklistReport["kind"], Record<string, Target>>> = {
  "website-audit": {
    title: { slug: "meta-tag-generator", prompt: META },
    description: { slug: "meta-tag-generator", prompt: META },
    og: { slug: "meta-tag-generator", prompt: META },
    twitter: { slug: "meta-tag-generator", prompt: META },
    schema: { slug: "schema-generator", prompt: SCHEMA },
    canonical: { slug: "canonical-tag-detector", prompt: CANONICAL },
    speed: { slug: "page-speed-audit", prompt: SPEED },
    weight: { slug: "page-speed-audit", prompt: SPEED },
    scripts: { slug: "page-speed-audit", prompt: SPEED },
    "blocking-scripts": { slug: "page-speed-audit", prompt: SPEED },
    compression: { slug: "page-speed-audit", prompt: SPEED },
    "internal-links": { slug: "broken-link-checker", prompt: LINKS },
    "dead-links": { slug: "broken-link-checker", prompt: LINKS },
    content: { slug: "llm-readability-check", prompt: LLM },
    "security-headers": { slug: "security-headers-checker" },
    https: { slug: "ssl-certificate-checker" },
    alt: { slug: "accessibility-checker" },
  },
  "landing-page": {
    headline: { slug: "ab-copy-variants", prompt: HEADLINE },
    subheadline: { slug: "ab-copy-variants", prompt: HEADLINE },
    "cta-wording": { slug: "ab-copy-variants", prompt: (url) => `Rewrite the call-to-action buttons on ${url} for higher clicks` },
    meta: { slug: "meta-tag-generator", prompt: META },
    speed: { slug: "page-speed-audit", prompt: SPEED },
    weight: { slug: "page-speed-audit", prompt: SPEED },
    privacy: { slug: "compliance-scanner", prompt: COMPLIANCE },
    https: { slug: "ssl-certificate-checker" },
  },
  "llm-readability": {
    "json-ld": { slug: "schema-generator", prompt: SCHEMA },
    "title-description": { slug: "meta-tag-generator", prompt: META },
    og: { slug: "meta-tag-generator", prompt: META },
    sitemap: { slug: "sitemap-robots-generator", prompt: SITEMAP },
    robots: { slug: "sitemap-robots-generator", prompt: SITEMAP },
    canonical: { slug: "canonical-tag-detector", prompt: CANONICAL },
  },
  "voice-search": {
    title: { slug: "meta-tag-generator", prompt: META },
    "local-schema": { slug: "local-seo-optimizer", prompt: LOCAL },
    "howto-schema": { slug: "schema-generator", prompt: SCHEMA },
    speed: { slug: "page-speed-audit", prompt: SPEED },
    https: { slug: "ssl-certificate-checker" },
  },
  compliance: {
    csp: { slug: "security-headers-checker" },
    hsts: { slug: "security-headers-checker" },
    framing: { slug: "security-headers-checker" },
    "misc-headers": { slug: "security-headers-checker" },
    https: { slug: "ssl-certificate-checker" },
    alt: { slug: "accessibility-checker" },
  },
};

/** The tool that fixes a failing check, or null when the fix belongs in this report's own conversation. */
export function handoffFor(report: ChecklistReport, checkId: string, currentSlug: string): Handoff | null {
  const target = CHECK_TARGETS[report.kind]?.[checkId];
  if (!target || target.slug === currentSlug) return null;
  const tool = getToolBySlug(target.slug);
  if (!tool || tool.status === "coming-soon") return null;
  const prompt = target.prompt ? target.prompt(report.finalUrl, report) : null;
  const href = prompt ? `/tools/${target.slug}?q=${encodeURIComponent(prompt)}` : `/tools/${target.slug}`;
  return { slug: target.slug, name: tool.name, href, prompt };
}
