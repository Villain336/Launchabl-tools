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
};

export const BRAND_LOGO = "/brand/logo.jpg";

export function artForTool(tool: Pick<Tool, "slug" | "cluster">): string {
  return TOOL_ART[tool.slug] ?? CLUSTER_ART[tool.cluster] ?? BRAND_LOGO;
}

export function artForCluster(clusterSlug: string): string {
  return CLUSTER_ART[clusterSlug] ?? BRAND_LOGO;
}
