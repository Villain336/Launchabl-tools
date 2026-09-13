import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { publicTools } from "@/lib/marketplace/catalog";
import { FOUNDING_LISTINGS } from "@/lib/marketplace/founding";
import { NC_CITIES } from "@/lib/marketplace/cities";
import { TRADES } from "@/lib/service-business/profile";
import { caseStudies } from "@/lib/case-studies";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/agent", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ide", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/os", priority: 0.8, changeFrequency: "weekly" },
  { path: "/os/storefront", priority: 0.6, changeFrequency: "weekly" },
  { path: "/os/dashboard", priority: 0.5, changeFrequency: "weekly" },
  { path: "/os/schedule", priority: 0.5, changeFrequency: "weekly" },
  { path: "/os/inventory", priority: 0.5, changeFrequency: "weekly" },
  { path: "/os/warranty", priority: 0.5, changeFrequency: "weekly" },
  { path: "/os/automations", priority: 0.5, changeFrequency: "weekly" },
  { path: "/agency", priority: 0.8, changeFrequency: "weekly" },
  { path: "/nc", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/solutions", priority: 0.7, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/roadmap", priority: 0.4, changeFrequency: "monthly" },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/acceptable-use", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/subprocessors", priority: 0.2, changeFrequency: "monthly" },
  { path: "/legal/dpa", priority: 0.2, changeFrequency: "yearly" },
  { path: "/security", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${siteConfig.url}${path}`;
  return [
    ...STATIC_PATHS.map((entry) => ({ url: url(entry.path), lastModified, changeFrequency: entry.changeFrequency, priority: entry.priority })),
    ...publicTools()
      .filter((tool) => tool.status !== "coming-soon")
      .map((tool) => ({ url: url(`/tools/${tool.slug}`), lastModified, changeFrequency: "weekly" as const, priority: tool.status === "live" ? 0.8 : 0.6 })),
    ...NC_CITIES.map((city) => ({ url: url(`/nc/${city.slug}`), lastModified, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...NC_CITIES.flatMap((city) =>
      TRADES.map((trade) => ({ url: url(`/nc/${city.slug}/${trade}`), lastModified, changeFrequency: "weekly" as const, priority: 0.65 })),
    ),
    ...FOUNDING_LISTINGS.flatMap((listing) =>
      listing.cities.flatMap((city) =>
        listing.trades.map((trade) => ({
          url: url(`/nc/${city}/${trade}/${listing.slug}`),
          lastModified,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
      ),
    ),
    ...caseStudies.map((study) => ({ url: url(`/case-studies/${study.slug}`), lastModified, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
