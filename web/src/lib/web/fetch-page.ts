/**
 * Shared page fetcher for SEO / performance / compliance tools.
 *
 * Plain fetch + tolerant regex parsing: enough for server-rendered markup,
 * which is what search engines index first anyway. Everything downstream
 * (meta tags, canonical checks, voice-search analysis, LLM-readability)
 * consumes `PageSnapshot`, so a headless-browser fetcher can be swapped in
 * later without touching the tools.
 */

export type PageSnapshot = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  fetchedAt: string;
  loadTimeMs: number;
  sizeKb: number;
  lang: string | null;
  title: string | null;
  metaDescription: string | null;
  metaRobots: string | null;
  canonical: string | null;
  viewport: string | null;
  og: Record<string, string>;
  twitter: Record<string, string>;
  hreflang: { lang: string; href: string }[];
  h1: string[];
  h2: string[];
  jsonLdTypes: string[];
  wordCount: number;
  /** First ~1,500 characters of visible text — enough context for a model without shipping the page. */
  excerpt: string;
  links: { total: number; internal: number; external: number };
  images: { total: number; withAlt: number };
};

export class FetchPageError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_url" | "blocked" | "timeout" | "http" | "not_html" | "network",
  ) {
    super(message);
    this.name = "FetchPageError";
  }
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.0\.0\.0|\[?::1\]?$|.*\.local$|.*\.internal$)/i;

export function normalizeUrl(raw: string): URL {
  const text = raw.trim();
  if (!text) throw new FetchPageError("Enter a URL.", "invalid_url");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    throw new FetchPageError("That doesn't look like a valid URL.", "invalid_url");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchPageError("Only http and https URLs can be fetched.", "invalid_url");
  }
  if (PRIVATE_HOST.test(url.hostname) || !url.hostname.includes(".")) {
    throw new FetchPageError("That host can't be fetched from here.", "blocked");
  }
  url.hash = "";
  return url;
}

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .trim();

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function tags(html: string, name: string): string[] {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))).map((m) => m[0]);
}

function inner(html: string, name: string, limit = 20): string[] {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "gi")))
    .slice(0, limit)
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")))
    .filter(Boolean);
}

function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

export function parseHtml(html: string, requestedUrl: string, finalUrl: string): Omit<
  PageSnapshot,
  "status" | "contentType" | "fetchedAt" | "loadTimeMs" | "sizeKb"
> {
  const head = html.slice(0, 200_000);
  const metas = tags(head, "meta");
  const metaBy = (key: "name" | "property", value: string) => {
    const tag = metas.find((t) => (attr(t, key) ?? "").toLowerCase() === value.toLowerCase());
    return tag ? attr(tag, "content") : null;
  };
  const og: Record<string, string> = {};
  const twitter: Record<string, string> = {};
  for (const tag of metas) {
    const prop = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (!content) continue;
    if (prop.startsWith("og:")) og[prop.slice(3)] = content;
    if (prop.startsWith("twitter:")) twitter[prop.slice(8)] = content;
  }

  const links = tags(head, "link");
  const canonicalTag = links.find((t) => /\bcanonical\b/i.test(attr(t, "rel") ?? ""));
  const hreflang = links
    .filter((t) => /\balternate\b/i.test(attr(t, "rel") ?? "") && attr(t, "hreflang"))
    .map((t) => ({ lang: attr(t, "hreflang")!, href: attr(t, "href") ?? "" }));

  const jsonLdTypes = Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi))
    .flatMap((m) => Array.from(m[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g)).map((t) => t[1]))
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const anchors = tags(html, "a");
  let internal = 0;
  let external = 0;
  const host = new URL(finalUrl).hostname.replace(/^www\./, "");
  for (const a of anchors) {
    const href = attr(a, "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|javascript):/i.test(href)) continue;
    try {
      const target = new URL(href, finalUrl);
      if (target.hostname.replace(/^www\./, "") === host) internal++;
      else external++;
    } catch {
      // ignore malformed hrefs
    }
  }

  const imgs = tags(html, "img");
  const text = visibleText(html);
  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const htmlTag = head.match(/<html\b[^>]*>/i)?.[0] ?? "";

  return {
    requestedUrl,
    finalUrl,
    lang: attr(htmlTag, "lang"),
    title: titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")) : null,
    metaDescription: metaBy("name", "description"),
    metaRobots: metaBy("name", "robots"),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    viewport: metaBy("name", "viewport"),
    og,
    twitter,
    hreflang,
    h1: inner(html, "h1", 10),
    h2: inner(html, "h2", 15),
    jsonLdTypes,
    wordCount: text ? text.split(/\s+/).length : 0,
    excerpt: text.slice(0, 1_500),
    links: { total: internal + external, internal, external },
    images: { total: imgs.length, withAlt: imgs.filter((t) => (attr(t, "alt") ?? "").length > 0).length },
  };
}

export async function fetchPage(rawUrl: string, { timeoutMs = 10_000, maxBytes = 1_500_000 } = {}): Promise<PageSnapshot> {
  const url = normalizeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LaunchablBot/1.0; +https://launchabl.com/tools)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "en",
      },
    });
  } catch (error) {
    clearTimeout(timer);
    if ((error as Error).name === "AbortError") throw new FetchPageError("The site took too long to respond.", "timeout");
    throw new FetchPageError("Couldn't reach that site.", "network");
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !/html|xml/i.test(contentType)) {
    clearTimeout(timer);
    throw new FetchPageError(`That URL returned ${contentType.split(";")[0]}, not a web page.`, "not_html");
  }

  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  if (reader) {
    for (;;) {
      const { value, done } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      received += value.byteLength;
      if (received >= maxBytes) {
        reader.cancel().catch(() => undefined);
        break;
      }
    }
  }
  clearTimeout(timer);
  const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
  const loadTimeMs = Date.now() - started;

  if (response.status >= 400 && !html) {
    throw new FetchPageError(`The site responded with HTTP ${response.status}.`, "http");
  }

  return {
    ...parseHtml(html, rawUrl, response.url || url.toString()),
    status: response.status,
    contentType,
    fetchedAt: new Date().toISOString(),
    loadTimeMs,
    sizeKb: Math.round(received / 1024),
  };
}
