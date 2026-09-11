import { attr, decodeEntities, FETCH_HEADERS, fetchHtml, tags, type RawPage } from "@/lib/web/fetch-page";
import { finalizeChecklist, plural, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { isQuestion } from "@/lib/web/voice-search";

/**
 * How well a page can be read, understood and cited by LLM-based search
 * (ChatGPT search, Perplexity, Claude, Google AI Overviews).
 *
 * Three inputs: the page HTML, /robots.txt (which AI crawlers are allowed),
 * and /llms.txt (the emerging site summary for language models).
 */

export type CrawlerAccess = "allowed" | "blocked" | "restricted";

export type CrawlerStatus = {
  agent: string;
  vendor: string;
  /** What blocking this agent actually affects. */
  purpose: "training" | "search" | "user-fetch";
  access: CrawlerAccess;
  /** Which robots.txt group decided it. */
  via: string | null;
};

export const AI_CRAWLERS: Omit<CrawlerStatus, "access" | "via">[] = [
  { agent: "GPTBot", vendor: "OpenAI", purpose: "training" },
  { agent: "OAI-SearchBot", vendor: "OpenAI", purpose: "search" },
  { agent: "ChatGPT-User", vendor: "OpenAI", purpose: "user-fetch" },
  { agent: "ClaudeBot", vendor: "Anthropic", purpose: "training" },
  { agent: "Claude-SearchBot", vendor: "Anthropic", purpose: "search" },
  { agent: "Claude-User", vendor: "Anthropic", purpose: "user-fetch" },
  { agent: "anthropic-ai", vendor: "Anthropic", purpose: "training" },
  { agent: "PerplexityBot", vendor: "Perplexity", purpose: "search" },
  { agent: "Perplexity-User", vendor: "Perplexity", purpose: "user-fetch" },
  { agent: "Google-Extended", vendor: "Google (Gemini training)", purpose: "training" },
  { agent: "Applebot-Extended", vendor: "Apple Intelligence", purpose: "training" },
  { agent: "meta-externalagent", vendor: "Meta AI", purpose: "training" },
  { agent: "Amazonbot", vendor: "Amazon (Alexa)", purpose: "search" },
  { agent: "Bytespider", vendor: "ByteDance", purpose: "training" },
  { agent: "CCBot", vendor: "Common Crawl", purpose: "training" },
  { agent: "DuckAssistBot", vendor: "DuckDuckGo", purpose: "search" },
];

type RobotsGroup = { agents: string[]; allow: string[]; disallow: string[] };

export function parseRobots(text: string): { groups: RobotsGroup[]; sitemaps: string[] } {
  const groups: RobotsGroup[] = [];
  const sitemaps: string[] = [];
  let current: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (key === "sitemap") {
      sitemaps.push(value);
      continue;
    }
    if (!current) continue;
    if (key === "allow") current.allow.push(value);
    if (key === "disallow") current.disallow.push(value);
  }
  return { groups, sitemaps };
}

export function crawlerAccess(robots: ReturnType<typeof parseRobots>, agent: string): { access: CrawlerAccess; via: string | null } {
  const lower = agent.toLowerCase();
  const specific = robots.groups.find((g) => g.agents.includes(lower));
  const group = specific ?? robots.groups.find((g) => g.agents.includes("*"));
  if (!group) return { access: "allowed", via: null };
  const via = specific ? agent : "*";
  const blocksAll = group.disallow.some((d) => d === "/" || d === "/*");
  const allowsRoot = group.allow.some((a) => a === "/" || a === "/*");
  if (blocksAll) return { access: allowsRoot ? "allowed" : "blocked", via };
  if (group.disallow.some((d) => d.length > 0)) return { access: "restricted", via };
  return { access: "allowed", via };
}

async function fetchText(url: string, timeoutMs = 6_000): Promise<{ status: number | null; text: string }> {
  try {
    const response = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) {
      response.body?.cancel().catch(() => undefined);
      return { status: response.status, text: "" };
    }
    const type = response.headers.get("content-type") ?? "";
    if (/html/i.test(type)) {
      response.body?.cancel().catch(() => undefined);
      return { status: response.status, text: "" };
    }
    const text = (await response.text()).slice(0, 200_000);
    return { status: response.status, text };
  } catch {
    return { status: null, text: "" };
  }
}

export type LlmReadabilityReport = ChecklistReport & {
  crawlers: CrawlerStatus[];
  llmsTxt: { url: string; present: boolean; lines: number; preview: string | null };
  robotsTxt: { url: string; present: boolean; sitemaps: string[] };
};

export type LlmReadabilityInput = Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status" | "bytes"> & {
  robotsText: string | null;
  llmsText: string | null;
};

function headingOutline(html: string): { level: number; text: string }[] {
  return Array.from(html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map((m) => ({ level: Number(m[1]), text: decodeEntities(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) }))
    .filter((h) => h.text)
    .slice(0, 300);
}

export function analyzeLlmReadabilityHtml(input: LlmReadabilityInput): LlmReadabilityReport {
  const { html, finalUrl } = input;
  const origin = new URL(finalUrl).origin;
  const head = html.slice(0, 200_000);
  const metas = tags(head, "meta");
  const metaBy = (key: "name" | "property", value: string) => {
    const tag = metas.find((t) => (attr(t, key) ?? "").toLowerCase() === value.toLowerCase());
    return tag ? attr(tag, "content") : null;
  };
  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].replace(/\s+/g, " ")) : null;
  const description = metaBy("name", "description") ?? "";
  const robotsMeta = (metaBy("name", "robots") ?? "").toLowerCase();
  const canonical = tags(head, "link").find((t) => /\bcanonical\b/i.test(attr(t, "rel") ?? ""));

  const robots = parseRobots(input.robotsText ?? "");
  const crawlers: CrawlerStatus[] = AI_CRAWLERS.map((c) => ({ ...c, ...crawlerAccess(robots, c.agent) }));
  const blockedSearch = crawlers.filter((c) => c.purpose !== "training" && c.access === "blocked");
  const blockedTraining = crawlers.filter((c) => c.purpose === "training" && c.access === "blocked");
  const wildcardBlocksAll = crawlerAccess(robots, "SomeUnknownBot").access === "blocked";

  const llmsLines = input.llmsText ? input.llmsText.split(/\r?\n/).filter((l) => l.trim()).length : 0;
  const llmsPresent = Boolean(input.llmsText && llmsLines >= 2 && /^#\s+\S/m.test(input.llmsText));

  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");
  const text = decodeEntities(bodyOnly.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  const words = text ? text.split(/\s+/).length : 0;
  const ratio = html.length ? text.length / html.length : 0;
  const scripts = tags(html, "script").length;
  const emptyRoot = /<div\b[^>]*id\s*=\s*["'](root|app|__next|__nuxt)["'][^>]*>\s*<\/div>/i.test(html);

  const outline = headingOutline(html);
  const h1s = outline.filter((h) => h.level === 1);
  let skipped = 0;
  for (let i = 1; i < outline.length; i++) if (outline[i].level > outline[i - 1].level + 1) skipped++;
  const questionHeads = outline.filter((h) => isQuestion(h.text)).length;

  const jsonLd = Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)).map((m) => m[1]);
  const types = jsonLd.flatMap((j) => Array.from(j.matchAll(/"@type"\s*:\s*"([^"]+)"/g)).map((t) => t[1])).filter((v, i, a) => a.indexOf(v) === i);
  const ldDates = jsonLd.some((j) => /"(datePublished|dateModified)"/.test(j));
  const ldAuthor = jsonLd.some((j) => /"author"/.test(j));
  const published = metaBy("property", "article:published_time") ?? metaBy("name", "date") ?? metaBy("name", "pubdate");
  const modified = metaBy("property", "article:modified_time") ?? metaBy("name", "last-modified");
  const timeTags = tags(html, "time").filter((t) => attr(t, "datetime")).length;
  const authorMeta = metaBy("name", "author") ?? metaBy("property", "article:author");
  const hasDates = Boolean(published || modified || timeTags || ldDates);
  const hasAuthor = Boolean(authorMeta || ldAuthor || /rel\s*=\s*["']author["']/i.test(html));

  const firstPara = Array.from(bodyOnly.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => decodeEntities(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")))
    .find((p) => p.split(/\s+/).length >= 8);
  const subject = (h1s[0]?.text ?? title ?? "").split(/[|–—:·-]/)[0].trim();
  const entityStatement = Boolean(
    firstPara && /\b(is|are|was|helps|lets|provides|offers|makes)\b/i.test(firstPara) && firstPara.split(/\s+/).length <= 70 && (!subject || firstPara.toLowerCase().includes(subject.toLowerCase().split(/\s+/)[0])),
  );

  const semantic = { main: /<main\b/i.test(html), article: /<article\b/i.test(html), nav: /<nav\b/i.test(html), section: /<section\b/i.test(html) };
  const tablesLists = (html.match(/<table\b/gi) ?? []).length + (html.match(/<[ou]l\b/gi) ?? []).length;
  const og = metas.some((m) => /^og:/i.test(attr(m, "property") ?? ""));

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  /* ── Access ─────────────────────────────────────────── */
  add(
    input.robotsText === null
      ? { id: "robots", status: "info", group: "Crawler access", title: "No robots.txt", detail: "Nothing blocks AI crawlers; every agent below is allowed by default." }
      : wildcardBlocksAll
        ? { id: "robots", status: "fail", group: "Crawler access", title: "robots.txt blocks all crawlers", detail: "User-agent: * / Disallow: / — search engines and every AI system are shut out.", fix: "Remove the blanket Disallow: / (or allow the specific bots you want) in robots.txt." }
        : blockedSearch.length
          ? { id: "robots", status: "warn", group: "Crawler access", title: `${plural(blockedSearch.length, "AI search/answer crawler")} blocked`, detail: `${blockedSearch.map((c) => `${c.agent} (${c.vendor})`).join(", ")} can't read this page, so it can't be cited in ${blockedSearch.map((c) => c.vendor.split(" ")[0]).filter((v, i, a) => a.indexOf(v) === i).join("/")} answers.${blockedTraining.length ? ` Training-only bots blocked: ${blockedTraining.map((c) => c.agent).join(", ")} — that's a separate choice.` : ""}`, fix: "Allow the search agents (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot/Claude-SearchBot) while keeping training bots (GPTBot, Google-Extended, CCBot) blocked if you don't want to be in training data." }
          : { id: "robots", status: "pass", group: "Crawler access", title: "AI search crawlers allowed", detail: blockedTraining.length ? `Answer engines can read the page. Training-only bots blocked: ${blockedTraining.map((c) => c.agent).join(", ")}.` : "No AI crawler is blocked in robots.txt." },
  );

  add(
    robotsMeta.includes("noindex")
      ? { id: "meta-robots", status: "fail", group: "Crawler access", title: "Page is noindex", detail: `<meta name="robots" content="${robotsMeta}"> — most AI search products inherit search-engine indexes; a noindex page is invisible to them.`, fix: "Remove noindex if this page should be discoverable." }
      : /nosnippet|max-snippet:\s*0/.test(robotsMeta)
        ? { id: "meta-robots", status: "warn", group: "Crawler access", title: "Snippets disabled", detail: `“${robotsMeta}” stops Google (including AI Overviews) from quoting the page.`, fix: "Drop nosnippet / max-snippet:0 unless the restriction is intentional." }
        : /noai|noimageai/.test(robotsMeta)
          ? { id: "meta-robots", status: "info", group: "Crawler access", title: "noai directive present", detail: `“${robotsMeta}” asks AI systems not to train on the page. It's honoured by some vendors, not all; robots.txt is the enforceable route.` }
          : { id: "meta-robots", status: "pass", group: "Crawler access", title: "No restrictive robots meta", detail: robotsMeta ? `“${robotsMeta}”` : "Indexing and snippets are allowed." },
  );

  add(
    llmsPresent
      ? { id: "llms-txt", status: "pass", group: "Crawler access", title: "/llms.txt present", detail: `${plural(llmsLines, "line")} — a curated map of the site for language models.` }
      : { id: "llms-txt", status: "warn", group: "Crawler access", title: "No /llms.txt", detail: "llms.txt is a Markdown file at the site root that tells LLMs what the site is and links to the pages worth reading. It's an emerging standard (llmstxt.org) adopted by Anthropic, Stripe, Vercel and others.", fix: "Ask here to draft one from this page; publish it at /llms.txt as text/markdown." },
  );

  /* ── Content clarity ───────────────────────────────── */
  add(
    words >= 300
      ? { id: "text-volume", status: "pass", group: "Content", title: `${words.toLocaleString()} words of readable text`, detail: "Enough substance for a model to summarise and cite." }
      : emptyRoot || (words < 150 && scripts > 5)
        ? { id: "text-volume", status: "fail", group: "Content", title: "Content is rendered by JavaScript", detail: `Only ${words} words in the HTML${emptyRoot ? " and an empty app root" : ""}. Most AI crawlers don't execute JavaScript, so they see a blank page.`, fix: "Server-render or pre-render the page (SSR/SSG). In Next.js, move data fetching to Server Components; in SPAs, add prerendering." }
        : { id: "text-volume", status: "warn", group: "Content", title: `Thin content (${words} words)`, detail: "Short pages give models little to work with and rarely get cited.", fix: "Add the substantive explanation, definitions and data a reader (or model) would need to answer questions about this topic." },
  );

  add(
    ratio >= 0.1
      ? { id: "text-ratio", status: "pass", group: "Content", title: `Text-to-markup ratio ${Math.round(ratio * 100)}%`, detail: "Content isn't buried under markup and scripts." }
      : { id: "text-ratio", status: ratio < 0.04 ? "fail" : "warn", group: "Content", title: `Low text-to-markup ratio (${Math.round(ratio * 100)}%)`, detail: `${Math.round(html.length / 1024)} KB of HTML carries ${Math.round(text.length / 1024)} KB of text. Crawlers with byte budgets may truncate before the content.`, fix: "Remove inline scripts/styles and SVG sprites from the HTML, or load them externally so the text comes first." },
  );

  add(
    entityStatement
      ? { id: "entity", status: "pass", group: "Content", title: "Opens with a clear definition", detail: `“${firstPara!.slice(0, 160)}${firstPara!.length > 160 ? "…" : ""}”` }
      : { id: "entity", status: "warn", group: "Content", title: "No clear opening statement of what this is", detail: firstPara ? `The first paragraph (“${firstPara.slice(0, 100)}…”) doesn't define the subject in one sentence.` : "No introductory paragraph found.", fix: `Start the body with one plain sentence: “${subject || "[Subject]"} is a … that … for ….” Models lift these definitional sentences directly.` },
  );

  add(
    h1s.length === 1 && skipped === 0
      ? { id: "headings", status: "pass", group: "Content", title: "Clean heading hierarchy", detail: `One H1 (“${h1s[0].text}”), ${plural(outline.length - 1, "subheading")}, no skipped levels.` }
      : { id: "headings", status: h1s.length === 0 ? "fail" : "warn", group: "Content", title: h1s.length === 0 ? "No H1" : h1s.length > 1 ? `${h1s.length} H1 headings` : `${plural(skipped, "skipped heading level")}`, detail: "Models use the heading outline to understand structure and pick the section that answers a query.", fix: "Exactly one H1, then H2 for sections and H3 for sub-points without jumping levels." },
  );

  add(
    questionHeads >= 2
      ? { id: "questions", status: "pass", group: "Content", title: `${plural(questionHeads, "question heading")}`, detail: "Question-and-answer structure maps directly onto how people prompt AI assistants." }
      : { id: "questions", status: "info", group: "Content", title: "Few or no question headings", detail: "Optional but effective: an FAQ section with the exact questions users ask makes the page easy to quote." },
  );

  add(
    tablesLists >= 2
      ? { id: "structure", status: "pass", group: "Content", title: "Facts in lists and tables", detail: `${plural(tablesLists, "list or table")} — models extract structured facts more reliably than from prose.` }
      : { id: "structure", status: "info", group: "Content", title: "Little structured content", detail: "Where the page states specs, prices, steps or comparisons, tables and lists are extracted more accurately than paragraphs." },
  );

  /* ── Machine-readable signals ───────────────────────── */
  add(
    types.length
      ? { id: "json-ld", status: "pass", group: "Structured data", title: `JSON-LD: ${types.slice(0, 6).join(", ")}`, detail: "Schema.org data gives models unambiguous facts (name, author, price, dates) to cite." }
      : { id: "json-ld", status: "warn", group: "Structured data", title: "No JSON-LD structured data", detail: "Nothing tells machines what kind of thing this page is about.", fix: "Add JSON-LD for the page type — Article/BlogPosting, Product, Organization, FAQPage, HowTo — with name, description, dates and author. The Schema Generator tool can write it." },
  );

  add(
    hasDates
      ? { id: "dates", status: "pass", group: "Structured data", title: "Publication / modification dates present", detail: [published && `published ${published}`, modified && `modified ${modified}`, timeTags && `${plural(timeTags, "<time> element")}`, ldDates && "dates in JSON-LD"].filter(Boolean).join(" · ") }
      : { id: "dates", status: "warn", group: "Structured data", title: "No dates", detail: "Answer engines prefer sources they can date; undated pages are treated as potentially stale.", fix: "Add dateModified/datePublished in JSON-LD, article:published_time meta, or a visible <time datetime=…> element." },
  );

  add(
    hasAuthor
      ? { id: "author", status: "pass", group: "Structured data", title: "Author attributed", detail: authorMeta ?? "Author in JSON-LD or rel=author" }
      : { id: "author", status: "info", group: "Structured data", title: "No author attribution", detail: "Named authorship (with an about/bio link) supports the credibility signals AI search products weigh when choosing sources." },
  );

  add(
    canonical
      ? { id: "canonical", status: "pass", group: "Structured data", title: "Canonical URL declared", detail: attr(canonical, "href") ?? "" }
      : { id: "canonical", status: "warn", group: "Structured data", title: "No canonical URL", detail: "Duplicate URLs split the signals; models may cite the wrong variant.", fix: '<link rel="canonical" href="…"> in <head>.' },
  );

  add(
    title && description.length >= 50
      ? { id: "title-description", status: "pass", group: "Structured data", title: "Title and description present", detail: `“${title}” · ${description.length}-char description` }
      : { id: "title-description", status: "warn", group: "Structured data", title: title ? "Meta description missing or thin" : "Missing <title>", detail: "Title and description are the first thing any crawler summarises.", fix: "A specific title under 60 characters and a 120–155 character description that states what the page answers." },
  );

  add(
    semantic.main || semantic.article
      ? { id: "semantic", status: "pass", group: "Structured data", title: "Semantic HTML landmarks", detail: Object.entries(semantic).filter(([, v]) => v).map(([k]) => `<${k}>`).join(" ") }
      : { id: "semantic", status: "warn", group: "Structured data", title: "No <main> or <article>", detail: "Readability extractors (used by most crawlers) rely on landmarks to separate content from chrome.", fix: "Wrap the primary content in <main> (and <article> for posts); put navigation in <nav> and boilerplate in <footer>." },
  );

  add(
    og
      ? { id: "og", status: "pass", group: "Structured data", title: "Open Graph tags present", detail: "Used by AI browsers and chat clients when they preview a cited page." }
      : { id: "og", status: "info", group: "Structured data", title: "No Open Graph tags", detail: "Optional; helps citations render with a title and image in chat UIs." },
  );

  add(
    robots.sitemaps.length
      ? { id: "sitemap", status: "pass", group: "Crawler access", title: "Sitemap declared in robots.txt", detail: robots.sitemaps.join(", ") }
      : { id: "sitemap", status: "info", group: "Crawler access", title: "No Sitemap line in robots.txt", detail: "Add Sitemap: https://…/sitemap.xml so crawlers discover every page." },
  );

  const base = finalizeChecklist(
    {
      kind: "llm-readability",
      requestedUrl: input.requestedUrl,
      finalUrl,
      status: input.status,
      title,
      facts: {
        words,
        textRatio: Math.round(ratio * 100),
        h1: h1s[0]?.text ?? null,
        jsonLdTypes: types.join(", ") || null,
        blockedCrawlers: crawlers.filter((c) => c.access === "blocked").map((c) => c.agent).join(", ") || null,
        llmsTxt: llmsPresent,
        dates: hasDates,
        author: hasAuthor,
        subject: subject || null,
        description: description || null,
      },
    },
    checks,
  );

  return {
    ...base,
    crawlers,
    llmsTxt: { url: `${origin}/llms.txt`, present: llmsPresent, lines: llmsLines, preview: llmsPresent ? input.llmsText!.slice(0, 600) : null },
    robotsTxt: { url: `${origin}/robots.txt`, present: input.robotsText !== null, sitemaps: robots.sitemaps },
  };
}

export async function analyzeLlmReadability(rawUrl: string): Promise<LlmReadabilityReport> {
  const raw = await fetchHtml(rawUrl);
  const origin = new URL(raw.finalUrl).origin;
  const [robots, llms] = await Promise.all([fetchText(`${origin}/robots.txt`), fetchText(`${origin}/llms.txt`)]);
  return analyzeLlmReadabilityHtml({
    ...raw,
    robotsText: robots.status === 200 ? robots.text : null,
    llmsText: llms.status === 200 && llms.text.trim() ? llms.text : null,
  });
}
