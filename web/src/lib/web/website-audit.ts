import { attr, fetchHtml, parseHtml, tags, type RawPage } from "@/lib/web/fetch-page";
import { finalizeChecklist, plural, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { bodyText, headings, jsonLdBlocks, jsonLdTypes, securityHeaderChecks, thirdPartyHosts, topKeywords, wordCount } from "@/lib/web/html";

/**
 * General technical + on-page SEO audit of a single URL.
 *
 * Broad by design: it's the first tool people reach for, so it covers the
 * signals that most often explain "why doesn't this page rank / share /
 * load well", and points to the specialist tools for depth.
 */

export type WebsiteAuditInput = Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status" | "headers" | "loadTimeMs" | "ttfbMs" | "bytes">;

export type WebsiteAuditReport = ChecklistReport & {
  metrics: {
    titleLength: number;
    descriptionLength: number;
    h1Count: number;
    h2Count: number;
    words: number;
    imagesTotal: number;
    imagesWithAlt: number;
    internalLinks: number;
    externalLinks: number;
    jsonLdTypes: string[];
    hasOgImage: boolean;
    https: boolean;
    loadTimeMs: number;
    ttfbMs: number;
    htmlKb: number;
    securityHeaders: number;
    thirdParties: number;
    scripts: number;
    keywords: string[];
  };
};

export function auditWebsiteHtml(input: WebsiteAuditInput): WebsiteAuditReport {
  const { html, finalUrl, headers } = input;
  const url = new URL(finalUrl);
  const snap = parseHtml(html, input.requestedUrl, finalUrl);
  const heads = headings(html);
  const h1s = heads.filter((h) => h.level === 1);
  const h2s = heads.filter((h) => h.level === 2);
  const text = bodyText(html);
  const words = wordCount(text);
  const types = jsonLdTypes(html);
  const blocks = jsonLdBlocks(html);
  const rawLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;
  const invalidLd = rawLdCount > 0 && blocks.length === 0;
  const titleLength = snap.title?.length ?? 0;
  const descriptionLength = snap.metaDescription?.length ?? 0;
  const robotsMeta = (snap.metaRobots ?? "").toLowerCase();
  const xRobots = (headers.get("x-robots-tag") ?? "").toLowerCase();
  const noindex = /noindex/.test(robotsMeta) || /noindex/.test(xRobots);
  const sec = securityHeaderChecks(headers);
  const secPresent = sec.filter((s) => s.present);
  const encoding = headers.get("content-encoding");
  const cache = headers.get("cache-control");
  const scripts = tags(html, "script").filter((t) => attr(t, "src")).length;
  const third = thirdPartyHosts(html, finalUrl);
  const kb = Math.round(input.bytes / 1024);
  const imgs = tags(html, "img");
  const lazy = imgs.filter((t) => /loading\s*=\s*["']?lazy/i.test(t)).length;
  const favicon = tags(html.slice(0, 200_000), "link").some((t) => /\bicon\b/i.test(attr(t, "rel") ?? ""));
  const skippedLevels = heads.some((h, i) => i > 0 && h.level > heads[i - 1].level + 1);
  const canonicalAbs = snap.canonical ? /^https?:\/\//i.test(snap.canonical) : false;
  let canonicalSelf = false;
  if (snap.canonical) {
    try {
      canonicalSelf = new URL(snap.canonical, finalUrl).href.replace(/\/$/, "") === finalUrl.replace(/\/$/, "");
    } catch {
      canonicalSelf = false;
    }
  }
  const keywords = topKeywords(text, 8).map((k) => k.word);

  // Mixed content: http:// subresources on an https page are blocked or flagged by browsers.
  const insecureSrc = (list: string[]) => list.filter((t) => /^http:\/\//i.test(attr(t, "src") ?? attr(t, "href") ?? ""));
  const mixedActive = url.protocol === "https:" ? insecureSrc([...tags(html, "script"), ...tags(html, "iframe"), ...tags(html, "link").filter((t) => /stylesheet/i.test(attr(t, "rel") ?? ""))]).length : 0;
  const mixedPassive = url.protocol === "https:" ? insecureSrc([...imgs, ...tags(html, "video"), ...tags(html, "audio"), ...tags(html, "source")]).length : 0;

  // Scripts in <head> without async/defer/module block parsing until they download and run.
  const headHtml = html.match(/<head[\s>][\s\S]*?<\/head>/i)?.[0] ?? html.slice(0, 50_000);
  const blockingScripts = tags(headHtml, "script").filter((t) => attr(t, "src") && !/\b(async|defer)\b/i.test(t) && !/type\s*=\s*["']?module/i.test(t)).length;

  // Images without intrinsic size cause layout shift as they load.
  const sizedImgs = imgs.filter((t) => attr(t, "width") && attr(t, "height")).length;
  const unsizedImgs = imgs.length - sizedImgs;

  // href="#" / javascript: anchors are buttons pretending to be links: dead ends for crawlers and keyboards.
  const anchors = tags(html, "a");
  const deadAnchors = anchors.filter((t) => {
    const href = (attr(t, "href") ?? "").trim();
    return href === "#" || /^javascript:/i.test(href);
  }).length;

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  /* ── On-page SEO ─────────────────────────────────────── */
  add(
    !snap.title
      ? { id: "title", status: "fail", group: "On-page SEO", title: "Missing <title>", detail: "The title is the headline of your search result and the browser tab.", fix: "Add a unique title of 30–60 characters: primary topic first, brand last." }
      : titleLength < 30
        ? { id: "title", status: "warn", group: "On-page SEO", title: `Title is short (${titleLength} chars)`, detail: `“${snap.title}” leaves room to say what the page is about.`, fix: "Expand to 30–60 characters with the main keyword and a reason to click." }
        : titleLength > 60
          ? { id: "title", status: "warn", group: "On-page SEO", title: `Title is long (${titleLength} chars)`, detail: `“${snap.title}” will be cut off around 60 characters in results.`, fix: "Trim to under 60 characters; move the brand or qualifiers to the end." }
          : { id: "title", status: "pass", group: "On-page SEO", title: `Title looks good (${titleLength} chars)`, detail: `“${snap.title}”` },
  );

  add(
    !snap.metaDescription
      ? { id: "description", status: "fail", group: "On-page SEO", title: "Missing meta description", detail: "Google writes its own snippet when the description is missing, usually from random page text.", fix: "Add a 120–160 character description that states the offer and invites the click." }
      : descriptionLength < 70
        ? { id: "description", status: "warn", group: "On-page SEO", title: `Description is short (${descriptionLength} chars)`, detail: `“${snap.metaDescription}”`, fix: "Use the space: 120–160 characters with the benefit and a call to action." }
        : descriptionLength > 165
          ? { id: "description", status: "warn", group: "On-page SEO", title: `Description is long (${descriptionLength} chars)`, detail: "It will be truncated in results.", fix: "Cut to under 160 characters; front-load the key point." }
          : { id: "description", status: "pass", group: "On-page SEO", title: `Meta description set (${descriptionLength} chars)`, detail: `“${snap.metaDescription}”` },
  );

  add(
    h1s.length === 1
      ? { id: "h1", status: "pass", group: "On-page SEO", title: "Exactly one H1", detail: `“${h1s[0].text}”` }
      : h1s.length === 0
        ? { id: "h1", status: "fail", group: "On-page SEO", title: "No H1", detail: "Search engines and screen readers use the H1 as the page's topic.", fix: "Add one H1 that names the page's subject." }
        : { id: "h1", status: "warn", group: "On-page SEO", title: `${h1s.length} H1 tags`, detail: `“${h1s.map((h) => h.text).slice(0, 3).join("”, “")}”. Multiple H1s dilute the page topic.`, fix: "Keep one H1; make the others H2." },
  );

  add(
    heads.length === 0
      ? { id: "headings", status: "warn", group: "On-page SEO", title: "No headings", detail: "Without headings the page is a wall of text to crawlers and readers.", fix: "Break the content into sections with H2s and H3s." }
      : skippedLevels
        ? { id: "headings", status: "warn", group: "On-page SEO", title: "Heading levels skipped", detail: `${plural(heads.length, "heading")}, ${plural(h2s.length, "H2")}, but the outline jumps levels (e.g. H2 → H4).`, fix: "Nest headings in order: H1, then H2 sections, H3 inside them." }
        : { id: "headings", status: "pass", group: "On-page SEO", title: "Clean heading outline", detail: `${plural(heads.length, "heading")} including ${plural(h2s.length, "H2")}.` },
  );

  add(
    !snap.canonical
      ? { id: "canonical", status: "warn", group: "On-page SEO", title: "No canonical tag", detail: "Without one, URL variants (query strings, trailing slashes, www) can split ranking signals.", fix: `Add <link rel="canonical" href="${finalUrl}"> to <head>.` }
      : !canonicalAbs
        ? { id: "canonical", status: "warn", group: "On-page SEO", title: "Canonical is relative", detail: `“${snap.canonical}” — relative canonicals are error-prone across environments.`, fix: "Use the absolute https URL." }
        : canonicalSelf
          ? { id: "canonical", status: "pass", group: "On-page SEO", title: "Self-referencing canonical", detail: snap.canonical }
          : { id: "canonical", status: "info", group: "On-page SEO", title: "Canonical points elsewhere", detail: `${snap.canonical} — intentional if this is a duplicate; otherwise it hands the ranking to that URL.`, fix: "Check the Canonical Tag Detector tool for a full analysis." },
  );

  add(
    noindex
      ? { id: "indexable", status: "fail", group: "On-page SEO", title: "Page is set to noindex", detail: `robots ${robotsMeta || xRobots}. Search engines will drop it from results.`, fix: "Remove noindex from the meta robots tag or X-Robots-Tag header unless this page shouldn't rank." }
      : { id: "indexable", status: "pass", group: "On-page SEO", title: "Indexable", detail: "No noindex directive in the meta tag or headers." },
  );

  add(
    snap.lang
      ? { id: "lang", status: "pass", group: "On-page SEO", title: "Language declared", detail: `<html lang="${snap.lang}">` }
      : { id: "lang", status: "warn", group: "On-page SEO", title: "No lang attribute", detail: "Search engines and screen readers guess the language.", fix: 'Add lang="en" (or the right code) to <html>.' },
  );

  /* ── Structured data & sharing ───────────────────────── */
  add(
    invalidLd
      ? { id: "schema", status: "fail", group: "Structured data & sharing", title: "JSON-LD present but invalid", detail: "The structured-data script doesn't parse as JSON, so it does nothing.", fix: "Validate it with the Rich Results Test and fix the syntax (trailing commas, unescaped quotes)." }
      : types.length > 0
        ? { id: "schema", status: "pass", group: "Structured data & sharing", title: "Structured data present", detail: `Types: ${types.join(", ")}.` }
        : { id: "schema", status: "warn", group: "Structured data & sharing", title: "No structured data", detail: "No JSON-LD found. Schema unlocks rich results and helps AI answer engines describe the page correctly.", fix: "Add Organization or WebSite schema site-wide, plus the page type (Product, Article, FAQPage, LocalBusiness). The Schema Generator tool writes it from the page." },
  );

  const og = snap.og;
  add(
    og.title && og.description && og.image
      ? { id: "og", status: "pass", group: "Structured data & sharing", title: "Open Graph complete", detail: `Title, description and image are set — links unfurl properly in Slack, LinkedIn, iMessage.` }
      : og.title || og.description || og.image
        ? { id: "og", status: "warn", group: "Structured data & sharing", title: "Open Graph incomplete", detail: `Missing: ${["title", "description", "image"].filter((k) => !og[k]).join(", ")}. Shared links fall back to whatever the platform scrapes.`, fix: "Add the missing og: tags; og:image should be 1200×630." }
        : { id: "og", status: "fail", group: "Structured data & sharing", title: "No Open Graph tags", detail: "Shared links get no preview card.", fix: "Add og:title, og:description, og:image (1200×630) and og:url. The Meta Tag Generator tool writes them." },
  );

  add(
    snap.twitter.card
      ? { id: "twitter", status: "pass", group: "Structured data & sharing", title: "Twitter card set", detail: `twitter:card = ${snap.twitter.card}` }
      : { id: "twitter", status: "info", group: "Structured data & sharing", title: "No twitter:card", detail: "X falls back to Open Graph, but a summary_large_image card gives a bigger preview.", fix: '<meta name="twitter:card" content="summary_large_image">' },
  );

  add(
    favicon
      ? { id: "favicon", status: "pass", group: "Structured data & sharing", title: "Favicon linked", detail: "Shown in tabs, bookmarks and Google's mobile results." }
      : { id: "favicon", status: "info", group: "Structured data & sharing", title: "No favicon link", detail: "Browsers may still find /favicon.ico, but Google prefers an explicit link.", fix: '<link rel="icon" href="/icon.png" sizes="48x48">' },
  );

  /* ── Content ─────────────────────────────────────────── */
  add(
    words >= 300
      ? { id: "content", status: "pass", group: "Content", title: `${words.toLocaleString()} words of visible text`, detail: keywords.length ? `Most frequent terms: ${keywords.slice(0, 5).join(", ")}.` : "" }
      : words >= 100
        ? { id: "content", status: "warn", group: "Content", title: `Thin content (${words} words)`, detail: "Pages with under ~300 words rarely rank for anything competitive. JavaScript-rendered text isn't counted here.", fix: "Expand the page with the questions visitors ask, or merge it into a stronger page." }
        : { id: "content", status: "fail", group: "Content", title: `Very little text (${words} words)`, detail: "Either the page is nearly empty or its content is rendered by JavaScript, which is indexed later and less reliably.", fix: "Server-render the main content. Check the LLM Readability tool to see what crawlers actually get." },
  );

  add(
    snap.images.total === 0
      ? { id: "alt", status: "info", group: "Content", title: "No images", detail: "Nothing to check." }
      : snap.images.withAlt / snap.images.total >= 0.9
        ? { id: "alt", status: "pass", group: "Content", title: "Images have alt text", detail: `${snap.images.withAlt} of ${snap.images.total} images describe themselves.` }
        : { id: "alt", status: snap.images.withAlt / snap.images.total >= 0.5 ? "warn" : "fail", group: "Content", title: `${snap.images.total - snap.images.withAlt} images missing alt text`, detail: `${snap.images.withAlt} of ${snap.images.total} have alt attributes. Alt text is an accessibility requirement and how image search understands the picture.`, fix: "Describe each meaningful image in a sentence; use alt=\"\" for decorative ones." },
  );

  add(
    snap.links.internal >= 5
      ? { id: "internal-links", status: "pass", group: "Content", title: `${snap.links.internal} internal links`, detail: "Internal links pass authority and help crawlers discover the rest of the site." }
      : { id: "internal-links", status: snap.links.internal === 0 ? "fail" : "warn", group: "Content", title: `Only ${plural(snap.links.internal, "internal link")}`, detail: "Pages with few internal links are harder to discover and rank.", fix: "Link to related pages in the body copy with descriptive anchor text." },
  );

  add(
    lazy > 0 || imgs.length <= 3
      ? { id: "lazy", status: "pass", group: "Content", title: "Images lazy-loaded", detail: imgs.length <= 3 ? "Few images; lazy loading isn't critical." : `${lazy} of ${imgs.length} images use loading="lazy".` }
      : { id: "lazy", status: "warn", group: "Content", title: "No lazy-loaded images", detail: `${imgs.length} images and none use loading="lazy", so all download before the page settles.`, fix: 'Add loading="lazy" to images below the fold; keep the hero image eager.' },
  );

  if (imgs.length >= 3) {
    add(
      unsizedImgs / imgs.length <= 0.25
        ? { id: "img-dimensions", status: "pass", group: "Content", title: "Images declare their size", detail: `${sizedImgs} of ${imgs.length} have width and height, so the layout doesn't jump as they load.` }
        : { id: "img-dimensions", status: unsizedImgs / imgs.length > 0.75 ? "fail" : "warn", group: "Content", title: `${unsizedImgs} images without width/height`, detail: "Browsers can't reserve space for them, so text shifts as each image arrives — that's Cumulative Layout Shift, a Core Web Vital.", fix: "Add width and height attributes (or CSS aspect-ratio) to every <img>; frameworks' image components do this automatically." },
    );
  }

  if (anchors.length > 0) {
    add(
      deadAnchors === 0
        ? { id: "dead-links", status: "pass", group: "Content", title: "No placeholder links", detail: `All ${anchors.length} anchors point somewhere.` }
        : { id: "dead-links", status: deadAnchors > 5 ? "warn" : "info", group: "Content", title: `${plural(deadAnchors, "placeholder link")}`, detail: 'href="#" or javascript: anchors are buttons pretending to be links: crawlers hit a dead end and keyboard users get a link that does nothing.', fix: "Use <button> for actions and give real links a real URL." },
    );
  }

  /* ── Technical ───────────────────────────────────────── */
  add(
    url.protocol === "https:"
      ? { id: "https", status: "pass", group: "Technical", title: "Served over HTTPS", detail: "" }
      : { id: "https", status: "fail", group: "Technical", title: "Not HTTPS", detail: "Browsers flag the page as not secure and Google prefers https URLs.", fix: "Install a certificate and 301 http → https." },
  );

  if (url.protocol === "https:") {
    add(
      mixedActive > 0
        ? { id: "mixed-content", status: "fail", group: "Technical", title: `${plural(mixedActive, "insecure script/style/iframe")}`, detail: "Browsers block http:// scripts, stylesheets and frames on an https page, so those resources never load.", fix: "Change the URLs to https:// (or protocol-relative) and fix the padlock." }
        : mixedPassive > 0
          ? { id: "mixed-content", status: "warn", group: "Technical", title: `${plural(mixedPassive, "insecure image/media file")}`, detail: "Loaded over http:// — Chrome upgrades or blocks them, and the page loses its secure indicator.", fix: "Serve every image, video and audio file over https://." }
          : { id: "mixed-content", status: "pass", group: "Technical", title: "No mixed content", detail: "Every subresource is requested over https." },
    );
  }

  add(
    blockingScripts === 0
      ? { id: "blocking-scripts", status: "pass", group: "Technical", title: "No render-blocking scripts in <head>", detail: "Head scripts are async, deferred or modules." }
      : { id: "blocking-scripts", status: blockingScripts >= 4 ? "fail" : "warn", group: "Technical", title: `${plural(blockingScripts, "render-blocking script")} in <head>`, detail: "Each synchronous <script src> in <head> stops the browser from painting anything until it's downloaded and executed.", fix: "Add defer (or async for independent tags like analytics), or move the tag to the end of <body>." },
  );

  add(
    snap.viewport
      ? { id: "viewport", status: "pass", group: "Technical", title: "Mobile viewport set", detail: snap.viewport }
      : { id: "viewport", status: "fail", group: "Technical", title: "No mobile viewport", detail: "Google indexes the mobile version first; without a viewport it renders as desktop.", fix: '<meta name="viewport" content="width=device-width, initial-scale=1">' },
  );

  add(
    input.loadTimeMs <= 1_200
      ? { id: "speed", status: "pass", group: "Technical", title: `HTML in ${input.loadTimeMs} ms`, detail: `Time to first byte ${input.ttfbMs} ms.` }
      : input.loadTimeMs <= 2_500
        ? { id: "speed", status: "warn", group: "Technical", title: `HTML took ${input.loadTimeMs} ms`, detail: `Time to first byte ${input.ttfbMs} ms. Server response is the floor under every other speed metric.`, fix: "Cache HTML at the edge, reduce server work, or move to static generation. The Page Speed Audit tool digs into the rest." }
        : { id: "speed", status: "fail", group: "Technical", title: `Slow server response (${input.loadTimeMs} ms)`, detail: "Anything over 2.5 s to deliver HTML will fail Core Web Vitals on real devices.", fix: "Serve the page from a CDN cache; investigate slow database queries or plugins." },
  );

  add(
    kb <= 200
      ? { id: "weight", status: "pass", group: "Technical", title: `HTML weight ${kb} KB`, detail: encoding ? `Compressed with ${encoding}.` : "" }
      : { id: "weight", status: kb > 800 ? "fail" : "warn", group: "Technical", title: `Heavy HTML (${kb} KB)`, detail: "Large documents delay parsing on phones — usually inlined CSS/JS or hidden content.", fix: "Move inline styles and scripts to cached files; remove hidden sections." },
  );

  add(
    encoding
      ? { id: "compression", status: "pass", group: "Technical", title: `Compression on (${encoding})`, detail: "" }
      : { id: "compression", status: "warn", group: "Technical", title: "No compression header", detail: "The HTML was served without gzip or brotli.", fix: "Enable brotli/gzip at the CDN or web server." },
  );

  add(
    scripts <= 10
      ? { id: "scripts", status: "pass", group: "Technical", title: `${plural(scripts, "external script")}`, detail: third.length ? `${plural(third.length, "third-party host")}: ${third.slice(0, 4).join(", ")}${third.length > 4 ? "…" : ""}.` : "No third-party hosts referenced." }
      : { id: "scripts", status: scripts > 25 ? "fail" : "warn", group: "Technical", title: `${scripts} external scripts`, detail: `${plural(third.length, "third-party host")}. Each script is a download and often a render delay.`, fix: "Remove unused tags, load analytics after interaction, and consolidate bundles." },
  );

  add(
    secPresent.length >= 4
      ? { id: "security-headers", status: "pass", group: "Technical", title: `${secPresent.length} of ${sec.length} security headers`, detail: secPresent.map((s) => s.name).join(", ") }
      : { id: "security-headers", status: secPresent.length === 0 ? "fail" : "warn", group: "Technical", title: `${secPresent.length} of ${sec.length} security headers`, detail: `Missing: ${sec.filter((s) => !s.present).map((s) => s.name).join(", ")}.`, fix: "Add Strict-Transport-Security, X-Content-Type-Options: nosniff, X-Frame-Options or a CSP frame-ancestors rule, and Referrer-Policy. The Security Headers Checker explains each." },
  );

  add(
    cache
      ? { id: "cache", status: "pass", group: "Technical", title: "Cache-Control set", detail: cache }
      : { id: "cache", status: "info", group: "Technical", title: "No Cache-Control header", detail: "Without caching rules every visit hits the origin.", fix: "Set Cache-Control (e.g. public, s-maxage=300, stale-while-revalidate) so the CDN can serve the page." },
  );

  const base = finalizeChecklist(
    {
      kind: "website-audit",
      requestedUrl: input.requestedUrl,
      finalUrl,
      status: input.status,
      title: snap.title,
      facts: {
        words,
        h1: h1s[0]?.text ?? null,
        titleLength,
        descriptionLength,
        jsonLdTypes: types.join(", ") || null,
        loadTimeMs: input.loadTimeMs,
        htmlKb: kb,
        securityHeaders: `${secPresent.length}/${sec.length}`,
        externalScripts: scripts,
        keywords: keywords.join(", ") || null,
      },
    },
    checks,
  );

  return {
    ...base,
    metrics: {
      titleLength,
      descriptionLength,
      h1Count: h1s.length,
      h2Count: h2s.length,
      words,
      imagesTotal: snap.images.total,
      imagesWithAlt: snap.images.withAlt,
      internalLinks: snap.links.internal,
      externalLinks: snap.links.external,
      jsonLdTypes: types,
      hasOgImage: Boolean(og.image),
      https: url.protocol === "https:",
      loadTimeMs: input.loadTimeMs,
      ttfbMs: input.ttfbMs,
      htmlKb: kb,
      securityHeaders: secPresent.length,
      thirdParties: third.length,
      scripts,
      keywords,
    },
  };
}

export async function auditWebsite(rawUrl: string): Promise<WebsiteAuditReport> {
  const raw = await fetchHtml(rawUrl);
  return auditWebsiteHtml(raw);
}
