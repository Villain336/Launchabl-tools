import { attr, decodeEntities, fetchHtml, mapLimit, probeUrl } from "@/lib/web/fetch-page";

export type LinkKind = "internal" | "external";

export type LinkResult = {
  url: string;
  anchor: string;
  kind: LinkKind;
  status: number | null;
  ok: boolean;
  redirectedTo: string | null;
  error?: string;
  /** Where the href appears — helps the user find it in their source. */
  occurrences: number;
  /** Deterministic repair candidates for broken links, best first. */
  suggestions: { url: string; reason: string; verified: boolean }[];
};

export type LinkReport = {
  pageUrl: string;
  finalUrl: string;
  scannedAt: string;
  totals: { found: number; checked: number; ok: number; broken: number; redirected: number; skipped: number };
  links: LinkResult[];
};

const MAX_LINKS = 60;
const CONCURRENCY = 8;

function anchorText(tag: string, html: string, index: number): string {
  const close = html.indexOf("</a>", index);
  if (close < 0) return "";
  const innerHtml = html.slice(index + tag.length, close);
  const text = decodeEntities(innerHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  if (text) return text.slice(0, 80);
  const img = innerHtml.match(/<img\b[^>]*>/i)?.[0];
  return img ? `[image: ${attr(img, "alt") ?? "no alt"}]` : "";
}

export function extractLinks(html: string, baseUrl: string): { url: string; anchor: string; kind: LinkKind; occurrences: number }[] {
  const base = new URL(baseUrl);
  const host = base.hostname.replace(/^www\./, "");
  const found = new Map<string, { url: string; anchor: string; kind: LinkKind; occurrences: number }>();
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(match[0], "href");
    if (!href || href.startsWith("#") || /^(mailto|tel|sms|javascript|data):/i.test(href)) continue;
    let url: URL;
    try {
      url = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") continue;
    url.hash = "";
    const key = url.toString();
    const existing = found.get(key);
    if (existing) {
      existing.occurrences++;
      continue;
    }
    found.set(key, {
      url: key,
      anchor: anchorText(match[0], html, match.index ?? 0),
      kind: url.hostname.replace(/^www\./, "") === host ? "internal" : "external",
      occurrences: 1,
    });
  }
  return Array.from(found.values());
}

/** Cheap edit-distance similarity on URL paths, 0..1. */
export function pathSimilarity(a: string, b: string): number {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  if (s === t) return 1;
  const m = s.length;
  const n = t.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

function variantCandidates(broken: URL): { url: string; reason: string }[] {
  const out: { url: string; reason: string }[] = [];
  const add = (mutate: (u: URL) => void, reason: string) => {
    const u = new URL(broken.toString());
    mutate(u);
    if (u.toString() !== broken.toString() && !out.some((o) => o.url === u.toString())) out.push({ url: u.toString(), reason });
  };
  if (broken.pathname.endsWith("/") && broken.pathname !== "/") add((u) => (u.pathname = u.pathname.replace(/\/+$/, "")), "Without trailing slash");
  else if (!/\.[a-z0-9]{2,5}$/i.test(broken.pathname)) add((u) => (u.pathname = `${u.pathname}/`), "With trailing slash");
  if (/[A-Z]/.test(broken.pathname)) add((u) => (u.pathname = u.pathname.toLowerCase()), "Lowercased path");
  if (broken.protocol === "http:") add((u) => (u.protocol = "https:"), "Upgraded to https");
  if (broken.search) add((u) => (u.search = ""), "Without query string");
  if (/\.html?$/i.test(broken.pathname)) add((u) => (u.pathname = u.pathname.replace(/\.html?$/i, "")), "Without .html extension");
  return out.slice(0, 3);
}

export async function checkPageLinks(rawUrl: string): Promise<LinkReport> {
  const raw = await fetchHtml(rawUrl);
  const all = extractLinks(raw.html, raw.finalUrl);
  const toCheck = all.slice(0, MAX_LINKS);
  const skipped = all.length - toCheck.length;

  const probed = await mapLimit(toCheck, CONCURRENCY, async (link) => {
    const result = await probeUrl(link.url);
    return { link, result };
  });

  const liveInternalPaths = probed
    .filter((p) => p.link.kind === "internal" && p.result.status !== null && p.result.status < 400)
    .map((p) => p.link.url);

  const links: LinkResult[] = await mapLimit(probed, CONCURRENCY, async ({ link, result }) => {
    const ok = result.status !== null && result.status < 400;
    const redirectedTo = result.redirected && result.finalUrl && result.finalUrl !== link.url ? result.finalUrl : null;
    const suggestions: LinkResult["suggestions"] = [];

    if (!ok) {
      const brokenUrl = new URL(link.url);
      // Verify a few URL-shape variants; only do live probes for internal links to stay polite.
      if (link.kind === "internal") {
        for (const candidate of variantCandidates(brokenUrl)) {
          const probe = await probeUrl(candidate.url, { timeoutMs: 5_000 });
          if (probe.status !== null && probe.status < 400) {
            suggestions.push({ url: probe.finalUrl ?? candidate.url, reason: candidate.reason, verified: true });
            break;
          }
        }
        const similar = liveInternalPaths
          .map((url) => ({ url, score: pathSimilarity(new URL(url).pathname, brokenUrl.pathname) }))
          .filter((s) => s.score >= 0.6 && s.url !== link.url)
          .sort((a, b) => b.score - a.score)
          .slice(0, 2);
        for (const s of similar) {
          if (!suggestions.some((x) => x.url === s.url)) {
            suggestions.push({ url: s.url, reason: `Similar live page (${Math.round(s.score * 100)}% path match)`, verified: true });
          }
        }
      } else {
        for (const candidate of variantCandidates(brokenUrl).slice(0, 1)) {
          suggestions.push({ url: candidate.url, reason: candidate.reason, verified: false });
        }
      }
    } else if (redirectedTo) {
      suggestions.push({ url: redirectedTo, reason: "Link directly to the redirect destination", verified: true });
    }

    return {
      url: link.url,
      anchor: link.anchor,
      kind: link.kind,
      status: result.status,
      ok,
      redirectedTo,
      error: result.error,
      occurrences: link.occurrences,
      suggestions,
    };
  });

  const broken = links.filter((l) => !l.ok);
  const redirected = links.filter((l) => l.ok && l.redirectedTo);
  return {
    pageUrl: raw.requestedUrl,
    finalUrl: raw.finalUrl,
    scannedAt: new Date().toISOString(),
    totals: { found: all.length, checked: links.length, ok: links.length - broken.length, broken: broken.length, redirected: redirected.length, skipped },
    links: [...broken, ...redirected, ...links.filter((l) => l.ok && !l.redirectedTo)],
  };
}
