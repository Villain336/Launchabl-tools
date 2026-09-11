import { attr, FETCH_HEADERS, fetchHtml, mapLimit, tags } from "@/lib/web/fetch-page";

export type Severity = "high" | "medium" | "low" | "pass";

export type PerfFinding = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  fix: string;
};

export type PerformanceReport = {
  url: string;
  finalUrl: string;
  status: number;
  auditedAt: string;
  /** 0–100 heuristic score derived from the findings; not a Lighthouse score. */
  score: number;
  timing: { ttfbMs: number; totalMs: number };
  document: {
    htmlKb: number;
    compression: string | null;
    cacheControl: string | null;
    server: string | null;
    http2Hint: string | null;
    domNodes: number;
    inlineScriptKb: number;
    inlineStyleKb: number;
  };
  scripts: { total: number; external: number; blocking: number; deferred: number; module: number; measuredKb: number | null; measuredFiles: number; largest: { url: string; kb: number }[] };
  styles: { total: number; blocking: number; measuredKb: number | null };
  images: { total: number; lazy: number; missingDimensions: number; modernFormat: number; missingAlt: number };
  fonts: { stylesheets: number; preloaded: number; googleFonts: boolean; fontDisplayHint: boolean };
  hints: { preconnect: string[]; preload: number; dnsPrefetch: number };
  thirdParties: string[];
  iframes: number;
  findings: PerfFinding[];
};

const MEASURE_LIMIT = 10;

function kb(bytes: number) {
  return Math.round((bytes / 1024) * 10) / 10;
}

async function contentLength(url: string): Promise<number | null> {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(5_000), headers: FETCH_HEADERS });
    const length = response.headers.get("content-length");
    if (length && response.ok) return Number(length);
    // Chunked or refused HEAD: download and count. Bounded by the caller's concurrency and timeout.
    const get = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(7_000), headers: FETCH_HEADERS });
    if (!get.ok) return null;
    const buf = await get.arrayBuffer();
    return buf.byteLength;
  } catch {
    return null;
  }
}

export function analyzeHtmlPerformance(html: string, finalUrl: string) {
  const base = new URL(finalUrl);
  const host = base.hostname.replace(/^www\./, "");
  const headEnd = html.search(/<\/head>/i);
  const head = headEnd > 0 ? html.slice(0, headEnd) : html.slice(0, 100_000);

  const scriptTags = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi));
  let inlineScriptBytes = 0;
  const external: { url: string; inHead: boolean; blocking: boolean; module: boolean; deferred: boolean }[] = [];
  for (const m of scriptTags) {
    const tag = m[0].match(/<script\b[^>]*>/i)![0];
    const src = attr(tag, "src");
    const type = (attr(tag, "type") ?? "").toLowerCase();
    if (!src) {
      if (!type || /javascript|module/.test(type)) inlineScriptBytes += m[1].length;
      continue;
    }
    const isModule = type === "module";
    const deferred = /\basync\b|\bdefer\b/i.test(tag) || isModule;
    const inHead = (m.index ?? 0) < headEnd;
    let url = src;
    try {
      url = new URL(src, finalUrl).toString();
    } catch {
      // keep raw
    }
    external.push({ url, inHead, blocking: inHead && !deferred, module: isModule, deferred });
  }

  const linkTags = tags(html, "link");
  const stylesheets = linkTags.filter((t) => /(^|\s)stylesheet(\s|$)/i.test(attr(t, "rel") ?? ""));
  const blockingStyles = stylesheets.filter((t) => !/\bmedia\s*=\s*["']?(print|\(max-width)/i.test(t) && !/\bdisabled\b/i.test(t));
  const inlineStyleBytes = Array.from(html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)).reduce((n, m) => n + m[1].length, 0);
  const preconnect = linkTags.filter((t) => /preconnect/i.test(attr(t, "rel") ?? "")).map((t) => attr(t, "href") ?? "").filter(Boolean);
  const preload = linkTags.filter((t) => /(^|\s)preload(\s|$)/i.test(attr(t, "rel") ?? ""));
  const preloadedFonts = preload.filter((t) => /font/i.test(attr(t, "as") ?? "")).length;
  const dnsPrefetch = linkTags.filter((t) => /dns-prefetch/i.test(attr(t, "rel") ?? "")).length;
  const googleFonts = /fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(head);
  const fontStylesheets = stylesheets.filter((t) => /font/i.test(attr(t, "href") ?? "")).length + (googleFonts ? 1 : 0);
  const fontDisplayHint = /font-display\s*:|display=swap|display=optional/i.test(html);

  const imgs = tags(html, "img");
  const images = {
    total: imgs.length,
    lazy: imgs.filter((t) => /loading\s*=\s*["']?lazy/i.test(t)).length,
    missingDimensions: imgs.filter((t) => !(attr(t, "width") && attr(t, "height")) && !/\bstyle\s*=\s*["'][^"']*(width|aspect-ratio)/i.test(t)).length,
    modernFormat: imgs.filter((t) => /\.(webp|avif|svg)(\?|\s|$)|image\/(webp|avif)/i.test(`${attr(t, "src") ?? ""} ${attr(t, "srcset") ?? ""}`)).length,
    missingAlt: imgs.filter((t) => attr(t, "alt") === null).length,
  };

  const thirdParties = new Set<string>();
  const collect = (href: string | null) => {
    if (!href) return;
    try {
      const u = new URL(href, finalUrl);
      const h = u.hostname.replace(/^www\./, "");
      if (h && h !== host && !h.endsWith(`.${host}`)) thirdParties.add(h);
    } catch {
      // ignore
    }
  };
  external.forEach((s) => collect(s.url));
  stylesheets.forEach((t) => collect(attr(t, "href")));
  const iframes = tags(html, "iframe");
  iframes.forEach((t) => collect(attr(t, "src")));
  imgs.forEach((t) => collect(attr(t, "src")));

  const domNodes = (html.match(/<[a-zA-Z][^>]*>/g) ?? []).length;

  return {
    external,
    inlineScriptBytes,
    stylesheets: stylesheets.length,
    blockingStyles: blockingStyles.length,
    stylesheetUrls: stylesheets.map((t) => attr(t, "href")).filter((h): h is string => Boolean(h)).map((h) => {
      try {
        return new URL(h, finalUrl).toString();
      } catch {
        return h;
      }
    }),
    inlineStyleBytes,
    preconnect,
    preload: preload.length,
    preloadedFonts,
    dnsPrefetch,
    googleFonts,
    fontStylesheets,
    fontDisplayHint,
    images,
    thirdParties: Array.from(thirdParties).sort(),
    iframes: iframes.length,
    domNodes,
    hasViewport: /<meta\b[^>]*name\s*=\s*["']?viewport/i.test(head),
  };
}

export async function auditPagePerformance(rawUrl: string): Promise<PerformanceReport> {
  const raw = await fetchHtml(rawUrl, { timeoutMs: 15_000, maxBytes: 3_000_000 });
  const a = analyzeHtmlPerformance(raw.html, raw.finalUrl);

  const scriptUrls = a.external.map((s) => s.url).slice(0, MEASURE_LIMIT);
  const styleUrls = a.stylesheetUrls.slice(0, Math.max(0, MEASURE_LIMIT - scriptUrls.length + 4));
  const [scriptSizes, styleSizes] = await Promise.all([
    mapLimit(scriptUrls, 5, async (u) => ({ url: u, bytes: await contentLength(u) })),
    mapLimit(styleUrls, 5, async (u) => ({ url: u, bytes: await contentLength(u) })),
  ]);
  const measured = (list: { bytes: number | null }[]) => {
    const known = list.filter((x) => x.bytes !== null) as { bytes: number }[];
    return known.length ? kb(known.reduce((n, x) => n + x.bytes, 0)) : null;
  };
  const scriptsKb = measured(scriptSizes);
  const stylesKb = measured(styleSizes);
  const largest = (scriptSizes.filter((s) => s.bytes !== null) as { url: string; bytes: number }[])
    .sort((x, y) => y.bytes - x.bytes)
    .slice(0, 3)
    .map((s) => ({ url: s.url, kb: kb(s.bytes) }));

  const compression = raw.headers.get("content-encoding");
  const cacheControl = raw.headers.get("cache-control");
  const findings: PerfFinding[] = [];
  const add = (f: PerfFinding) => findings.push(f);

  // Server response
  if (raw.ttfbMs > 1_200) add({ id: "ttfb", severity: "high", title: `Slow server response (${raw.ttfbMs} ms to first byte)`, detail: "Anything over ~800 ms before the first byte delays every other metric. Usually uncached server rendering, slow database calls, or a distant origin.", fix: "Cache the HTML at the edge (CDN, ISR/static generation), move the origin closer to users, or profile the slowest server work on this route." });
  else if (raw.ttfbMs > 600) add({ id: "ttfb", severity: "medium", title: `Server response could be faster (${raw.ttfbMs} ms)`, detail: "Good is under ~600 ms as seen from a datacenter; real users on mobile will see more.", fix: "Add edge caching for the HTML or reduce server work on this route." });
  else add({ id: "ttfb", severity: "pass", title: `Fast server response (${raw.ttfbMs} ms)`, detail: "Time to first byte is in the good range.", fix: "" });

  if (!compression) add({ id: "compression", severity: "high", title: "HTML is not compressed", detail: "No Content-Encoding header was returned even though gzip and brotli were accepted. Every byte of HTML, and likely CSS/JS, travels uncompressed.", fix: "Enable brotli (preferred) or gzip at the CDN or web server. Most hosts and CDNs have a single toggle for this." });
  else add({ id: "compression", severity: "pass", title: `Compressed with ${compression}`, detail: "Text responses are compressed in transit.", fix: "" });

  const htmlKb = kb(raw.bytes);
  if (htmlKb > 300) add({ id: "html-size", severity: "high", title: `Very large HTML document (${htmlKb} KB)`, detail: "Large documents delay parsing and first paint. Common causes: inlined data blobs, huge inline SVGs, server-rendered lists with hundreds of rows, inline CSS for the whole site.", fix: "Move large data to fetched JSON, paginate long lists, and inline only critical CSS." });
  else if (htmlKb > 120) add({ id: "html-size", severity: "medium", title: `Large HTML document (${htmlKb} KB)`, detail: "Over ~100 KB of HTML starts to hurt on mobile networks.", fix: "Check for inlined data or styles that could load separately." });
  else add({ id: "html-size", severity: "pass", title: `Lean HTML (${htmlKb} KB)`, detail: "Document size is reasonable.", fix: "" });

  if (a.domNodes > 3_000) add({ id: "dom", severity: "medium", title: `Very large DOM (~${a.domNodes.toLocaleString()} elements)`, detail: "Big DOMs slow style calculation, layout and memory use. Lighthouse flags over 1,500 nodes; over 3,000 is a real cost.", fix: "Virtualise long lists, remove wrapper divs, and lazy-render below-the-fold sections." });
  else if (a.domNodes > 1_500) add({ id: "dom", severity: "low", title: `Large DOM (~${a.domNodes.toLocaleString()} elements)`, detail: "Above Lighthouse's 1,500-node guidance; worth trimming if layout feels sluggish.", fix: "Look for deeply nested wrappers and repeated components." });

  // Scripts
  const blocking = a.external.filter((s) => s.blocking);
  if (blocking.length) add({ id: "blocking-js", severity: blocking.length > 2 ? "high" : "medium", title: `${blocking.length} render-blocking script${blocking.length > 1 ? "s" : ""} in <head>`, detail: `Scripts without async/defer in <head> stop HTML parsing until they download and run: ${blocking.slice(0, 3).map((s) => s.url).join(", ")}${blocking.length > 3 ? "…" : ""}`, fix: "Add defer (or async for independent third-party tags), or move the tags to the end of <body>. Use type=\"module\" for modern bundles." });
  else if (a.external.length) add({ id: "blocking-js", severity: "pass", title: "No render-blocking scripts", detail: "All external scripts are async, deferred, or load after the content.", fix: "" });

  if (scriptsKb !== null && scriptsKb > 600) add({ id: "js-weight", severity: "high", title: `Heavy JavaScript (~${Math.round(scriptsKb)} KB across ${scriptSizes.length} measured files)`, detail: `Largest: ${largest.map((l) => `${l.url.split("/").pop()} (${l.kb} KB)`).join(", ")}. Transfer size as reported by the server; parse and execute cost is higher still.`, fix: "Code-split by route, drop unused dependencies, load analytics/chat widgets after interaction, and audit the largest bundle first." });
  else if (scriptsKb !== null && scriptsKb > 300) add({ id: "js-weight", severity: "medium", title: `Moderate JavaScript weight (~${Math.round(scriptsKb)} KB)`, detail: `Largest: ${largest.map((l) => `${l.url.split("/").pop()} (${l.kb} KB)`).join(", ")}.`, fix: "Check the largest bundle for libraries that could be replaced with smaller ones or loaded lazily." });
  else if (scriptsKb !== null) add({ id: "js-weight", severity: "pass", title: `Light JavaScript (~${Math.round(scriptsKb)} KB measured)`, detail: "Total script transfer is in the good range.", fix: "" });

  if (a.inlineScriptBytes > 60_000) add({ id: "inline-js", severity: "medium", title: `${kb(a.inlineScriptBytes)} KB of inline JavaScript`, detail: "Inline scripts can't be cached between pages and delay parsing of everything after them.", fix: "Move large inline payloads (state hydration, config, data) into cacheable files or fetch them on demand." });

  // Styles
  if (a.blockingStyles > 4) add({ id: "css-files", severity: "medium", title: `${a.blockingStyles} render-blocking stylesheets`, detail: "Each stylesheet must download before anything paints. Several small files cost more than one bundle on HTTP/1.1 and still add request overhead on HTTP/2.", fix: "Bundle into one or two files, inline critical CSS, and load non-critical CSS with media=\"print\" onload swap or after first paint." });
  else if (stylesKb !== null && stylesKb > 150) add({ id: "css-weight", severity: "medium", title: `Heavy CSS (~${Math.round(stylesKb)} KB)`, detail: "Large stylesheets delay first paint on every page.", fix: "Purge unused selectors (Tailwind/PurgeCSS do this automatically when configured) and split page-specific styles." });
  else if (a.stylesheets) add({ id: "css", severity: "pass", title: `${a.stylesheets} stylesheet${a.stylesheets > 1 ? "s" : ""}, reasonable weight`, detail: stylesKb !== null ? `~${Math.round(stylesKb)} KB measured.` : "Sizes could not be measured.", fix: "" });

  // Images
  if (a.images.total) {
    if (a.images.missingDimensions > 0) add({ id: "img-dimensions", severity: a.images.missingDimensions > 3 ? "medium" : "low", title: `${a.images.missingDimensions} of ${a.images.total} images lack width/height`, detail: "Without intrinsic dimensions the browser can't reserve space, so content jumps when images load (Cumulative Layout Shift).", fix: "Add width and height attributes (or CSS aspect-ratio) to every <img>." });
    else add({ id: "img-dimensions", severity: "pass", title: "All images declare dimensions", detail: "Layout can be reserved before images load.", fix: "" });
    if (a.images.total > 4 && a.images.lazy === 0) add({ id: "img-lazy", severity: "medium", title: `${a.images.total} images, none lazy-loaded`, detail: "Every image downloads immediately, competing with the content users actually see first.", fix: "Add loading=\"lazy\" to images below the fold. Keep the hero image eager and consider fetchpriority=\"high\" on it." });
    if (a.images.total > 2 && a.images.modernFormat === 0) add({ id: "img-format", severity: "low", title: "No modern image formats detected", detail: "No WebP/AVIF/SVG sources found in src or srcset. Modern formats are typically 25–50% smaller than JPEG/PNG.", fix: "Serve AVIF or WebP with <picture> fallbacks, or use an image CDN / framework image component that negotiates formats." });
  }

  // Fonts
  if (a.googleFonts && !a.preconnect.some((p) => /gstatic|googleapis/i.test(p))) add({ id: "font-preconnect", severity: "low", title: "Google Fonts without preconnect", detail: "The browser discovers fonts.gstatic.com late, adding a DNS+TLS round trip before text can render in the web font.", fix: "Add <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin> — or self-host the fonts and preload the WOFF2 files." });
  if (a.fontStylesheets > 0 && !a.fontDisplayHint) add({ id: "font-display", severity: "low", title: "No font-display strategy detected", detail: "Without font-display: swap/optional, some browsers hide text until the web font arrives.", fix: "Add font-display: swap to @font-face rules or &display=swap to Google Fonts URLs." });

  // Third parties
  if (a.thirdParties.length > 8) add({ id: "third-party", severity: "high", title: `${a.thirdParties.length} third-party domains`, detail: `Each domain adds DNS, TCP and TLS setup, and third-party scripts are the most common cause of slow interaction: ${a.thirdParties.slice(0, 6).join(", ")}…`, fix: "Remove tags you don't act on, load the rest after user interaction or via a tag manager with consent-based triggers, and preconnect to the two or three that matter." });
  else if (a.thirdParties.length > 4) add({ id: "third-party", severity: "medium", title: `${a.thirdParties.length} third-party domains`, detail: a.thirdParties.join(", "), fix: "Audit each tag: does it earn its cost? Delay non-essential ones until after load." });
  else if (a.thirdParties.length) add({ id: "third-party", severity: "pass", title: `${a.thirdParties.length} third-party domain${a.thirdParties.length > 1 ? "s" : ""}`, detail: a.thirdParties.join(", "), fix: "" });

  if (a.iframes > 2) add({ id: "iframes", severity: "medium", title: `${a.iframes} iframes`, detail: "Embedded videos, maps and widgets each load a whole page's worth of resources.", fix: "Use a click-to-load facade (poster image + play button) and loading=\"lazy\" on iframes." });

  // Caching hints
  if (!cacheControl || /no-store/i.test(cacheControl)) add({ id: "cache", severity: "low", title: "HTML sent without a cache policy", detail: cacheControl ? `Cache-Control: ${cacheControl}` : "No Cache-Control header.", fix: "Even a short public s-maxage with stale-while-revalidate lets a CDN absorb most requests." });

  if (!a.hasViewport) add({ id: "viewport", severity: "high", title: "Missing viewport meta tag", detail: "Mobile browsers will render the page at desktop width and scale it down.", fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">." });

  const penalty = findings.reduce((n, f) => n + (f.severity === "high" ? 18 : f.severity === "medium" ? 9 : f.severity === "low" ? 4 : 0), 0);
  const score = Math.max(5, Math.min(100, 100 - penalty));
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2, pass: 3 };
  findings.sort((x, y) => order[x.severity] - order[y.severity]);

  return {
    url: raw.requestedUrl,
    finalUrl: raw.finalUrl,
    status: raw.status,
    auditedAt: new Date().toISOString(),
    score,
    timing: { ttfbMs: raw.ttfbMs, totalMs: raw.loadTimeMs },
    document: {
      htmlKb,
      compression,
      cacheControl,
      server: raw.headers.get("server"),
      http2Hint: raw.headers.get("alt-svc"),
      domNodes: a.domNodes,
      inlineScriptKb: kb(a.inlineScriptBytes),
      inlineStyleKb: kb(a.inlineStyleBytes),
    },
    scripts: {
      total: a.external.length,
      external: a.external.length,
      blocking: blocking.length,
      deferred: a.external.filter((s) => s.deferred).length,
      module: a.external.filter((s) => s.module).length,
      measuredKb: scriptsKb,
      measuredFiles: scriptSizes.filter((s) => s.bytes !== null).length,
      largest,
    },
    styles: { total: a.stylesheets, blocking: a.blockingStyles, measuredKb: stylesKb },
    images: a.images,
    fonts: { stylesheets: a.fontStylesheets, preloaded: a.preloadedFonts, googleFonts: a.googleFonts, fontDisplayHint: a.fontDisplayHint },
    hints: { preconnect: a.preconnect, preload: a.preload, dnsPrefetch: a.dnsPrefetch },
    thirdParties: a.thirdParties,
    iframes: a.iframes,
    findings,
  };
}
