import type { MetadataRoute } from "next";
import { siteConfig, tools } from "@/lib/site-config";
import { caseStudies } from "@/lib/case-studies";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/agent", priority: 0.9, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.9, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/solutions", priority: 0.7, changeFrequency: "monthly" },
  { path: "/case-studies", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.5, changeFrequency: "weekly" },
  { path: "/roadmap", priority: 0.4, changeFrequency: "monthly" },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/acceptable-use", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const url = (path: string) => `${siteConfig.url}${path}`;
  return [
    ...STATIC_PATHS.map((entry) => ({ url: url(entry.path), lastModified, changeFrequency: entry.changeFrequency, priority: entry.priority })),
    ...tools
      .filter((tool) => tool.status !== "coming-soon")
      .map((tool) => ({ url: url(`/tools/${tool.slug}`), lastModified, changeFrequency: "weekly" as const, priority: tool.status === "live" ? 0.8 : 0.6 })),
    ...caseStudies.map((study) => ({ url: url(`/case-studies/${study.slug}`), lastModified, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
