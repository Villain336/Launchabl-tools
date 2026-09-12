import { finalizeChecklist, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { attr, fetchHtml, tags } from "@/lib/web/fetch-page";
import { headings, htmlLang, pageTitle, stripTags } from "@/lib/web/html";

/**
 * Static WCAG 2.2 A/AA pass over server-rendered HTML. Catches the defects
 * that make up most of the lawsuits and most of the complaints — missing
 * names, broken structure, blocked zoom, unlabeled controls — and is honest
 * about what it can't see (contrast, focus order, live ARIA state).
 */

export type AccessibilityReport = ChecklistReport & {
  kind: "accessibility";
  stats: {
    images: number;
    imagesMissingAlt: number;
    decorativeImages: number;
    formFields: number;
    unlabeledFields: number;
    headings: number;
    links: number;
    emptyLinks: number;
    emptyButtons: number;
    iframes: number;
  };
  /** Up to 12 concrete offenders per issue so the fix is actionable. */
  examples: Record<string, string[]>;
};

const GENERIC_LINK = /^(click here|here|read more|more|learn more|link|this|details|continue|go|view|see more)\.?$/i;
const SUSPICIOUS_ALT = /^(image|img|photo|picture|graphic|icon|logo|banner|spacer|\d+|dsc_?\d+|img_?\d+|screenshot.*|untitled.*)$|\.(jpe?g|png|gif|webp|svg|avif)$/i;
const LANG_TAG = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i;

const snippet = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 120);

function hasAccessibleName(tag: string, innerHtml = ""): boolean {
  const aria = attr(tag, "aria-label") ?? "";
  if (aria.trim()) return true;
  if (attr(tag, "aria-labelledby")) return true;
  if ((attr(tag, "title") ?? "").trim()) return true;
  const text = stripTags(innerHtml);
  if (text.trim()) return true;
  for (const img of tags(innerHtml, "img")) if ((attr(img, "alt") ?? "").trim()) return true;
  for (const svg of innerHtml.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gi)) {
    if (/<title\b[^>]*>\s*\S/i.test(svg[1]) || (attr(svg[0], "aria-label") ?? "").trim()) return true;
  }
  return false;
}

export function analyzeAccessibilityHtml(html: string, requestedUrl: string, finalUrl: string, status: number): AccessibilityReport {
  const checks: Check[] = [];
  const examples: Record<string, string[]> = {};
  const note = (id: string, value: string) => {
    const list = (examples[id] ??= []);
    if (list.length < 12) list.push(snippet(value));
  };
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");

  /* Document */
  const lang = htmlLang(html);
  checks.push(
    !lang
      ? { id: "lang", status: "fail", group: "Document", title: "No lang attribute on <html>", detail: "Screen readers pick pronunciation rules from the page language; without it, text is read with the wrong voice. WCAG 3.1.1.", fix: 'Add lang to the root element: `<html lang="en">` (use the real language, e.g. "de", "pt-BR").' }
      : LANG_TAG.test(lang)
        ? { id: "lang", status: "pass", group: "Document", title: `Page language: ${lang}`, detail: "Declared on <html>." }
        : { id: "lang", status: "warn", group: "Document", title: `lang="${lang}" isn't a valid language tag`, detail: "Browsers and assistive tech ignore unrecognised tags.", fix: 'Use a BCP 47 tag such as "en", "en-GB" or "es-MX".' },
  );
  const title = pageTitle(html);
  checks.push(
    title
      ? { id: "title", status: "pass", group: "Document", title: "Page has a title", detail: title.slice(0, 120) }
      : { id: "title", status: "fail", group: "Document", title: "No <title>", detail: "The title is the first thing announced when the page opens and the label on every tab and bookmark. WCAG 2.4.2.", fix: "Add a unique, descriptive <title> in <head>." },
  );
  const viewport = tags(html, "meta").find((t) => (attr(t, "name") ?? "").toLowerCase() === "viewport");
  const viewportContent = viewport ? (attr(viewport, "content") ?? "") : "";
  const blocksZoom = /user-scalable\s*=\s*(no|0)/i.test(viewportContent) || /maximum-scale\s*=\s*(1(\.0*)?|0?\.\d+)(?![\d.])/i.test(viewportContent);
  checks.push(
    blocksZoom
      ? { id: "zoom", status: "fail", group: "Document", title: "Pinch-to-zoom is disabled", detail: `viewport: ${viewportContent}. Low-vision users can't enlarge the page; browsers on iOS honour this. WCAG 1.4.4.`, fix: 'Use `<meta name="viewport" content="width=device-width, initial-scale=1">` — drop user-scalable=no and maximum-scale.' }
      : { id: "zoom", status: "pass", group: "Document", title: "Zoom is not blocked", detail: viewportContent || "No viewport restrictions." },
  );
  const refresh = tags(html, "meta").find((t) => /refresh/i.test(attr(t, "http-equiv") ?? ""));
  if (refresh) checks.push({ id: "meta-refresh", status: "warn", group: "Document", title: "Page uses <meta http-equiv=\"refresh\">", detail: `${attr(refresh, "content") ?? ""} — timed refreshes and redirects disorient screen-reader users and reset their position. WCAG 2.2.1.`, fix: "Redirect server-side, or give the user a control to reload." });

  /* Structure */
  const hs = headings(body);
  const h1s = hs.filter((h) => h.level === 1);
  checks.push(
    h1s.length === 1
      ? { id: "h1", status: "pass", group: "Structure", title: "One <h1>", detail: h1s[0].text.slice(0, 120) }
      : h1s.length === 0
        ? { id: "h1", status: "fail", group: "Structure", title: "No <h1>", detail: "The main heading is the landmark screen-reader users jump to first. WCAG 1.3.1 / 2.4.6.", fix: "Wrap the page's main headline in <h1>; style it however you like." }
        : { id: "h1", status: "warn", group: "Structure", title: `${h1s.length} <h1> elements`, detail: h1s.map((h) => h.text.slice(0, 60)).join(" · "), fix: "Keep one <h1> for the page topic; demote the others to <h2>." },
  );
  const skips: string[] = [];
  for (let i = 1; i < hs.length; i++) if (hs[i].level - hs[i - 1].level > 1) skips.push(`h${hs[i - 1].level} "${hs[i - 1].text.slice(0, 30)}" → h${hs[i].level} "${hs[i].text.slice(0, 30)}"`);
  if (hs.length) {
    checks.push(
      skips.length
        ? { id: "heading-order", status: "warn", group: "Structure", title: `${skips.length} heading level skip${skips.length > 1 ? "s" : ""}`, detail: skips.slice(0, 3).join(" · "), fix: "Headings should step down one level at a time (h2 → h3, not h2 → h4). Use CSS for size, not heading level." }
        : { id: "heading-order", status: "pass", group: "Structure", title: `${hs.length} headings in a clean outline`, detail: "No skipped levels." },
    );
    skips.forEach((s) => note("heading-order", s));
  }
  const hasMain = /<main\b/i.test(body) || /role\s*=\s*["']main["']/i.test(body);
  const landmarks = ["nav", "header", "footer"].filter((n) => new RegExp(`<${n}\\b`, "i").test(body));
  checks.push(
    hasMain
      ? { id: "landmarks", status: "pass", group: "Structure", title: `<main> landmark present${landmarks.length ? ` · also ${landmarks.join(", ")}` : ""}`, detail: "Screen-reader users can jump straight to the content." }
      : { id: "landmarks", status: "warn", group: "Structure", title: "No <main> landmark", detail: `${landmarks.length ? `Found ${landmarks.join(", ")} but ` : ""}there is no <main>, so “skip to content” and landmark navigation have nowhere to land. WCAG 1.3.1.`, fix: "Wrap the primary content in <main> (one per page)." },
  );
  const skipLink = Array.from(body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)).some((m) => /^#(main|content|main-content|skip)/i.test(attr(`<a ${m[1]}>`, "href") ?? "") || /skip to|skip navigation/i.test(stripTags(m[2])));
  checks.push(
    skipLink
      ? { id: "skip-link", status: "pass", group: "Structure", title: "Skip-to-content link present", detail: "Keyboard users can bypass the navigation." }
      : { id: "skip-link", status: "warn", group: "Structure", title: "No skip-to-content link", detail: "Keyboard users tab through the whole header on every page. WCAG 2.4.1.", fix: 'Add `<a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>` as the first focusable element and give <main> id="main".' },
  );

  /* Images */
  const imgs = tags(body, "img");
  const missingAlt = imgs.filter((t) => attr(t, "alt") === null && !/role\s*=\s*["']presentation["']|aria-hidden\s*=\s*["']true["']/i.test(t));
  const decorative = imgs.filter((t) => attr(t, "alt") === "");
  const suspicious = imgs.filter((t) => SUSPICIOUS_ALT.test((attr(t, "alt") ?? "").trim()));
  if (imgs.length === 0) checks.push({ id: "alt", status: "info", group: "Images & media", title: "No <img> elements in the HTML", detail: "Images may be CSS backgrounds or rendered by JavaScript; those can't be checked here." });
  else if (missingAlt.length) {
    checks.push({ id: "alt", status: missingAlt.length / imgs.length > 0.25 ? "fail" : "warn", group: "Images & media", title: `${missingAlt.length} of ${imgs.length} images have no alt attribute`, detail: "Screen readers announce the file name or nothing. Decorative images need alt=\"\", meaningful ones need a description. WCAG 1.1.1.", fix: 'Add alt to every <img>: describe what the image conveys, or alt="" if it is purely decorative.' });
    missingAlt.forEach((t) => note("alt", attr(t, "src") ?? t));
  } else checks.push({ id: "alt", status: "pass", group: "Images & media", title: `All ${imgs.length} images have alt attributes`, detail: `${decorative.length} marked decorative (alt="").` });
  if (suspicious.length) {
    checks.push({ id: "alt-quality", status: "warn", group: "Images & media", title: `${suspicious.length} alt text${suspicious.length > 1 ? "s look" : " looks"} like a filename or placeholder`, detail: suspicious.slice(0, 3).map((t) => `"${attr(t, "alt")}"`).join(", "), fix: "Write what the image shows or does (“Team photo at the 2025 offsite”, “Download invoice”)." });
    suspicious.forEach((t) => note("alt-quality", `${attr(t, "alt")} — ${attr(t, "src") ?? ""}`));
  }
  if (decorative.length && decorative.length / imgs.length > 0.6 && imgs.length >= 5) checks.push({ id: "alt-decorative", status: "info", group: "Images & media", title: `${decorative.length} of ${imgs.length} images marked decorative`, detail: "Fine if they truly carry no meaning; suspicious if product shots or charts are among them." });
  const inputImages = tags(body, "input").filter((t) => /type\s*=\s*["']?image/i.test(t) && !(attr(t, "alt") ?? "").trim());
  const media = Array.from(body.matchAll(/<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>/gi));
  const autoplay = media.filter((m) => /\bautoplay\b/i.test(m[2]) && !/\bmuted\b/i.test(m[2]));
  if (autoplay.length) checks.push({ id: "autoplay", status: "warn", group: "Images & media", title: `${autoplay.length} media element${autoplay.length > 1 ? "s" : ""} autoplay with sound`, detail: "Audio that starts on its own talks over screen readers. WCAG 1.4.2.", fix: "Add muted, remove autoplay, or provide a visible pause control within the first three seconds." });
  const videos = media.filter((m) => m[1].toLowerCase() === "video");
  if (videos.length) {
    const noTrack = videos.filter((m) => !/<track\b[^>]*kind\s*=\s*["']?(captions|subtitles)/i.test(m[3]));
    if (noTrack.length) checks.push({ id: "captions", status: "warn", group: "Images & media", title: `${noTrack.length} of ${videos.length} videos have no caption track`, detail: "Deaf and hard-of-hearing visitors get nothing from the audio. WCAG 1.2.2.", fix: 'Add `<track kind="captions" src="captions.vtt" srclang="en">` or embed from a player that supports captions.' });
  }
  const iframes = tags(body, "iframe");
  const untitledFrames = iframes.filter((t) => !(attr(t, "title") ?? "").trim() && !(attr(t, "aria-label") ?? "").trim());
  if (untitledFrames.length) {
    checks.push({ id: "iframe-title", status: "warn", group: "Images & media", title: `${untitledFrames.length} iframe${untitledFrames.length > 1 ? "s" : ""} without a title`, detail: "Screen readers announce “frame” with no idea what's inside (map, video, form…). WCAG 4.1.2.", fix: 'Add title="…" describing the embedded content, e.g. title="Google Maps: our office".' });
    untitledFrames.forEach((t) => note("iframe-title", attr(t, "src") ?? t));
  }

  /* Forms & controls */
  const isField = (t: string) => !/type\s*=\s*["']?(hidden|submit|button|reset|image)/i.test(t);
  const labelFor = new Set(tags(body, "label").map((t) => attr(t, "for")).filter(Boolean));
  const wrappedIds = new Set<string>();
  let wrappedWithoutId = 0;
  for (const m of body.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
    for (const t of [...tags(m[1], "input").filter(isField), ...tags(m[1], "select"), ...tags(m[1], "textarea")]) {
      const id = attr(t, "id");
      if (id) wrappedIds.add(id);
      else wrappedWithoutId += 1;
    }
  }
  const fields = [...tags(body, "input").filter(isField), ...tags(body, "select"), ...tags(body, "textarea")];
  const unlabeled = fields.filter((t) => {
    const id = attr(t, "id");
    if (id && (labelFor.has(id) || wrappedIds.has(id))) return false;
    if ((attr(t, "aria-label") ?? "").trim() || attr(t, "aria-labelledby") || (attr(t, "title") ?? "").trim()) return false;
    return true;
  });
  // Fields wrapped in <label> without an id can't be matched individually; give credit for them.
  const unlabeledCount = Math.max(0, unlabeled.length - wrappedWithoutId);
  const placeholderOnly = unlabeled.filter((t) => (attr(t, "placeholder") ?? "").trim());
  if (fields.length === 0) checks.push({ id: "labels", status: "info", group: "Forms & controls", title: "No form fields in the HTML", detail: "Forms rendered by JavaScript aren't visible to this scan." });
  else if (unlabeledCount > 0) {
    checks.push({ id: "labels", status: "fail", group: "Forms & controls", title: `${unlabeledCount} of ${fields.length} form fields have no label`, detail: `${placeholderOnly.length ? `${placeholderOnly.length} rely on placeholder text, which disappears on typing and isn't reliably announced. ` : ""}Screen-reader users hear “edit text” with no idea what to enter. WCAG 1.3.1 / 3.3.2 / 4.1.2.`, fix: 'Pair every field with `<label for="id">`, or wrap the field in its <label>; use aria-label only for icon-only controls like a search box.' });
    unlabeled.forEach((t) => note("labels", `${attr(t, "name") ?? attr(t, "id") ?? attr(t, "type") ?? "field"}${attr(t, "placeholder") ? ` (placeholder “${attr(t, "placeholder")}”)` : ""}`));
  } else checks.push({ id: "labels", status: "pass", group: "Forms & controls", title: `All ${fields.length} form fields are labelled`, detail: "Via <label>, aria-label or aria-labelledby." });
  const buttons = Array.from(body.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi));
  const emptyButtons = buttons.filter((m) => !hasAccessibleName(`<button ${m[1]}>`, m[2]));
  const roleButtons = Array.from(body.matchAll(/<(a|div|span)\b([^>]*role\s*=\s*["']button["'][^>]*)>([\s\S]*?)<\/\1>/gi)).filter((m) => !hasAccessibleName(`<x ${m[2]}>`, m[3]));
  const nameless = emptyButtons.length + roleButtons.length + inputImages.length;
  if (buttons.length + roleButtons.length + inputImages.length > 0) {
    checks.push(
      nameless
        ? { id: "button-names", status: "fail", group: "Forms & controls", title: `${nameless} button${nameless > 1 ? "s" : ""} with no accessible name`, detail: "Icon-only buttons (menu, close, search, cart) are announced as just “button”. WCAG 4.1.2.", fix: 'Add aria-label="Open menu" (etc.) to icon buttons, or include visually-hidden text inside the button.' }
        : { id: "button-names", status: "pass", group: "Forms & controls", title: `All ${buttons.length + roleButtons.length} buttons have names`, detail: "Text, aria-label or labelled SVG." },
    );
    emptyButtons.forEach((m) => note("button-names", `<button ${m[1].trim()}>`));
    roleButtons.forEach((m) => note("button-names", `<${m[1]} ${m[2].trim()}>`));
  }
  const positiveTabindex = Array.from(body.matchAll(/tabindex\s*=\s*["']?([1-9]\d*)/gi));
  if (positiveTabindex.length) checks.push({ id: "tabindex", status: "warn", group: "Forms & controls", title: `${positiveTabindex.length} element${positiveTabindex.length > 1 ? "s" : ""} with a positive tabindex`, detail: "Positive values override the natural tab order and almost always produce a confusing sequence. WCAG 2.4.3.", fix: "Use tabindex=\"0\" (or none) and let source order define focus order." });
  const focusKilled = /(?:^|[\s,}{;])(?:[^{}]*):focus[^{]*\{[^}]*outline\s*:\s*(?:none|0)\b(?![^}]*outline-offset)[^}]*\}/i.test(html) && !/:focus-visible/i.test(html);
  if (focusKilled) checks.push({ id: "focus-visible", status: "warn", group: "Forms & controls", title: "Inline CSS removes focus outlines", detail: "A `:focus { outline: none }` rule with no replacement means keyboard users can't see where they are. WCAG 2.4.7 / 2.4.11.", fix: "Remove the rule or replace it with a visible `:focus-visible` style (outline or ring with 3:1 contrast)." });

  /* Links */
  const anchors = Array.from(body.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi));
  const linkTags = anchors.filter((m) => attr(`<a ${m[1]}>`, "href") !== null);
  const emptyLinks = linkTags.filter((m) => !hasAccessibleName(`<a ${m[1]}>`, m[2]));
  const generic = linkTags.filter((m) => GENERIC_LINK.test(stripTags(m[2]).trim()));
  if (linkTags.length) {
    checks.push(
      emptyLinks.length
        ? { id: "link-names", status: "fail", group: "Links", title: `${emptyLinks.length} of ${linkTags.length} links have no text`, detail: "Icon and image links without alt or aria-label are announced as their URL. WCAG 2.4.4.", fix: "Give the image an alt or the link an aria-label that says where it goes (“Launchabl on LinkedIn”)." }
        : { id: "link-names", status: "pass", group: "Links", title: `All ${linkTags.length} links have discernible text`, detail: "Text, image alt or aria-label." },
    );
    emptyLinks.forEach((m) => note("link-names", attr(`<a ${m[1]}>`, "href") ?? m[0]));
    if (generic.length) {
      checks.push({ id: "link-text", status: generic.length >= 3 ? "warn" : "info", group: "Links", title: `${generic.length} link${generic.length > 1 ? "s" : ""} say only “${stripTags(generic[0][2]).trim()}”`, detail: "Screen-reader users often navigate by a list of links; “Read more” ×6 is useless out of context. WCAG 2.4.4.", fix: "Make the link text name the destination (“Read the pricing FAQ”), or add aria-label / visually-hidden text." });
      generic.forEach((m) => note("link-text", `${stripTags(m[2]).trim()} → ${attr(`<a ${m[1]}>`, "href") ?? ""}`));
    }
    const newTab = linkTags.filter((m) => /target\s*=\s*["']_blank["']/i.test(m[1]) && !/new (tab|window)|opens in/i.test(`${m[1]} ${stripTags(m[2])}`));
    if (newTab.length >= 3) checks.push({ id: "new-window", status: "info", group: "Links", title: `${newTab.length} links open a new tab without warning`, detail: "Unexpected context changes disorient screen-reader and cognitive-disability users. WCAG 3.2.5 (AAA) / best practice.", fix: "Add visually-hidden “(opens in new tab)” text or an icon with alt, or open in the same tab." });
  }

  /* Tables & ids */
  const tables = Array.from(body.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi));
  const badTables = tables.filter((m) => !/<th\b/i.test(m[1]) && !/role\s*=\s*["']presentation["']/i.test(m[0]));
  if (badTables.length) checks.push({ id: "tables", status: "warn", group: "Structure", title: `${badTables.length} table${badTables.length > 1 ? "s" : ""} without header cells`, detail: "Without <th>, screen readers can't associate cells with their column or row. WCAG 1.3.1.", fix: 'Mark header cells with <th scope="col"> / <th scope="row">, or add role="presentation" for layout tables.' });
  const ids = Array.from(body.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)).map((m) => m[1]);
  const dupes = Array.from(ids.reduce((map, id) => map.set(id, (map.get(id) ?? 0) + 1), new Map<string, number>())).filter(([, n]) => n > 1);
  if (dupes.length) {
    checks.push({ id: "duplicate-ids", status: "warn", group: "Structure", title: `${dupes.length} duplicated id${dupes.length > 1 ? "s" : ""}`, detail: `${dupes.slice(0, 4).map(([id, n]) => `#${id} ×${n}`).join(", ")} — label for=, aria-labelledby and skip links target the first match only. WCAG 4.1.1.`, fix: "Make every id unique on the page." });
    dupes.forEach(([id, n]) => note("duplicate-ids", `#${id} ×${n}`));
  }
  const ariaHiddenFocusable = Array.from(body.matchAll(/<(a|button|input|select|textarea)\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>/gi)).filter((m) => !/tabindex\s*=\s*["']?-1|\bdisabled\b/i.test(m[0]));
  if (ariaHiddenFocusable.length) checks.push({ id: "aria-hidden-focusable", status: "warn", group: "Forms & controls", title: `${ariaHiddenFocusable.length} focusable element${ariaHiddenFocusable.length > 1 ? "s are" : " is"} hidden from screen readers`, detail: "aria-hidden=\"true\" on a link or button leaves it reachable by keyboard but silent — a “ghost” stop.", fix: 'Remove aria-hidden or add tabindex="-1" so the element is skipped consistently.' });

  /* Not measurable */
  checks.push({ id: "contrast", status: "info", group: "Not measured here", title: "Colour contrast, focus order and live ARIA state need a rendered page", detail: "This scan reads the HTML the server sends. Run axe DevTools or Lighthouse in a browser for contrast (WCAG 1.4.3), keyboard focus order and dynamic widgets — or have the agency do a full audit." });

  const stats: AccessibilityReport["stats"] = {
    images: imgs.length,
    imagesMissingAlt: missingAlt.length,
    decorativeImages: decorative.length,
    formFields: fields.length,
    unlabeledFields: unlabeledCount,
    headings: hs.length,
    links: linkTags.length,
    emptyLinks: emptyLinks.length,
    emptyButtons: nameless,
    iframes: iframes.length,
  };
  const base = finalizeChecklist(
    { kind: "accessibility", requestedUrl, finalUrl, status, title, facts: { lang, title, ...stats, zoomBlocked: blocksZoom, hasMain, skipLink } },
    checks,
  );
  return { ...base, kind: "accessibility", stats, examples };
}

export async function auditAccessibility(rawUrl: string): Promise<AccessibilityReport> {
  const raw = await fetchHtml(rawUrl);
  return analyzeAccessibilityHtml(raw.html, rawUrl, raw.finalUrl, raw.status);
}
