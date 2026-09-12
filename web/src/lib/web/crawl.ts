import { FETCH_HEADERS, fetchHtml, mapLimit, normalizeUrl } from "@/lib/web/fetch-page";
import { extractLinks } from "@/lib/web/links";
import { pageTitle, metaContent } from "@/lib/web/html";
import { parseRobots } from "@/lib/web/llm-readability";

/**
 * Bounded same-host crawl used to build a sitemap from what's actually
 * linked. Breadth-first, a couple of levels deep, capped in pages and
 * time so it stays inside one request.
 */

export type CrawledPage = {
  url: string;
  status: number | null;
  title: string | null;
  depth: number;
  /** Excluded from the sitemap and why (noindex, redirect target elsewhere, error…). */
  excluded: string | null;
  lastModified: string | null;
};

export type CrawlResult = {
  startUrl: string;
  host: string;
  pages: CrawledPage[];
  /** Links discovered but not fetched because the page cap was hit. */
  unfetched: number;
  robots: { exists: boolean; sitemaps: string[]; disallowed: string[] };
  existingSitemap: { url: string; status: number | null } | null;
  durationMs: number;
};

const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|css|js|mjs|json|xml|xsd|xsl|txt|pdf|zip|gz|mp4|mp3|webm|woff2?|ttf|eot)$/i;
const SKIP_PATH = /\/(wp-admin|wp-json|cdn-cgi|_next|api|feed|tag|tags|author|search|cart|checkout|account|login|logout|signin|signup|admin)(\/|$)/i;

/** Normalise a same-site URL: drop fragments and tracking params, and fold www/non-www onto the start host. */
function canonicalKey(url: URL, startHost: string): string {
  const u = new URL(url.toString());
  u.hash = "";
  if (u.hostname.replace(/^www\./, "") === startHost.replace(/^www\./, "")) u.hostname = startHost;
  // Tracking params never belong in a sitemap.
  for (const key of Array.from(u.searchParams.keys())) if (/^(utm_|fbclid|gclid|ref$|source$)/i.test(key)) u.searchParams.delete(key);
  return u.toString();
}

export async function crawlSite(
  rawUrl: string,
  { maxPages = 100, maxDepth = 2, budgetMs = 22_000, exclude = [] as string[] } = {},
): Promise<CrawlResult> {
  const started = Date.now();
  const start = normalizeUrl(rawUrl);
  const startHost = start.hostname;
  const host = startHost.replace(/^www\./, "");
  const key = (u: URL) => canonicalKey(u, startHost);
  const excludePatterns = exclude.map((p) => p.trim()).filter(Boolean);
  const isExcluded = (path: string) => excludePatterns.some((p) => (p.endsWith("*") ? path.startsWith(p.slice(0, -1)) : path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`)));

  const [robotsRes, sitemapRes] = await Promise.all([
    fetch(new URL("/robots.txt", start), { headers: FETCH_HEADERS, signal: AbortSignal.timeout(5_000) }).catch(() => null),
    fetch(new URL("/sitemap.xml", start), { method: "HEAD", headers: FETCH_HEADERS, signal: AbortSignal.timeout(5_000) }).catch(() => null),
  ]);
  const robotsText = robotsRes?.ok ? await robotsRes.text().catch(() => "") : "";
  const parsed = robotsText ? parseRobots(robotsText) : { groups: [], sitemaps: [] as string[] };
  const disallowed = Array.from(new Set(parsed.groups.filter((g) => g.agents.includes("*")).flatMap((g) => g.disallow))).filter(Boolean).slice(0, 30);

  const seen = new Map<string, CrawledPage>();
  const queue: { url: string; depth: number }[] = [{ url: key(start), depth: 0 }];
  let unfetched = 0;

  const enqueue = (candidate: string, depth: number) => {
    let u: URL;
    try {
      u = new URL(candidate);
    } catch {
      return;
    }
    if (u.hostname.replace(/^www\./, "") !== host) return;
    if (SKIP_EXT.test(u.pathname) || SKIP_PATH.test(u.pathname)) return;
    const normalized = key(u);
    if (seen.has(normalized) || queue.some((q) => q.url === normalized)) return;
    if (seen.size + queue.length >= maxPages) {
      unfetched++;
      return;
    }
    queue.push({ url: normalized, depth });
  };

  while (queue.length && Date.now() - started < budgetMs) {
    const batch = queue.splice(0, 6);
    for (const item of batch) seen.set(item.url, { url: item.url, status: null, title: null, depth: item.depth, excluded: null, lastModified: null });
    await mapLimit(batch, 6, async ({ url, depth }) => {
      const page = seen.get(url)!;
      const path = new URL(url).pathname;
      if (isExcluded(path)) {
        page.excluded = "excluded by pattern";
        return;
      }
      try {
        const raw = await fetchHtml(url, { timeoutMs: 8_000, maxBytes: 600_000 });
        page.status = raw.status;
        page.title = pageTitle(raw.html);
        page.lastModified = raw.headers.get("last-modified");
        const finalUrl = new URL(raw.finalUrl);
        const sameSite = finalUrl.hostname.replace(/^www\./, "") === host;
        const finalKey = key(finalUrl);
        if (raw.status >= 400) page.excluded = `HTTP ${raw.status}`;
        else if (!sameSite) page.excluded = `redirects off-site to ${finalUrl.hostname}`;
        else if (finalKey !== url) {
          page.excluded = `redirects to ${finalUrl.pathname}`;
          enqueue(finalKey, depth);
        } else if (/noindex/i.test(metaContent(raw.html, "name", "robots") ?? "") || /noindex/i.test(raw.headers.get("x-robots-tag") ?? "")) page.excluded = "noindex";
        else if (raw.contentType && !/html/i.test(raw.contentType)) page.excluded = "not HTML";
        if (depth < maxDepth && !page.excluded) {
          for (const link of extractLinks(raw.html, raw.finalUrl)) if (link.kind === "internal") enqueue(link.url, depth + 1);
        }
      } catch (error) {
        page.excluded = (error as Error).message || "fetch failed";
      }
    });
  }
  unfetched += queue.length;

  return {
    startUrl: start.toString(),
    host,
    pages: Array.from(seen.values()).sort((a, b) => a.depth - b.depth || a.url.localeCompare(b.url)),
    unfetched,
    robots: { exists: Boolean(robotsRes?.ok), sitemaps: parsed.sitemaps, disallowed },
    existingSitemap: sitemapRes ? { url: new URL("/sitemap.xml", start).toString(), status: sitemapRes.status } : null,
    durationMs: Date.now() - started,
  };
}

/* ── File builders ─────────────────────────────────────── */

const xmlEscape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export type SitemapOptions = {
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" | null;
  includeLastmod?: boolean;
  /** Priority for the start URL; other pages get lower priority by depth. */
  homePriority?: number;
};

export function buildSitemapXml(pages: CrawledPage[], { changefreq = null, includeLastmod = true, homePriority = 1 }: SitemapOptions = {}): string {
  const rows = pages
    .filter((p) => !p.excluded && (p.status === null || p.status < 400))
    .map((p) => {
      const parts = [`    <loc>${xmlEscape(p.url)}</loc>`];
      const lastmod = includeLastmod && p.lastModified ? new Date(p.lastModified) : null;
      if (lastmod && !Number.isNaN(lastmod.getTime())) parts.push(`    <lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>`);
      if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
      const priority = Math.max(0.3, Math.round((homePriority - p.depth * 0.2) * 10) / 10);
      parts.push(`    <priority>${priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</urlset>\n`;
}

export type RobotsOptions = {
  sitemapUrl: string;
  disallow?: string[];
  /** Block training-only AI crawlers while leaving AI search crawlers alone. */
  blockAiTraining?: boolean;
  /** Block every known AI crawler, including search/user-fetch agents. */
  blockAllAi?: boolean;
  crawlDelay?: number | null;
};

const AI_TRAINING_AGENTS = ["GPTBot", "Google-Extended", "CCBot", "anthropic-ai", "Applebot-Extended", "Bytespider", "Meta-ExternalAgent", "Amazonbot", "cohere-ai", "Diffbot"];
const AI_SEARCH_AGENTS = ["OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "DuckAssistBot", "YouBot", "MistralAI-User"];

export function buildRobotsTxt({ sitemapUrl, disallow = [], blockAiTraining = false, blockAllAi = false, crawlDelay = null }: RobotsOptions): string {
  const lines: string[] = ["User-agent: *"];
  const rules = disallow.map((p) => p.trim()).filter(Boolean);
  if (rules.length === 0) lines.push("Allow: /");
  for (const rule of rules) lines.push(`Disallow: ${rule.startsWith("/") ? rule : `/${rule}`}`);
  if (crawlDelay) lines.push(`Crawl-delay: ${crawlDelay}`);
  const blocked = blockAllAi ? [...AI_TRAINING_AGENTS, ...AI_SEARCH_AGENTS] : blockAiTraining ? AI_TRAINING_AGENTS : [];
  if (blocked.length) {
    lines.push("", `# ${blockAllAi ? "AI crawlers" : "AI training crawlers (AI search crawlers stay allowed so the site can still be cited)"}`);
    for (const agent of blocked) lines.push(`User-agent: ${agent}`);
    lines.push("Disallow: /");
  }
  lines.push("", `Sitemap: ${sitemapUrl}`, "");
  return lines.join("\n");
}
