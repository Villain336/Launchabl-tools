import { attr, fetchHtml, FetchPageError, probeUrl, tags, type RawPage } from "@/lib/web/fetch-page";

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export type CanonicalCheck = {
  id: string;
  status: CheckStatus;
  title: string;
  detail: string;
};

export type CanonicalReport = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirected: boolean;
  /** Every canonical declared in the HTML head, in document order. */
  htmlCanonicals: string[];
  /** Canonical sent via the HTTP `Link` header, if any. */
  headerCanonical: string | null;
  /** The canonical search engines will most likely honour, resolved to an absolute URL. */
  effectiveCanonical: string | null;
  ogUrl: string | null;
  robots: string | null;
  target: { url: string; status: number | null; finalUrl: string | null; canonical: string | null } | null;
  checks: CanonicalCheck[];
  summary: { pass: number; warn: number; fail: number };
  /** Tag the page should carry. */
  recommendedTag: string;
  recommendedCanonical: string;
};

const TRACKING_PARAMS = /^(utm_|fbclid|gclid|msclkid|mc_cid|mc_eid|ref$|source$)/i;

export function stripTracking(url: URL): URL {
  const clean = new URL(url.toString());
  for (const key of Array.from(clean.searchParams.keys())) {
    if (TRACKING_PARAMS.test(key)) clean.searchParams.delete(key);
  }
  clean.hash = "";
  return clean;
}

function headerCanonical(headers: Headers): string | null {
  const link = headers.get("link");
  if (!link) return null;
  for (const part of link.split(",")) {
    const m = part.match(/<([^>]+)>\s*;([^,]*)/);
    if (m && /rel\s*=\s*"?canonical"?/i.test(m[2])) return m[1].trim();
  }
  return null;
}

function sameUrl(a: URL, b: URL) {
  const norm = (u: URL) => `${u.protocol}//${u.hostname.toLowerCase()}${u.port ? `:${u.port}` : ""}${u.pathname.replace(/\/+$/, "") || "/"}${u.search}`;
  return norm(a) === norm(b);
}

export function analyzeCanonicalHtml(raw: Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status" | "headers">) {
  const head = raw.html.slice(0, 200_000);
  const isCanonical = (t: string) => /(^|\s)canonical(\s|$)/i.test(attr(t, "rel") ?? "");
  const canonicalTags = (s: string) => tags(s, "link").filter(isCanonical);
  const htmlCanonicals = canonicalTags(head)
    .map((t) => attr(t, "href") ?? "")
    .filter(Boolean);
  const metas = tags(head, "meta");
  const metaContent = (key: "name" | "property", value: string) => {
    const tag = metas.find((t) => (attr(t, key) ?? "").toLowerCase() === value);
    return tag ? attr(tag, "content") : null;
  };
  const headEnd = raw.html.search(/<\/head>/i);
  const canonicalInBody = headEnd > 0 && canonicalTags(raw.html).length > canonicalTags(raw.html.slice(0, headEnd)).length;

  return {
    htmlCanonicals,
    headerCanonical: headerCanonical(raw.headers),
    ogUrl: metaContent("property", "og:url"),
    robots: metaContent("name", "robots"),
    canonicalInBody,
  };
}

export async function analyzeCanonical(rawUrl: string): Promise<CanonicalReport> {
  const raw = await fetchHtml(rawUrl);
  const parsed = analyzeCanonicalHtml(raw);
  const finalUrl = new URL(raw.finalUrl);
  const checks: CanonicalCheck[] = [];
  const push = (id: string, status: CheckStatus, title: string, detail: string) => checks.push({ id, status, title, detail });

  const redirected = !sameUrl(raw.url, finalUrl);
  if (redirected) {
    push("redirect", "info", "Requested URL redirects", `${raw.url.toString()} → ${raw.finalUrl}. Checks below apply to the final URL.`);
  }

  const declared = parsed.htmlCanonicals[0] ?? parsed.headerCanonical ?? null;
  let effective: URL | null = null;
  if (declared) {
    try {
      effective = new URL(declared, raw.finalUrl);
    } catch {
      effective = null;
    }
  }

  if (parsed.htmlCanonicals.length === 0 && !parsed.headerCanonical) {
    push("present", "fail", "No canonical declared", "Neither a <link rel=\"canonical\"> tag nor a Link header was found. Search engines will pick a canonical for you, and parameter or www variants may split ranking signals.");
  } else {
    push("present", "pass", "Canonical declared", parsed.htmlCanonicals.length ? `HTML: ${parsed.htmlCanonicals[0]}` : `HTTP Link header: ${parsed.headerCanonical}`);
  }

  const distinct = Array.from(new Set(parsed.htmlCanonicals));
  if (distinct.length > 1) {
    push("single", "fail", "Multiple conflicting canonicals", `Found ${parsed.htmlCanonicals.length} canonical tags pointing at ${distinct.length} different URLs. Google ignores all of them when they conflict. Keep exactly one.`);
  } else if (parsed.htmlCanonicals.length > 1) {
    push("single", "warn", "Duplicate canonical tags", `${parsed.htmlCanonicals.length} identical canonical tags. Harmless today, but a second template edit could make them disagree. Keep one.`);
  } else if (parsed.htmlCanonicals.length === 1) {
    push("single", "pass", "Exactly one canonical tag", "One tag, no ambiguity.");
  }

  if (parsed.canonicalInBody) {
    push("in-head", "fail", "Canonical tag outside <head>", "A canonical <link> appears in the <body>. Browsers and crawlers ignore it there; move it into <head>.");
  }

  if (parsed.headerCanonical && parsed.htmlCanonicals.length) {
    const headerUrl = (() => {
      try {
        return new URL(parsed.headerCanonical!, raw.finalUrl);
      } catch {
        return null;
      }
    })();
    if (headerUrl && effective && !sameUrl(headerUrl, effective)) {
      push("header-vs-html", "fail", "HTTP header and HTML canonical disagree", `Link header says ${headerUrl.toString()}, HTML says ${effective.toString()}. Pick one source of truth.`);
    } else {
      push("header-vs-html", "pass", "Header and HTML canonical agree", "Both point at the same URL.");
    }
  }

  if (declared) {
    if (!/^https?:\/\//i.test(declared)) {
      push("absolute", "warn", "Canonical is a relative URL", `"${declared}" resolves to ${effective?.toString() ?? "an invalid URL"}. Use an absolute URL so it can't resolve differently on mirrors, staging or proxies.`);
    } else if (!effective) {
      push("absolute", "fail", "Canonical is not a valid URL", `"${declared}" can't be parsed.`);
    } else {
      push("absolute", "pass", "Canonical is absolute", "Fully qualified with scheme and host.");
    }
  }

  if (effective) {
    if (finalUrl.protocol === "https:" && effective.protocol === "http:") {
      push("https", "fail", "Canonical points at http://", "The page is served over HTTPS but declares an HTTP canonical. Search engines prefer HTTPS; this hands your signals to the insecure version.");
    }

    const hostA = finalUrl.hostname.toLowerCase();
    const hostB = effective.hostname.toLowerCase();
    if (hostA !== hostB) {
      const wwwOnly = hostA.replace(/^www\./, "") === hostB.replace(/^www\./, "");
      push(
        "host",
        wwwOnly ? "warn" : "info",
        wwwOnly ? "Canonical uses a different www variant" : "Cross-domain canonical",
        wwwOnly
          ? `Page is on ${hostA}, canonical is on ${hostB}. That is fine only if ${hostB} is the version you redirect to everywhere. Make sure the redirect and canonical agree.`
          : `Canonical points to ${hostB}. That tells search engines this page is a syndicated copy of the ${hostB} version and should not rank on its own. Intentional for syndication; a mistake otherwise.`,
      );
    }

    const self = sameUrl(finalUrl, effective);
    if (self) {
      push("self", "pass", "Self-referencing canonical", "The page declares itself as the canonical version.");
    } else if (sameUrl(stripTracking(finalUrl), effective)) {
      push("self", "pass", "Canonical strips tracking parameters", `This URL carries ${finalUrl.search}; the canonical points at the clean version, which is exactly right.`);
    } else if (hostA === hostB) {
      push("self", "warn", "Canonical points to a different page", `This page says ${effective.toString()} is the original. It will not rank on its own. Correct for parameter/filter/print variants; wrong if this page has unique content.`);
    }

    const trackingKeys = Array.from(effective.searchParams.keys()).filter((k) => TRACKING_PARAMS.test(k));
    if (trackingKeys.length) {
      push("params", "fail", "Canonical contains tracking parameters", `Parameters ${trackingKeys.join(", ")} should never appear in a canonical. Strip them.`);
    } else if (effective.search) {
      push("params", "info", "Canonical includes query parameters", `${effective.search} — acceptable only if the parameters change the primary content (e.g. a product ID). Otherwise strip them.`);
    }

    if (effective.hash) {
      push("fragment", "fail", "Canonical contains a #fragment", "Search engines drop fragments; the tag is effectively invalid. Remove it.");
    }

    if (/[A-Z]/.test(effective.pathname)) {
      push("case", "info", "Uppercase characters in canonical path", "URLs are case-sensitive. Make sure the lowercase and uppercase variants don't both resolve, or pick one and redirect the other.");
    }

    if (self && finalUrl.pathname !== effective.pathname && finalUrl.pathname.replace(/\/+$/, "") === effective.pathname.replace(/\/+$/, "")) {
      push("slash", "info", "Trailing-slash mismatch", `Page URL and canonical differ only by a trailing slash. Redirect one form to the other so there is exactly one live URL.`);
    }
  }

  if (parsed.robots && /noindex/i.test(parsed.robots) && effective) {
    push("noindex", "warn", "noindex combined with a canonical", `robots="${parsed.robots}". A canonical on a noindexed page sends mixed signals: you are saying "this is the original" and "don't index it". Use one or the other.`);
  }

  if (parsed.ogUrl && effective) {
    try {
      const og = new URL(parsed.ogUrl, raw.finalUrl);
      if (!sameUrl(og, effective)) {
        push("og-url", "warn", "og:url differs from canonical", `og:url is ${og.toString()}. Social platforms use it to aggregate shares; keep it identical to the canonical.`);
      } else {
        push("og-url", "pass", "og:url matches canonical", "Share counts will consolidate on the canonical URL.");
      }
    } catch {
      push("og-url", "warn", "og:url is not a valid URL", `"${parsed.ogUrl}"`);
    }
  }

  let target: CanonicalReport["target"] = null;
  if (effective && !sameUrl(finalUrl, effective)) {
    const probe = await probeUrl(effective.toString());
    let targetCanonical: string | null = null;
    if (probe.status && probe.status < 400) {
      try {
        const targetRaw = await fetchHtml(effective.toString(), { timeoutMs: 8_000, maxBytes: 400_000 });
        targetCanonical = analyzeCanonicalHtml(targetRaw).htmlCanonicals[0] ?? null;
      } catch {
        targetCanonical = null;
      }
    }
    target = { url: effective.toString(), status: probe.status, finalUrl: probe.finalUrl, canonical: targetCanonical };

    if (probe.status === null) {
      push("target-reachable", "fail", "Canonical target unreachable", `${effective.toString()} did not respond (${probe.error ?? "unknown error"}).`);
    } else if (probe.status >= 400) {
      push("target-reachable", "fail", `Canonical target returns HTTP ${probe.status}`, "You are pointing search engines at a page that errors. The canonical will be ignored and the error page may be crawled repeatedly.");
    } else if (probe.redirected && probe.finalUrl) {
      push("target-redirect", "warn", "Canonical target redirects", `${effective.toString()} → ${probe.finalUrl}. Point the canonical at the final URL to avoid a canonical → redirect chain.`);
    } else {
      push("target-reachable", "pass", "Canonical target responds 200", "The canonical URL is live.");
    }

    if (targetCanonical) {
      try {
        const tc = new URL(targetCanonical, effective.toString());
        if (!sameUrl(tc, effective)) {
          push("chain", "fail", "Canonical chain", `${effective.toString()} declares its own canonical as ${tc.toString()}. Chains are frequently ignored; point this page straight at the end of the chain.`);
        } else {
          push("chain", "pass", "Canonical target is self-referencing", "No chain — the target claims itself.");
        }
      } catch {
        // ignore unparsable target canonical
      }
    }
  } else if (effective) {
    push("target-reachable", "pass", "Canonical resolves to this page", `Served HTTP ${raw.status}.`);
  }

  const recommended = stripTracking(finalUrl);
  const recommendedCanonical = recommended.toString();
  const summary = checks.reduce(
    (acc, c) => {
      if (c.status === "pass") acc.pass++;
      else if (c.status === "warn") acc.warn++;
      else if (c.status === "fail") acc.fail++;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );

  return {
    requestedUrl: raw.requestedUrl,
    finalUrl: raw.finalUrl,
    status: raw.status,
    redirected,
    htmlCanonicals: parsed.htmlCanonicals,
    headerCanonical: parsed.headerCanonical,
    effectiveCanonical: effective?.toString() ?? null,
    ogUrl: parsed.ogUrl,
    robots: parsed.robots,
    target,
    checks,
    summary,
    recommendedTag: `<link rel="canonical" href="${recommendedCanonical}">`,
    recommendedCanonical,
  };
}

export { FetchPageError };
