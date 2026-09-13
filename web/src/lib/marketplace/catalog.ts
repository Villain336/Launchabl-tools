/**
 * Public-catalog disposition for the ~50 tools (`docs/STRATEGY.md` §25.2).
 * Code stays in the repo — the agency still uses a bigger suite than the
 * self-serve OS — but cut tools leave the public /tools explorer, sitemap,
 * and llms.txt. Repurposed tools stay reachable by URL (OS/agency) without
 * being sold as a horizontal toolbox.
 */
import { tools, type Tool } from "@/lib/site-config";

export type ToolCatalog = "public" | "os" | "retired";

const PUBLIC_SEO = new Set([
  "website-audit-report",
  "landing-page-grader",
  "competitor-gap-report",
  "page-speed-audit",
  "broken-link-checker",
  "canonical-tag-detector",
  "backlink-health-check",
  "voice-search-optimizer",
  "llm-readability-check",
  "security-headers-checker",
  "ssl-certificate-checker",
  "accessibility-checker",
  "dns-email-health",
  "compliance-scanner",
  "meta-tag-generator",
  "sitemap-robots-generator",
  "schema-generator",
  "local-seo-optimizer",
]);

const REPURPOSED = new Set([
  "brand-creator",
  "brand-identity-kit",
  "domain-availability",
  "domain-purchase",
  "hosting",
  "social-card-generator",
  "ai-image-generator",
  "qr-code-generator",
  "utm-builder",
  "markdown-file-generator",
]);

const RETIRED = new Set([
  "ab-copy-variants",
  "watermark-generator",
  "watermark-remover",
  "metadata-remover",
  "file-converter",
  "image-converter",
  "agent-skill-generator",
  "dataset-builder",
  "ad-creative-resizer",
  "content-campaign-calendar",
  "white-label-report-builder",
  "email-newsletter-builder",
  "email-finder",
  "persona-generator",
  "subject-line-checker",
  "press-release-generator",
  "qa-test-plan-generator",
  "content-repurposer",
  "transcriber",
  "clip-finder",
  "background-remover",
  "demo-video-creator",
]);

export function toolCatalog(slug: string): ToolCatalog {
  if (PUBLIC_SEO.has(slug)) return "public";
  if (REPURPOSED.has(slug)) return "os";
  if (RETIRED.has(slug)) return "retired";
  return "public";
}

export function publicTools(): Tool[] {
  return tools.filter((tool) => toolCatalog(tool.slug) === "public");
}

export function catalogTools(catalog: ToolCatalog): Tool[] {
  return tools.filter((tool) => toolCatalog(tool.slug) === catalog);
}
