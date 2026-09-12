import { promises as dnsPromises } from "node:dns";
import { detectProvider, normalizeDomain } from "@/lib/web/dns-email";
import { fetchHtml } from "@/lib/web/fetch-page";

/**
 * Work-email discovery without a paid data provider: generate the common
 * corporate patterns for a name, then read the company's public pages to
 * find real addresses and infer which pattern the company actually uses.
 * Confirms the domain accepts mail (MX) — never claims a mailbox exists.
 */

export type EmailCandidate = {
  email: string;
  pattern: string;
  /** 0–1: prevalence of the pattern, boosted when it matches addresses seen on the site. */
  confidence: number;
  /** Why this candidate ranks where it does. */
  reason: string;
};

export type EmailFinderResult = {
  domain: string;
  person: { first: string; last: string; full: string };
  mail: { accepts: boolean; provider: string | null; mx: string[] };
  /** Pattern inferred from addresses found on the company's pages, if any. */
  detectedPattern: string | null;
  /** Personal-looking addresses found on the site (redacted to pattern examples). */
  observed: { email: string; pattern: string | null; source: string }[];
  /** Role addresses found on the site: info@, hello@, press@… */
  roleAddresses: { email: string; source: string }[];
  pagesRead: string[];
  candidates: EmailCandidate[];
};

const PATTERN_WEIGHTS: Record<string, number> = {
  "first.last": 0.42,
  first: 0.16,
  flast: 0.14,
  firstlast: 0.09,
  "f.last": 0.05,
  first_last: 0.04,
  "first-last": 0.02,
  firstl: 0.03,
  "last.first": 0.02,
  lastfirst: 0.01,
  last: 0.01,
  "last.f": 0.01,
};

const ROLE_LOCAL = /^(info|hello|hi|contact|support|help|sales|press|media|team|admin|office|careers|jobs|hr|billing|legal|privacy|security|abuse|noreply|no-reply|newsletter|marketing|partners|partnerships|enquiries|inquiries|mail|webmaster|postmaster|dmarc)$/i;

export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .split(/\s+/)
    .filter((p) => p && !/^(mr|mrs|ms|dr|prof|jr|sr|ii|iii)$/.test(p));
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0].replace(/['-]/g, ""), last: "" };
  return { first: parts[0].replace(/['-]/g, ""), last: parts[parts.length - 1].replace(/['-]/g, "") };
}

export function buildPatterns(first: string, last: string): Record<string, string> {
  const f = first[0] ?? "";
  const l = last[0] ?? "";
  if (!last) return { first };
  return {
    "first.last": `${first}.${last}`,
    first,
    flast: `${f}${last}`,
    firstlast: `${first}${last}`,
    "f.last": `${f}.${last}`,
    first_last: `${first}_${last}`,
    "first-last": `${first}-${last}`,
    firstl: `${first}${l}`,
    "last.first": `${last}.${first}`,
    lastfirst: `${last}${first}`,
    last,
    "last.f": `${last}.${f}`,
  };
}

/** Classify an observed local part against the known patterns, e.g. "jane.doe" → "first.last". */
export function classifyLocalPart(local: string): string | null {
  const l = local.toLowerCase();
  if (ROLE_LOCAL.test(l)) return null;
  if (/^[a-z]+\.[a-z]{2,}$/.test(l)) return l.split(".")[0].length === 1 ? "f.last" : l.split(".")[1].length === 1 ? "last.f" : "first.last";
  if (/^[a-z]+_[a-z]+$/.test(l)) return "first_last";
  if (/^[a-z]+-[a-z]+$/.test(l)) return "first-last";
  if (/^[a-z]{2,}$/.test(l)) return l.length <= 4 ? "first" : "firstlast-or-flast";
  return null;
}

const EMAIL_RE = /\b([a-z0-9._%+-]+)@([a-z0-9.-]+\.[a-z]{2,})\b/gi;

export async function harvestEmails(domain: string): Promise<{ found: { email: string; source: string }[]; pagesRead: string[] }> {
  const paths = ["/", "/contact", "/about", "/team", "/about-us", "/contact-us"];
  const found = new Map<string, string>();
  const pagesRead: string[] = [];
  const apex = domain.replace(/^www\./, "");
  await Promise.all(
    paths.map(async (path) => {
      try {
        const page = await fetchHtml(`https://${apex}${path}`, { timeoutMs: 6_000, maxBytes: 600_000 });
        if (page.status >= 400 || /\/(login|signin|sign-in|auth)\b/i.test(new URL(page.finalUrl).pathname)) return;
        pagesRead.push(page.finalUrl);
        const text = page.html.replace(/&#64;|&commat;|\s*\[at\]\s*|\s*\(at\)\s*/gi, "@").replace(/\s*\[dot\]\s*|\s*\(dot\)\s*/gi, ".");
        for (const m of text.matchAll(EMAIL_RE)) {
          const email = `${m[1]}@${m[2]}`.toLowerCase();
          if (!m[2].toLowerCase().endsWith(apex)) continue;
          if (/\.(png|jpg|jpeg|gif|svg|webp|css|js)$/i.test(email) || /^[0-9a-f]{16,}@/.test(email)) continue;
          if (!found.has(email)) found.set(email, page.finalUrl);
        }
      } catch {
        // page missing or blocked — fine
      }
    }),
  );
  return { found: Array.from(found, ([email, source]) => ({ email, source })).slice(0, 40), pagesRead };
}

export async function findEmailCandidates(fullName: string, rawDomain: string): Promise<EmailFinderResult> {
  const domain = normalizeDomain(rawDomain).replace(/^www\./, "");
  const { first, last } = splitName(fullName);
  const resolver = new dnsPromises.Resolver({ timeout: 4_000, tries: 2 });

  const [mxRaw, harvest] = await Promise.all([
    resolver.resolveMx(domain).catch(() => [] as { exchange: string; priority: number }[]),
    harvestEmails(domain),
  ]);
  const mx = mxRaw
    .filter((r) => r.exchange && r.exchange !== ".")
    .sort((a, b) => a.priority - b.priority)
    .map((r) => r.exchange);

  const observed: EmailFinderResult["observed"] = [];
  const roleAddresses: EmailFinderResult["roleAddresses"] = [];
  const patternVotes = new Map<string, number>();
  for (const { email, source } of harvest.found) {
    const local = email.split("@")[0];
    if (ROLE_LOCAL.test(local)) {
      roleAddresses.push({ email, source });
      continue;
    }
    const pattern = classifyLocalPart(local);
    observed.push({ email, pattern, source });
    if (pattern && pattern !== "firstlast-or-flast") patternVotes.set(pattern, (patternVotes.get(pattern) ?? 0) + 1);
    if (pattern === "firstlast-or-flast") {
      patternVotes.set("firstlast", (patternVotes.get("firstlast") ?? 0) + 0.5);
      patternVotes.set("flast", (patternVotes.get("flast") ?? 0) + 0.5);
    }
  }
  const detectedPattern = Array.from(patternVotes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const patterns = first ? buildPatterns(first, last) : {};
  const total = Object.keys(patterns).reduce((sum, p) => sum + (PATTERN_WEIGHTS[p] ?? 0.01), 0) || 1;
  let candidates: EmailCandidate[] = Object.entries(patterns).map(([pattern, local]) => {
    let confidence = (PATTERN_WEIGHTS[pattern] ?? 0.01) / total;
    let reason = `${Math.round(((PATTERN_WEIGHTS[pattern] ?? 0.01) / total) * 100)}% of companies use ${pattern}`;
    if (detectedPattern === pattern) {
      confidence = Math.min(0.95, 0.6 + confidence);
      reason = `Matches ${patternVotes.get(pattern)} address${(patternVotes.get(pattern) ?? 0) > 1 ? "es" : ""} found on ${domain}`;
    } else if (detectedPattern) {
      confidence *= 0.35;
    }
    return { email: `${local}@${domain}`, pattern, confidence, reason };
  });
  const seen = new Set<string>();
  candidates = candidates.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });
  const sum = candidates.reduce((s, c) => s + c.confidence, 0) || 1;
  candidates = candidates.map((c) => ({ ...c, confidence: Math.round((c.confidence / sum) * 100) / 100 })).sort((a, b) => b.confidence - a.confidence);
  if (!mx.length) candidates = candidates.map((c) => ({ ...c, confidence: Math.round(c.confidence * 0.2 * 100) / 100, reason: `${c.reason} — but the domain has no mail server` }));

  return {
    domain,
    person: { first, last, full: fullName.trim() },
    mail: { accepts: mx.length > 0, provider: detectProvider(mx), mx },
    detectedPattern,
    observed: observed.slice(0, 12),
    roleAddresses: roleAddresses.slice(0, 12),
    pagesRead: harvest.pagesRead,
    candidates,
  };
}
