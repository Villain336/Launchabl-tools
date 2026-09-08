import type { Tool } from "@/lib/site-config";

/** Clay-style illustrations for each outcome cluster in the 3D marquee. */
export const CLUSTER_ART: Record<string, string> = {
  launch: "/marquee/marquee-launch.png",
  protect: "/marquee/marquee-protect.png",
  "get-found": "/marquee/marquee-seo.png",
  "convert-ship": "/marquee/marquee-convert.png",
  "audits-reports": "/marquee/marquee-audit.png",
  "create-produce": "/marquee/marquee-create.png",
};

/** Tool-specific art when a cluster image would be too generic. */
export const TOOL_ART: Record<string, string> = {
  "qr-code-generator": "/marquee/marquee-qr.png",
  copywriter: "/marquee/marquee-copy.png",
  "brand-creator": "/marquee/clay-identity.png",
  "brand-identity-kit": "/marquee/clay-identity.png",
  "content-campaign-calendar": "/marquee/clay-calendar.png",
  "white-label-report-builder": "/marquee/clay-report.png",
  "landing-page-grader": "/marquee/clay-landing.png",
  "competitor-gap-report": "/marquee/clay-gap.png",
  "watermark-generator": "/marquee/clay-watermark.png",
  "watermark-remover": "/marquee/clay-watermark.png",
  "website-audit-report": "/marquee/marquee-audit.png",
  "schema-generator": "/marquee/marquee-seo.png",
  "demo-video-creator": "/marquee/marquee-create.png",
  "image-converter": "/marquee/marquee-convert.png",
  "file-converter": "/marquee/marquee-convert.png",
  "ad-creative-resizer": "/marquee/marquee-convert.png",
  "metadata-remover": "/marquee/marquee-protect.png",
  "background-remover": "/marquee/marquee-convert.png",
  "local-seo-optimizer": "/marquee/marquee-seo.png",
  "sitemap-robots-generator": "/marquee/marquee-seo.png",
};

export const BRAND_LOGO = "/brand/logo.jpg";

export function artForTool(tool: Pick<Tool, "slug" | "cluster">): string {
  return TOOL_ART[tool.slug] ?? CLUSTER_ART[tool.cluster] ?? BRAND_LOGO;
}

export function artForCluster(clusterSlug: string): string {
  return CLUSTER_ART[clusterSlug] ?? BRAND_LOGO;
}
