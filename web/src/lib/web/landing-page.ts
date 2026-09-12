import { attr, fetchHtml, tags, type RawPage } from "@/lib/web/fetch-page";
import { finalizeChecklist, plural, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { bodyText, callsToAction, forms, headings, htmlLang, mainMarkup, metaContent, pageTitle, paragraphs, SOCIAL_PROOF_NUMBER, stripTags, TRUST_PATTERN, URGENCY_PATTERN, wordCount } from "@/lib/web/html";

/**
 * Conversion grade for a landing page from its server-rendered HTML.
 *
 * A page can rank and still not convert. These checks follow what CRO
 * practitioners look at first: one clear promise, one obvious next step,
 * low friction to take it, reasons to believe, and nothing slowing the
 * visitor down.
 */

export type LandingPageInput = Pick<RawPage, "html" | "finalUrl" | "requestedUrl" | "status"> & { loadTimeMs?: number; ttfbMs?: number; bytes?: number };

export type LandingPageReport = ChecklistReport & {
  ctas: { text: string; kind: string; weak: boolean }[];
  headline: string | null;
  subheadline: string | null;
};

/** Position in the document, 0..1, used as a stand-in for "above the fold". */
const position = (index: number, length: number) => (length ? index / length : 1);

export function gradeLandingPageHtml(input: LandingPageInput): LandingPageReport {
  const { html, finalUrl } = input;
  const url = new URL(finalUrl);
  const main = mainMarkup(html);
  const bodyStart = Math.max(0, html.search(/<body\b/i));
  const docLength = Math.max(1, html.length - bodyStart);
  const rel = (index: number) => position(Math.max(0, index - bodyStart), docLength);

  const heads = headings(html);
  const h1s = heads.filter((h) => h.level === 1);
  const headline = h1s[0]?.text ?? null;
  const paras = paragraphs(html, 4);
  const subheadline = h1s[0] ? (paras.find((p) => p.index > h1s[0].index && p.index - h1s[0].index < 1_500)?.text ?? null) : null;
  const text = bodyText(html);
  const words = wordCount(text);
  const ctas = callsToAction(main);
  const distinctCtas = Array.from(new Map(ctas.map((c) => [c.text.toLowerCase(), c])).values());
  const earlyCta = ctas.find((c) => rel(c.index) < 0.35);
  const weakCtas = distinctCtas.filter((c) => c.weak);
  const formList = forms(html);
  const primaryForm = formList[0] ?? null;
  const formEarly = primaryForm ? rel(primaryForm.index) < 0.5 : false;
  const trustHits = text.match(new RegExp(TRUST_PATTERN.source, "gi")) ?? [];
  const proof = text.match(SOCIAL_PROOF_NUMBER);
  const urgency = text.match(URGENCY_PATTERN);
  const testimonialMarkup = /<blockquote\b|class\s*=\s*["'][^"']*(testimonial|review|quote)/i.test(html);
  const logoStrip = /(trusted by|as seen|featured in|used by|powering)/i.test(text);
  const phone = tags(html, "a").some((a) => /^tel:/i.test(attr(a, "href") ?? ""));
  const anyPhone = phone || /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  const navLinks = Array.from(html.matchAll(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gi)).reduce((n, m) => n + (m[1].match(/<a\b/gi) ?? []).length, 0);
  const host = url.hostname.replace(/^www\./, "");
  let externalLinks = 0;
  for (const a of tags(main, "a")) {
    const href = attr(a, "href");
    if (!href || !/^https?:/i.test(href)) continue;
    try {
      if (new URL(href).hostname.replace(/^www\./, "") !== host) externalLinks++;
    } catch {
      // ignore
    }
  }
  const video = /<video\b|youtube\.com\/embed|player\.vimeo\.com|wistia|loom\.com\/embed/i.test(html);
  const imgs = tags(html, "img");
  const heroImage = imgs.some((t) => rel(html.indexOf(t)) < 0.3);
  const viewport = metaContent(html, "name", "viewport");
  const title = pageTitle(html);
  const description = metaContent(html, "name", "description") ?? "";
  const lang = htmlLang(html);
  const privacyLink = tags(html, "a").some((a) => /privacy/i.test(attr(a, "href") ?? "") || /privacy/i.test(stripTags(a)));
  const pricingMention = /\$\s?\d|€\s?\d|£\s?\d|\b\d+\s?(usd|eur|gbp)\b|\/\s?(mo|month|yr|year)\b|free\b/i.test(text);
  const benefitWords = /\b(save|faster|easier|grow|more|less|without|in minutes|automat|never|stop|start)\b/i;
  const headlineWords = headline ? wordCount(headline) : 0;

  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);

  /* ── Message ─────────────────────────────────────────── */
  add(
    !headline
      ? { id: "headline", status: "fail", group: "Message", title: "No H1 headline", detail: "The page has no H1. Visitors decide in about five seconds whether they're in the right place; the headline is what they read.", fix: "Add one H1 that states the outcome for the visitor in 5–12 words, e.g. “Invoices out in 60 seconds, paid twice as fast.”" }
      : h1s.length > 1
        ? { id: "headline", status: "warn", group: "Message", title: `${h1s.length} H1 headlines`, detail: `“${headline}” competes with ${h1s.length - 1} other H1${h1s.length > 2 ? "s" : ""}. One promise per page converts better and is clearer to search engines.`, fix: "Keep one H1 for the main promise; demote the others to H2." }
        : headlineWords < 3
          ? { id: "headline", status: "warn", group: "Message", title: "Headline is a label, not a promise", detail: `“${headline}” is ${plural(headlineWords, "word")}. Short brand-style headlines assume the visitor already knows what you do.`, fix: "Rewrite the H1 as the specific outcome the visitor gets, 5–12 words. Put the brand in the logo, not the headline." }
          : headlineWords > 14
            ? { id: "headline", status: "warn", group: "Message", title: "Headline is long", detail: `“${headline}” is ${headlineWords} words. Headlines over ~12 words get skimmed, not read.`, fix: "Cut the H1 to its core promise and move the qualifier into the subheadline." }
            : { id: "headline", status: "pass", group: "Message", title: "Clear H1 headline", detail: `“${headline}” (${headlineWords} words).` },
  );

  add(
    !headline
      ? { id: "subheadline", status: "info", group: "Message", title: "Supporting subheadline", detail: "Add a headline first." }
      : subheadline
        ? benefitWords.test(subheadline) || /\byou\b/i.test(subheadline)
          ? { id: "subheadline", status: "pass", group: "Message", title: "Subheadline explains the benefit", detail: `“${subheadline.slice(0, 160)}${subheadline.length > 160 ? "…" : ""}”` }
          : { id: "subheadline", status: "warn", group: "Message", title: "Subheadline doesn't sell the benefit", detail: `The text under the headline (“${subheadline.slice(0, 120)}…”) describes rather than persuades.`, fix: "Use the subheadline to answer “what do I get and why should I believe it?” — name the outcome, who it's for and the proof." }
        : { id: "subheadline", status: "warn", group: "Message", title: "No text under the headline", detail: "There's no paragraph within reach of the H1 to expand the promise.", fix: "Add one or two sentences under the H1: what it does, for whom, and the main reason to believe it." },
  );

  add(
    pricingMention
      ? { id: "offer-clarity", status: "pass", group: "Message", title: "Offer or price is stated", detail: "The page mentions pricing or a free option, so visitors can qualify themselves." }
      : { id: "offer-clarity", status: "info", group: "Message", title: "No price or offer terms visible", detail: "Pages that hide the offer get more clicks to pricing but fewer conversions. Fine for enterprise sales; a gap for self-serve.", fix: "If self-serve, state the price, the free tier or the trial terms near the primary CTA." },
  );

  /* ── Call to action ──────────────────────────────────── */
  add(
    distinctCtas.length === 0
      ? { id: "cta-present", status: "fail", group: "Call to action", title: "No call to action found", detail: "No buttons, submit inputs or action-worded links were detected in the main content.", fix: "Add one primary button above the fold with an action verb and the outcome, e.g. “Start free trial” or “Book a 15-minute demo”." }
      : distinctCtas.length <= 3
        ? { id: "cta-present", status: "pass", group: "Call to action", title: `${plural(distinctCtas.length, "distinct call to action")}`, detail: `Primary: “${distinctCtas[0].text}”. A small number of clear asks keeps the decision simple.` }
        : distinctCtas.length <= 6
          ? { id: "cta-present", status: "warn", group: "Call to action", title: `${distinctCtas.length} different calls to action`, detail: `“${distinctCtas.slice(0, 4).map((c) => c.text).join("”, “")}”… Each extra option splits attention and lowers the click-through on the one that matters.`, fix: "Pick one primary action and repeat it. Turn the rest into plain text links or remove them." }
          : { id: "cta-present", status: "fail", group: "Call to action", title: `${distinctCtas.length} competing calls to action`, detail: "This many asks reads like a navigation page, not a landing page.", fix: "Landing pages convert best with one goal. Remove or demote everything that isn't the primary conversion." },
  );

  add(
    distinctCtas.length === 0
      ? { id: "cta-fold", status: "info", group: "Call to action", title: "CTA above the fold", detail: "Add a CTA first." }
      : earlyCta
        ? { id: "cta-fold", status: "pass", group: "Call to action", title: "CTA appears early in the page", detail: `“${earlyCta.text}” is in the first third of the document — likely visible without scrolling.` }
        : { id: "cta-fold", status: "fail", group: "Call to action", title: "First CTA is far down the page", detail: `The first call to action (“${ctas[0].text}”) appears ${Math.round(rel(ctas[0].index) * 100)}% of the way through the markup. Most visitors never scroll that far.`, fix: "Place the primary button directly under the headline and subheadline." },
  );

  if (distinctCtas.length > 0) {
    add(
      weakCtas.length > 0
        ? { id: "cta-wording", status: "warn", group: "Call to action", title: "Generic button text", detail: `“${weakCtas.map((c) => c.text).join("”, “")}” says nothing about what happens next. Specific, first-person or outcome-led labels lift clicks measurably.`, fix: "Replace with the outcome: “Get my free audit”, “Start my 14-day trial”, “Send me the guide”." }
        : distinctCtas.some((c) => c.actionable)
          ? { id: "cta-wording", status: "pass", group: "Call to action", title: "Action-led button text", detail: `“${distinctCtas.find((c) => c.actionable)!.text}” tells the visitor what they get.` }
          : { id: "cta-wording", status: "warn", group: "Call to action", title: "Buttons don't start with a verb", detail: `“${distinctCtas[0].text}” — labels without a verb read as headings, not actions.`, fix: "Start each button with a verb and end with the payoff." },
    );
  }

  add(
    urgency
      ? { id: "risk-reversal", status: "pass", group: "Call to action", title: "Friction reducer near the ask", detail: `“${urgency[0]}” — a reason to act now or a reason not to worry.` }
      : { id: "risk-reversal", status: "info", group: "Call to action", title: "No risk reversal or urgency", detail: "Nothing like “no credit card”, “cancel anytime”, “free for 14 days” or a guarantee was found.", fix: "Add one line of reassurance under the primary button: what it costs, how long it takes, or how to undo it." },
  );

  /* ── Lead capture ────────────────────────────────────── */
  add(
    !primaryForm
      ? { id: "form", status: distinctCtas.length ? "info" : "warn", group: "Lead capture", title: "No form on the page", detail: distinctCtas.length ? "The CTA sends visitors elsewhere to convert — fine if that next page is fast and focused." : "No form and no CTA: there's no way to convert on this page.", fix: distinctCtas.length ? undefined : "Add a short form (email, maybe name) or a booking widget." }
      : primaryForm.fields <= 3
        ? { id: "form", status: "pass", group: "Lead capture", title: `Short form (${plural(primaryForm.fields, "field")})`, detail: `${formList.length > 1 ? `${formList.length} forms found; the first has ` : ""}${primaryForm.fields} visible field${primaryForm.fields === 1 ? "" : "s"}${primaryForm.required ? `, ${primaryForm.required} required` : ""}. Each field removed lifts completion.` }
        : primaryForm.fields <= 6
          ? { id: "form", status: "warn", group: "Lead capture", title: `Form asks for ${primaryForm.fields} fields`, detail: "Completion drops with every field beyond three or four, especially on mobile.", fix: "Ask only for what you need to follow up (usually email, maybe name). Collect the rest after the first conversation." }
          : { id: "form", status: "fail", group: "Lead capture", title: `Long form (${primaryForm.fields} fields)`, detail: "Forms this long are the single most common conversion killer on lead-gen pages.", fix: "Cut to 3–4 fields or split into two steps with the easy fields first." },
  );

  if (primaryForm) {
    add(
      formEarly
        ? { id: "form-position", status: "pass", group: "Lead capture", title: "Form is in the top half of the page", detail: "Visitors can convert without hunting for the form." }
        : { id: "form-position", status: "warn", group: "Lead capture", title: "Form is low on the page", detail: `The form starts about ${Math.round(rel(primaryForm.index) * 100)}% of the way through the markup.`, fix: "Move the form (or a button that jumps to it) into the hero, and repeat it at the bottom." },
    );
    if (primaryForm.hasPhone) {
      add({ id: "form-phone", status: "warn", group: "Lead capture", title: "Phone number requested", detail: "Asking for a phone number reduces form completion noticeably unless the visitor expects a call.", fix: "Make the phone field optional or drop it from the first step." });
    }
    add(
      primaryForm.hasPrivacyMention
        ? { id: "form-privacy", status: "pass", group: "Lead capture", title: "Privacy reassurance on the form", detail: "The form mentions privacy, consent or no-spam — a small trust lift at the moment of hesitation." }
        : { id: "form-privacy", status: "warn", group: "Lead capture", title: "No privacy note on the form", detail: "Nothing near the fields says what happens with the data.", fix: "Add “We never share your email” or a privacy-policy link under the submit button." },
    );
  }

  /* ── Trust ───────────────────────────────────────────── */
  add(
    testimonialMarkup || /testimonial|what (our )?(customers|clients) say/i.test(text)
      ? { id: "testimonials", status: "pass", group: "Trust", title: "Testimonials or reviews present", detail: "Quoted customers are the strongest proof most pages can show." }
      : { id: "testimonials", status: "fail", group: "Trust", title: "No testimonials or reviews", detail: "No blockquotes, review sections or testimonial markup detected. Visitors look for someone like them who already said yes.", fix: "Add 2–3 short quotes with a full name, role and company or photo. Specific results beat adjectives." },
  );

  add(
    logoStrip
      ? { id: "logos", status: "pass", group: "Trust", title: "Customer or press logos", detail: "A “trusted by / as seen in” strip is present." }
      : proof
        ? { id: "logos", status: "pass", group: "Trust", title: "Social proof numbers", detail: `“${proof[0]}” quantifies adoption.` }
        : { id: "logos", status: "warn", group: "Trust", title: "No logos or adoption numbers", detail: `${plural(trustHits.length, "trust-related phrase")} found, but no logo strip or customer count.`, fix: "Add a row of recognisable customer logos or a single number (“Used by 2,400 teams”) near the headline." },
  );

  add(
    /guarantee|money[- ]back|secure|ssl|encrypted|gdpr|soc ?2|iso ?27001|hipaa|certified/i.test(text)
      ? { id: "assurance", status: "pass", group: "Trust", title: "Guarantee or security assurance", detail: "The page names a guarantee, certification or security standard." }
      : { id: "assurance", status: "info", group: "Trust", title: "No guarantee or certification mentioned", detail: "Optional, but a guarantee or a security badge answers the “what if it goes wrong?” objection.", fix: "State the refund or cancellation policy, or the standards you meet, in one line near the CTA or footer." },
  );

  add(
    anyPhone
      ? { id: "contact", status: "pass", group: "Trust", title: phone ? "Clickable phone number" : "Phone number on the page", detail: phone ? "A tel: link lets mobile visitors call in one tap." : "A phone number is shown; making it a tel: link lets mobile visitors tap to call." }
      : { id: "contact", status: "info", group: "Trust", title: "No phone number", detail: "For high-consideration or local services a phone number lifts trust even when nobody calls.", fix: "Add a tel: link in the header for service businesses; skip for self-serve software." },
  );

  /* ── Focus ───────────────────────────────────────────── */
  add(
    navLinks === 0
      ? { id: "nav", status: "pass", group: "Focus", title: "No site navigation", detail: "The page keeps visitors on the single path — ideal for paid traffic." }
      : navLinks <= 6
        ? { id: "nav", status: "pass", group: "Focus", title: `Light navigation (${plural(navLinks, "link")})`, detail: "A few links are fine; the CTA still dominates." }
        : { id: "nav", status: "warn", group: "Focus", title: `${navLinks} navigation links`, detail: "Full site navigation gives paid visitors many ways to leave before converting.", fix: "For campaign pages, strip the nav to a logo and the CTA. Keep the full menu on organic pages." },
  );

  add(
    externalLinks === 0
      ? { id: "leaks", status: "pass", group: "Focus", title: "No outbound links in the content", detail: "Nothing sends visitors off-site before they convert." }
      : externalLinks <= 3
        ? { id: "leaks", status: "info", group: "Focus", title: `${plural(externalLinks, "outbound link")}`, detail: "A few external links (social, partners) are normal." }
        : { id: "leaks", status: "warn", group: "Focus", title: `${externalLinks} outbound links`, detail: "Each external link is an exit. On a landing page they compete with the CTA.", fix: "Remove or move external links to the footer; open unavoidable ones in a new tab." },
  );

  add(
    words < 120
      ? { id: "copy-length", status: "warn", group: "Focus", title: "Very little copy", detail: `${words} words of visible text. Unless the offer is trivial, visitors need more reasons before they act. (JavaScript-rendered copy isn't counted.)`, fix: "Add a benefits section, how it works, and objections handled. Aim for 300–800 words for a considered purchase." }
      : words > 2_500
        ? { id: "copy-length", status: "info", group: "Focus", title: "Long page", detail: `${words.toLocaleString()} words. Long pages work for expensive or complex offers if the CTA repeats every screen or two.` }
        : { id: "copy-length", status: "pass", group: "Focus", title: "Reasonable copy length", detail: `${words.toLocaleString()} words of visible text.` },
  );

  add(
    video
      ? { id: "media", status: "pass", group: "Focus", title: "Video present", detail: "A product video or explainer is embedded. Make sure it's lazy-loaded so it doesn't slow the first paint." }
      : heroImage
        ? { id: "media", status: "pass", group: "Focus", title: "Hero image present", detail: "There's an image near the top of the page to show the product or outcome." }
        : { id: "media", status: "info", group: "Focus", title: "No hero image or video detected", detail: "Showing the product (screenshot, photo, 30-second video) usually beats describing it.", fix: "Add a screenshot or short video next to the headline." },
  );

  /* ── Technical ───────────────────────────────────────── */
  const load = input.loadTimeMs ?? null;
  if (load !== null) {
    add(
      load <= 1_200
        ? { id: "speed", status: "pass", group: "Technical", title: "Fast HTML response", detail: `HTML arrived in ${load} ms.` }
        : load <= 2_500
          ? { id: "speed", status: "warn", group: "Technical", title: "HTML is slow to arrive", detail: `${load} ms to receive the page (time to first byte ${input.ttfbMs ?? "?"} ms). Every extra second costs roughly 7% of conversions.`, fix: "Cache the page at the CDN edge and cut server work. Run the Page Speed Audit tool for specifics." }
          : { id: "speed", status: "fail", group: "Technical", title: "Slow server response", detail: `${load} ms to receive the HTML. Paid visitors on phones will leave before the page renders.`, fix: "Serve the landing page statically from a CDN. Move personalisation client-side." },
    );
  }
  if (typeof input.bytes === "number") {
    const kb = Math.round(input.bytes / 1024);
    add(
      kb <= 150
        ? { id: "weight", status: "pass", group: "Technical", title: "Lean HTML", detail: `${kb} KB of HTML.` }
        : { id: "weight", status: kb > 500 ? "warn" : "info", group: "Technical", title: `Heavy HTML (${kb} KB)`, detail: "Large documents usually mean inlined scripts, styles or hidden content that delays rendering on mobile.", fix: "Move inline scripts and styles to cached files; remove hidden sections." },
    );
  }
  add(
    viewport
      ? { id: "mobile", status: "pass", group: "Technical", title: "Mobile viewport set", detail: "The page declares a responsive viewport. Most paid traffic is on phones." }
      : { id: "mobile", status: "fail", group: "Technical", title: "No mobile viewport", detail: "Without a viewport meta tag phones render the desktop layout zoomed out.", fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to <head>.' },
  );
  add(
    url.protocol === "https:"
      ? { id: "https", status: "pass", group: "Technical", title: "Served over HTTPS", detail: "Browsers won't warn visitors before they fill the form." }
      : { id: "https", status: "fail", group: "Technical", title: "Not HTTPS", detail: "Browsers label http pages with forms as “Not secure”.", fix: "Install a certificate and redirect http to https." },
  );
  add(
    title && description.length >= 50
      ? { id: "meta", status: "pass", group: "Technical", title: "Title and description set", detail: `“${title}”` }
      : { id: "meta", status: "warn", group: "Technical", title: title ? "Meta description missing or thin" : "Missing <title>", detail: title ? `Description is ${description.length} characters. It becomes the snippet in search and in some share previews.` : "The browser tab and search result have nothing to show.", fix: "Write a title under 60 characters and a 120–155 character description that repeats the offer." },
  );
  add(
    privacyLink
      ? { id: "privacy", status: "pass", group: "Technical", title: "Privacy policy linked", detail: "Required by ad platforms for lead-gen pages and by most privacy laws." }
      : { id: "privacy", status: "warn", group: "Technical", title: "No privacy policy link", detail: "Google Ads and Meta both require a linked privacy policy on pages that collect data.", fix: "Link the privacy policy in the footer and near the form." },
  );
  add(
    lang
      ? { id: "lang", status: "pass", group: "Technical", title: "Language declared", detail: `<html lang="${lang}">` }
      : { id: "lang", status: "info", group: "Technical", title: "No lang attribute", detail: "Screen readers and translation tools guess the language.", fix: 'Add lang="en" (or the page\'s language) to <html>.' },
  );

  const base = finalizeChecklist(
    {
      kind: "landing-page",
      requestedUrl: input.requestedUrl,
      finalUrl,
      status: input.status,
      title,
      facts: {
        headline,
        ctaCount: distinctCtas.length,
        primaryCta: distinctCtas[0]?.text ?? null,
        formFields: primaryForm?.fields ?? null,
        words,
        navLinks,
        externalLinks,
        hasTestimonials: testimonialMarkup,
        hasVideo: video,
        loadTimeMs: load,
      },
    },
    checks,
  );
  return { ...base, ctas: distinctCtas.slice(0, 12).map(({ text: t, kind, weak }) => ({ text: t, kind, weak })), headline, subheadline };
}

export async function gradeLandingPage(rawUrl: string): Promise<LandingPageReport> {
  const raw = await fetchHtml(rawUrl);
  return gradeLandingPageHtml(raw);
}
