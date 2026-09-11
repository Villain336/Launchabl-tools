import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

/**
 * Everyone — including AI search and training crawlers — may read the
 * public site. Only the admin dashboard and API routes are off limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
