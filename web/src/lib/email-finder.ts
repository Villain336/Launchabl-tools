import { promises as dns } from "node:dns";

// Production notes: real SMTP-level verification (connecting to the mail
// server and issuing RCPT TO to see if it accepts the address) is
// unreliable from most cloud hosts — outbound port 25 is commonly blocked,
// and many mail servers rate-limit or silently accept-then-bounce to defeat
// exactly this kind of probing. A production version should use a
// dedicated email-verification API rather than raw SMTP. This tool ranks
// pattern guesses and confirms only that the domain can receive mail at
// all (MX lookup) — it does not claim to verify a specific mailbox exists.

export type EmailCandidate = { email: string; pattern: string };

export type EmailFinderResult = {
  domain: string;
  hasMx: boolean;
  mxRecords: string[];
  candidates: EmailCandidate[];
};

function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().toLowerCase().replace(/[^a-z\s-]/g, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts[parts.length - 1] };
}

export function generateCandidates(fullName: string, domain: string): EmailCandidate[] {
  const { first, last } = splitName(fullName);
  if (!first) return [];

  const f = first[0];
  const l = last ? last[0] : "";

  const patterns: { pattern: string; email: string }[] = last
    ? [
        { pattern: "first.last", email: `${first}.${last}@${domain}` },
        { pattern: "firstlast", email: `${first}${last}@${domain}` },
        { pattern: "first", email: `${first}@${domain}` },
        { pattern: "f.last", email: `${f}.${last}@${domain}` },
        { pattern: "flast", email: `${f}${last}@${domain}` },
        { pattern: "first_last", email: `${first}_${last}@${domain}` },
        { pattern: "last.first", email: `${last}.${first}@${domain}` },
        { pattern: "lastfirst", email: `${last}${first}@${domain}` },
        { pattern: "last", email: `${last}@${domain}` },
        { pattern: "first-last", email: `${first}-${last}@${domain}` },
        { pattern: "firstl", email: `${first}${l}@${domain}` },
      ]
    : [{ pattern: "first", email: `${first}@${domain}` }];

  const seen = new Set<string>();
  return patterns.filter((p) => {
    if (seen.has(p.email)) return false;
    seen.add(p.email);
    return true;
  });
}

export async function findEmailCandidates(fullName: string, domainRaw: string): Promise<EmailFinderResult> {
  const domain = domainRaw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  const candidates = generateCandidates(fullName, domain);

  let mxRecords: string[] = [];
  let hasMx = false;
  try {
    const mx = await dns.resolveMx(domain);
    // RFC 7505 "null MX" (a lone record with an empty exchange) explicitly
    // declares the domain does not accept mail — don't count it as valid.
    mxRecords = mx
      .filter((r) => r.exchange && r.exchange !== ".")
      .sort((a, b) => a.priority - b.priority)
      .map((r) => r.exchange);
    hasMx = mxRecords.length > 0;
  } catch {
    hasMx = false;
  }

  return { domain, hasMx, mxRecords, candidates };
}
