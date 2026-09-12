import { attr, decodeEntities, tags } from "@/lib/web/fetch-page";

/**
 * Small, tolerant HTML extraction helpers shared by the page analyzers.
 * Regex-based on purpose: the fetcher returns server-rendered markup and
 * these run inside a request, so a full DOM parser isn't worth its weight.
 */

export type Heading = { level: number; text: string; index: number };

export const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

export function headings(html: string, max = 200): Heading[] {
  return Array.from(html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi))
    .map((m) => ({ level: Number(m[1]), text: stripTags(m[2]), index: m.index ?? 0 }))
    .filter((h) => h.text.length > 0)
    .slice(0, max);
}

export function paragraphs(html: string, minWords = 5, max = 400): { text: string; index: number }[] {
  return Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => ({ text: stripTags(m[1]), index: m.index ?? 0 }))
    .filter((p) => p.text.split(/\s+/).length >= minWords)
    .slice(0, max);
}

/** Body markup with scripts, styles, nav/header/footer removed. */
export function mainMarkup(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|footer|header)\b[\s\S]*?<\/\1>/gi, " ");
}

export function bodyText(html: string): string {
  return stripTags(mainMarkup(html));
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

export function jsonLdBlocks(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim()) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          if (Array.isArray(obj["@graph"])) out.push(...(obj["@graph"] as Record<string, unknown>[]));
          else out.push(obj);
        }
      }
    } catch {
      // invalid JSON-LD is reported by callers via jsonLdTypes fallback
    }
  }
  return out;
}

export function jsonLdTypes(html: string): string[] {
  return Array.from(html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi))
    .flatMap((m) => Array.from(m[1].matchAll(/"@type"\s*:\s*"([^"]+)"/g)).map((t) => t[1]))
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

export function metaContent(html: string, key: "name" | "property", value: string): string | null {
  const tag = tags(html.slice(0, 200_000), "meta").find((t) => (attr(t, key) ?? "").toLowerCase() === value.toLowerCase());
  return tag ? attr(tag, "content") : null;
}

export function pageTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].replace(/\s+/g, " ")) : null;
}

export function htmlLang(html: string): string | null {
  return attr(html.match(/<html\b[^>]*>/i)?.[0] ?? "", "lang");
}

const CTA_VERBS =
  /\b(get|start|try|book|schedule|request|download|buy|order|shop|join|sign\s?up|signup|subscribe|claim|talk|contact|call|reserve|apply|register|demo|learn more|see (pricing|plans|how)|watch|add to cart|checkout|upgrade|create|build|launch|explore|discover|grab|unlock|begin|continue)\b/i;
const WEAK_CTA = /^(submit|click here|send|go|ok|enter|more|read more|next|here)$/i;

export type Cta = { text: string; kind: "button" | "link" | "input"; index: number; weak: boolean; actionable: boolean };

/** Buttons, submit inputs and button-styled links — the things a visitor is asked to click. */
export function callsToAction(html: string): Cta[] {
  const out: Cta[] = [];
  for (const m of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/gi)) {
    const text = stripTags(m[1]);
    if (text) out.push(build(text, "button", m.index ?? 0));
  }
  for (const tag of html.matchAll(/<input\b[^>]*>/gi)) {
    const type = (attr(tag[0], "type") ?? "").toLowerCase();
    if (type === "submit" || type === "button") {
      const text = attr(tag[0], "value") ?? "Submit";
      out.push(build(text, "input", tag.index ?? 0));
    }
  }
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const cls = (attr(`<a ${m[1]}>`, "class") ?? "").toLowerCase();
    const role = (attr(`<a ${m[1]}>`, "role") ?? "").toLowerCase();
    const text = stripTags(m[2]);
    if (!text || text.split(/\s+/).length > 6) continue;
    if (/\b(btn|button|cta)\b/.test(cls) || role === "button" || CTA_VERBS.test(text)) out.push(build(text, "link", m.index ?? 0));
  }
  return out.sort((a, b) => a.index - b.index).slice(0, 80);

  function build(text: string, kind: Cta["kind"], index: number): Cta {
    const t = text.replace(/\s+/g, " ").trim().slice(0, 80);
    return { text: t, kind, index, weak: WEAK_CTA.test(t), actionable: CTA_VERBS.test(t) };
  }
}

export type FormInfo = { index: number; fields: number; required: number; hasEmail: boolean; hasPhone: boolean; hasPassword: boolean; hasPrivacyMention: boolean };

export function forms(html: string): FormInfo[] {
  return Array.from(html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)).map((m) => {
    const body = m[1];
    const inputs = tags(body, "input").filter((t) => !/type\s*=\s*["']?(hidden|submit|button|reset|image)/i.test(t));
    const selects = (body.match(/<select\b/gi) ?? []).length;
    const areas = (body.match(/<textarea\b/gi) ?? []).length;
    return {
      index: m.index ?? 0,
      fields: inputs.length + selects + areas,
      required: (body.match(/\brequired\b/gi) ?? []).length,
      hasEmail: inputs.some((t) => /type\s*=\s*["']?email|name\s*=\s*["']?[^"'\s>]*e-?mail/i.test(t)),
      hasPhone: inputs.some((t) => /type\s*=\s*["']?tel|name\s*=\s*["']?[^"'\s>]*(phone|tel)/i.test(t)),
      hasPassword: inputs.some((t) => /type\s*=\s*["']?password/i.test(t)),
      hasPrivacyMention: /privacy|consent|unsubscribe|spam/i.test(stripTags(body)),
    };
  });
}

export function thirdPartyHosts(html: string, finalUrl: string): string[] {
  const host = new URL(finalUrl).hostname.replace(/^www\./, "");
  const hosts = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["']((?:https?:)?\/\/[^"'\s>]+)["']/gi)) {
    try {
      const h = new URL(m[1].startsWith("//") ? `https:${m[1]}` : m[1]).hostname.replace(/^www\./, "");
      if (h && h !== host && !h.endsWith(`.${host}`)) hosts.add(h);
    } catch {
      // ignore
    }
  }
  return Array.from(hosts).sort();
}

const STOP = new Set(
  "a an and are as at be but by for from has have he her his i if in into is it its more no not of on or our so than that the their them then there these they this to was we were what when which who will with you your all can get one about also just like our us out up more new most other some such very".split(" "),
);

/** Most frequent meaningful words — a rough topical fingerprint for side-by-side comparison. */
export function topKeywords(text: string, n = 8): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const word = raw.replace(/^'+|'+$/g, "");
    if (word.length < 3 || STOP.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return Array.from(counts, ([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

export const TRUST_PATTERN =
  /\b(testimonial|review|rating|stars?|trusted by|as seen (in|on)|featured in|customers?|clients?|case stud|guarantee|money[- ]back|secure|ssl|encrypted|gdpr|soc ?2|iso ?27001|hipaa|certified|award|since \d{4}|years? of experience|\d[\d,.]*\s?(k|m|\+)?\s+(users|customers|companies|teams|businesses|downloads|reviews))\b/i;

export const SOCIAL_PROOF_NUMBER = /\b\d[\d,.]*\s?(k|m|\+|%)?\s*(users|customers|companies|teams|businesses|downloads|reviews|clients|members|installs|countries|projects)\b/i;

export const URGENCY_PATTERN = /\b(limited|only \d|ends? (soon|today|tonight|friday|monday)|last chance|today only|hurry|while (supplies|stock)|spots? left|\d+% off|free trial|no credit card|cancel anytime)\b/i;

export function securityHeaderChecks(headers: Headers): { name: string; present: boolean; value: string | null }[] {
  const names = ["strict-transport-security", "content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"];
  return names.map((name) => {
    const value = headers.get(name);
    return { name, present: value !== null, value };
  });
}
