import { attr, decodeEntities, fetchHtml, FetchPageError, mapLimit, normalizeUrl, tags } from "@/lib/web/fetch-page";

export type BacklinkFound = {
  href: string;
  anchor: string;
  rel: string | null;
  /** True when the link passes authority (no nofollow/sponsored/ugc). */
  follow: boolean;
  /** Exact target URL match vs. any page on the target domain. */
  exact: boolean;
};

export type BacklinkResult = {
  referrer: string;
  finalUrl: string | null;
  status: number | null;
  error?: string;
  /** Referring page allows indexing (no noindex, no X-Robots-Tag noindex). */
  indexable: boolean | null;
  /** Referring page's own canonical differs from its URL — the link may be attributed elsewhere. */
  canonicalMismatch: boolean;
  links: BacklinkFound[];
  verdict: "live" | "nofollow" | "domain-only" | "missing" | "unreachable";
  title: string | null;
};

export type BacklinkReport = {
  target: string;
  targetHost: string;
  checkedAt: string;
  summary: { checked: number; live: number; nofollow: number; domainOnly: number; missing: number; unreachable: number; skipped: number };
  results: BacklinkResult[];
};

const MAX_REFERRERS = 20;

function normalizeForCompare(u: URL) {
  return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "").toLowerCase() || "/"}`;
}

export function findLinksTo(html: string, pageUrl: string, target: URL): BacklinkFound[] {
  const targetHost = target.hostname.replace(/^www\./, "").toLowerCase();
  const targetKey = normalizeForCompare(target);
  const results: BacklinkFound[] = [];
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = match[0];
    const href = attr(tag, "href");
    if (!href) continue;
    let url: URL;
    try {
      url = new URL(href, pageUrl);
    } catch {
      continue;
    }
    if (url.hostname.replace(/^www\./, "").toLowerCase() !== targetHost) continue;
    const close = html.indexOf("</a>", match.index ?? 0);
    const innerHtml = close > 0 ? html.slice((match.index ?? 0) + tag.length, close) : "";
    const text = decodeEntities(innerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    const img = innerHtml.match(/<img\b[^>]*>/i)?.[0];
    const rel = attr(tag, "rel");
    results.push({
      href: url.toString(),
      anchor: text || (img ? `[image: ${attr(img, "alt") ?? "no alt"}]` : "[no text]"),
      rel,
      follow: !/\b(nofollow|sponsored|ugc)\b/i.test(rel ?? ""),
      exact: normalizeForCompare(url) === targetKey,
    });
  }
  return results;
}

export async function checkBacklinks(targetUrl: string, referrers: string[]): Promise<BacklinkReport> {
  const target = normalizeUrl(targetUrl);
  const targetIsHomepage = target.pathname === "/" || target.pathname === "";
  const unique = Array.from(new Set(referrers.map((r) => r.trim()).filter(Boolean)));
  const list = unique.slice(0, MAX_REFERRERS);

  const results = await mapLimit(list, 6, async (referrer): Promise<BacklinkResult> => {
    try {
      const raw = await fetchHtml(referrer, { timeoutMs: 10_000, maxBytes: 2_000_000 });
      const links = findLinksTo(raw.html, raw.finalUrl, target);
      const head = raw.html.slice(0, 200_000);
      const metas = tags(head, "meta");
      const robotsMeta = metas.find((t) => /^(robots|googlebot)$/i.test(attr(t, "name") ?? ""));
      const robotsHeader = raw.headers.get("x-robots-tag");
      const noindex = /noindex/i.test(`${robotsMeta ? attr(robotsMeta, "content") ?? "" : ""} ${robotsHeader ?? ""}`);
      const canonicalTag = tags(head, "link").find((t) => /canonical/i.test(attr(t, "rel") ?? ""));
      let canonicalMismatch = false;
      if (canonicalTag) {
        try {
          const c = new URL(attr(canonicalTag, "href") ?? "", raw.finalUrl);
          canonicalMismatch = normalizeForCompare(c) !== normalizeForCompare(new URL(raw.finalUrl));
        } catch {
          canonicalMismatch = false;
        }
      }
      const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const exact = links.filter((l) => l.exact || targetIsHomepage);
      const verdict: BacklinkResult["verdict"] =
        raw.status >= 400
          ? "unreachable"
          : exact.some((l) => l.follow)
            ? "live"
            : exact.length
              ? "nofollow"
              : links.length
                ? "domain-only"
                : "missing";
      return {
        referrer,
        finalUrl: raw.finalUrl,
        status: raw.status,
        indexable: !noindex,
        canonicalMismatch,
        links,
        verdict,
        title: titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")).slice(0, 120) : null,
      };
    } catch (error) {
      return {
        referrer,
        finalUrl: null,
        status: null,
        error: error instanceof FetchPageError ? error.message : "Couldn't fetch that page.",
        indexable: null,
        canonicalMismatch: false,
        links: [],
        verdict: "unreachable",
        title: null,
      };
    }
  });

  const count = (v: BacklinkResult["verdict"]) => results.filter((r) => r.verdict === v).length;
  const order: Record<BacklinkResult["verdict"], number> = { missing: 0, unreachable: 1, nofollow: 2, "domain-only": 3, live: 4 };
  results.sort((a, b) => order[a.verdict] - order[b.verdict]);

  return {
    target: target.toString(),
    targetHost: target.hostname.replace(/^www\./, ""),
    checkedAt: new Date().toISOString(),
    summary: {
      checked: results.length,
      live: count("live"),
      nofollow: count("nofollow"),
      domainOnly: count("domain-only"),
      missing: count("missing"),
      unreachable: count("unreachable"),
      skipped: unique.length - list.length,
    },
    results,
  };
}
