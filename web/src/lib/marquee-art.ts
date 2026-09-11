import type { Tool } from "@/lib/site-config";

/** Clay-style illustrations, one per tool, used in the 3D marquee and tool cards. */
export const TOOL_ART: Record<string, string> = {
  "qr-code-generator": "/marquee/marquee-qr.png",
  copywriter: "/marquee/marquee-copy.png",
  "ab-copy-variants": "/marquee/marquee-copy.png",
  "brand-creator": "/marquee/clay-identity.png",
  "brand-identity-kit": "/marquee/clay-identity.png",
  "content-campaign-calendar": "/marquee/clay-calendar.png",
  "white-label-report-builder": "/marquee/clay-report.png",
  "landing-page-grader": "/marquee/clay-landing.png",
  "competitor-gap-report": "/marquee/clay-gap.png",
  "watermark-generator": "/marquee/clay-watermark.png",
  "watermark-remover": "/marquee/clay-watermark.png",
  "website-audit-report": "/marquee/marquee-audit.png",
  "dns-email-health": "/marquee/marquee-audit.png",
  "broken-link-checker": "/marquee/marquee-audit.png",
  "accessibility-checker": "/marquee/marquee-audit.png",
  "security-headers-checker": "/marquee/marquee-audit.png",
  "ssl-certificate-checker": "/marquee/marquee-audit.png",
  "email-finder": "/marquee/marquee-audit.png",
  "schema-generator": "/marquee/marquee-seo.png",
  "meta-tag-generator": "/marquee/marquee-seo.png",
  "local-seo-optimizer": "/marquee/marquee-seo.png",
  "sitemap-robots-generator": "/marquee/marquee-seo.png",
  "demo-video-creator": "/marquee/marquee-create.png",
  "image-converter": "/marquee/marquee-convert.png",
  "file-converter": "/marquee/marquee-convert.png",
  "ad-creative-resizer": "/marquee/marquee-convert.png",
  "background-remover": "/marquee/marquee-convert.png",
  "metadata-remover": "/marquee/marquee-protect.png",
  "domain-availability": "/marquee/marquee-launch.png",
  "domain-purchase": "/marquee/marquee-launch.png",
  hosting: "/marquee/marquee-launch.png",
  "markdown-file-generator": "/marquee/clay-report.png",
  "agent-skill-generator": "/marquee/clay-report.png",
  "dataset-builder": "/marquee/clay-report.png",
  "canonical-tag-detector": "/marquee/marquee-seo.png",
  "page-speed-audit": "/marquee/marquee-audit.png",
  "backlink-health-check": "/marquee/marquee-seo.png",
  "voice-search-optimizer": "/marquee/marquee-seo.png",
  "compliance-scanner": "/marquee/marquee-protect.png",
  "llm-readability-check": "/marquee/marquee-seo.png",
  "email-newsletter-builder": "/marquee/marquee-copy.png",
};

export const BRAND_LOGO = "/brand/logo.jpg";

export function artForTool(tool: Pick<Tool, "slug">): string {
  return TOOL_ART[tool.slug] ?? BRAND_LOGO;
}
