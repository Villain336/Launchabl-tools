import { promises as dnsPromises } from "node:dns";
import { finalizeChecklist, type Check, type ChecklistReport } from "@/lib/web/checklist";
import { FetchPageError } from "@/lib/web/fetch-page";

/**
 * Email deliverability from DNS alone: MX, SPF (syntax, qualifier, lookup
 * budget), DMARC (policy, reporting, alignment), DKIM (known selectors or
 * the one the user names), MTA-STS / TLS-RPT and BIMI. Everything here is a
 * public record, so results match what Gmail and Microsoft see.
 */

export type DnsEmailReport = ChecklistReport & {
  kind: "dns-email";
  domain: string;
  records: {
    mx: { exchange: string; priority: number }[];
    spf: string | null;
    dmarc: string | null;
    dkim: { selector: string; record: string }[];
    mtaSts: string | null;
    tlsRpt: string | null;
    bimi: string | null;
  };
};

const DKIM_SELECTORS = [
  "default", "google", "selector1", "selector2", "k1", "k2", "k3", "s1", "s2", "mail", "dkim", "smtp", "mx",
  "mandrill", "fm1", "fm2", "fm3", "protonmail", "protonmail2", "zendesk1", "zendesk2", "ctct1", "ctct2", "kl", "kl2",
  "sig1", "krs", "mailjet", "pic", "everlytickey1", "everlytickey2", "hubspot", "sendgrid", "mailgun", "pm", "s1024", "dk",
];

const PROVIDERS: [RegExp, string][] = [
  [/google|googlemail|gmail/i, "Google Workspace"],
  [/outlook|office365|microsoft|hotmail/i, "Microsoft 365"],
  [/zoho/i, "Zoho Mail"],
  [/protonmail|proton\.ch/i, "Proton Mail"],
  [/fastmail|messagingengine/i, "Fastmail"],
  [/mimecast/i, "Mimecast"],
  [/pphosted|proofpoint/i, "Proofpoint"],
  [/barracuda/i, "Barracuda"],
  [/icloud|apple/i, "iCloud Mail"],
  [/yandex/i, "Yandex"],
  [/mailgun/i, "Mailgun"],
  [/amazonaws|awsapps/i, "Amazon WorkMail / SES"],
  [/secureserver|godaddy/i, "GoDaddy"],
  [/ionos|1and1|kundenserver/i, "IONOS"],
  [/ovh/i, "OVH"],
  [/hostinger|titan/i, "Hostinger / Titan"],
  [/cloudflare/i, "Cloudflare Email Routing"],
  [/migadu/i, "Migadu"],
  [/mxroute/i, "MXroute"],
  [/rackspace|emailsrvr/i, "Rackspace"],
];

export function normalizeDomain(raw: string): string {
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^[^@]*@/, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
  if (!text || text.length > 253 || !/^([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)+[a-z]{2,63}$/.test(text)) {
    throw new FetchPageError("Enter a domain like example.com.", "invalid_url");
  }
  if (/^(localhost|.*\.(local|internal|test|example|invalid))$/.test(text)) {
    throw new FetchPageError("That domain can't be looked up from here.", "blocked");
  }
  return text;
}

type Resolver = { resolveTxt(name: string): Promise<string[][]>; resolveMx(name: string): Promise<{ exchange: string; priority: number }[]>; resolve4(name: string): Promise<string[]>; resolve6(name: string): Promise<string[]> };

function makeResolver(): Resolver {
  return new dnsPromises.Resolver({ timeout: 4_000, tries: 2 });
}

async function txt(resolver: Resolver, name: string): Promise<string[]> {
  try {
    return (await resolver.resolveTxt(name)).map((parts) => parts.join(""));
  } catch {
    return [];
  }
}

export function detectProvider(exchanges: string[]): string | null {
  for (const exchange of exchanges) for (const [pattern, name] of PROVIDERS) if (pattern.test(exchange)) return name;
  return null;
}

export function parseTags(record: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of record.split(";")) {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) out[key.trim().toLowerCase()] = rest.join("=").trim();
  }
  return out;
}

/** Terms that cost a DNS lookup under RFC 7208 §4.6.4 (limit 10, counted across includes). */
const LOOKUP_TERM = /^[+\-~?]?(include|a|mx|ptr|exists|redirect)(?=[:=/]|$)/i;

export type SpfAnalysis = { lookups: number; qualifier: string | null; includes: string[]; hasPtr: boolean; overBudget: boolean; unresolved: string[]; allowsAll: boolean };

export async function analyzeSpf(record: string, resolver: Resolver, depth = 0, seen = new Set<string>()): Promise<SpfAnalysis> {
  const terms = record.split(/\s+/).slice(1);
  const includes: string[] = [];
  const unresolved: string[] = [];
  let lookups = 0;
  let qualifier: string | null = null;
  let hasPtr = false;
  let allowsAll = false;
  for (const term of terms) {
    if (/^[+\-~?]?all$/i.test(term)) {
      qualifier = term.startsWith("all") ? "+" : term[0];
      allowsAll = qualifier === "+";
      continue;
    }
    if (!LOOKUP_TERM.test(term)) continue;
    lookups += 1;
    if (/^[+\-~?]?ptr/i.test(term)) hasPtr = true;
    const target = term.match(/^[+\-~?]?(?:include:|redirect=)(.+)$/i)?.[1];
    if (!target) continue;
    includes.push(target);
    if (depth >= 4 || seen.has(target) || lookups > 20) continue;
    seen.add(target);
    const nested = (await txt(resolver, target)).find((t) => /^v=spf1(\s|$)/i.test(t));
    if (!nested) {
      unresolved.push(target);
      continue;
    }
    const inner = await analyzeSpf(nested, resolver, depth + 1, seen);
    lookups += inner.lookups;
    includes.push(...inner.includes);
    unresolved.push(...inner.unresolved);
    if (inner.hasPtr) hasPtr = true;
  }
  return { lookups, qualifier, includes, hasPtr, overBudget: lookups > 10, unresolved, allowsAll };
}

export async function checkDnsEmail(rawDomain: string, options: { dkimSelector?: string | null } = {}): Promise<DnsEmailReport> {
  const domain = normalizeDomain(rawDomain);
  const resolver = makeResolver();
  const checks: Check[] = [];

  const [mxRaw, rootTxt, dmarcTxt, a4, a6, mtaStsTxt, tlsRptTxt, bimiTxt] = await Promise.all([
    resolver.resolveMx(domain).catch(() => [] as { exchange: string; priority: number }[]),
    txt(resolver, domain),
    txt(resolver, `_dmarc.${domain}`),
    resolver.resolve4(domain).catch(() => [] as string[]),
    resolver.resolve6(domain).catch(() => [] as string[]),
    txt(resolver, `_mta-sts.${domain}`),
    txt(resolver, `_smtp._tls.${domain}`),
    txt(resolver, `default._bimi.${domain}`),
  ]);

  const mx = mxRaw.filter((r) => r.exchange && r.exchange !== ".").sort((a, b) => a.priority - b.priority);
  const nullMx = mxRaw.length > 0 && mx.length === 0;
  const resolves = a4.length + a6.length > 0;
  const provider = detectProvider(mx.map((r) => r.exchange));

  if (!resolves && mxRaw.length === 0 && rootTxt.length === 0) {
    throw new FetchPageError(`${domain} doesn't resolve — check the spelling, or the domain may not be registered.`, "network");
  }

  /* MX */
  if (nullMx) {
    checks.push({ id: "mx", status: "info", group: "Receiving", title: "Null MX: this domain declares it doesn't accept email", detail: "An MX record pointing at \".\" (RFC 7505) tells senders not to try. Correct for domains that only send or don't use email at all." });
  } else if (mx.length === 0) {
    checks.push({ id: "mx", status: "fail", group: "Receiving", title: "No MX records — this domain can't receive email", detail: resolves ? "The domain resolves, but there is no mail server declared for it. Replies and bounces to any address here are lost." : "Neither MX nor A records were found.", fix: "Add the MX records your mail provider gives you (Google Workspace, Microsoft 365, Zoho…). If the domain is send-only, publish a null MX instead: `MX 0 .`." });
  } else {
    checks.push({ id: "mx", status: "pass", group: "Receiving", title: `${mx.length} MX record${mx.length > 1 ? "s" : ""}${provider ? ` · ${provider}` : ""}`, detail: mx.map((r) => `${r.priority} ${r.exchange}`).join(", ") });
    if (mx.length === 1) checks.push({ id: "mx-redundancy", status: "info", group: "Receiving", title: "Single MX host", detail: "One mail exchanger, so inbound mail queues at the sender if it's down. Most hosted providers publish a backup; fine for small domains." });
  }

  /* SPF */
  const spfRecords = rootTxt.filter((t) => /^v=spf1(\s|$)/i.test(t));
  const spf = spfRecords[0] ?? null;
  let spfAnalysis: SpfAnalysis | null = null;
  if (spfRecords.length > 1) {
    checks.push({ id: "spf", status: "fail", group: "Sending", title: `${spfRecords.length} SPF records — receivers treat this as no SPF`, detail: "RFC 7208 allows exactly one v=spf1 record. Two or more produce a permanent error and the check fails for every message.", fix: `Merge them into one record, e.g. \`v=spf1 ${spfRecords.map((r) => r.replace(/^v=spf1\s*/i, "").replace(/\s*[+\-~?]?all\s*$/i, "")).join(" ")} -all\`.` });
  } else if (!spf) {
    checks.push({ id: "spf", status: "fail", group: "Sending", title: "No SPF record", detail: "Receiving servers can't tell which servers are allowed to send as this domain. Gmail and Yahoo require SPF or DKIM for every sender, and DMARC can't pass without one of them.", fix: provider ? `Add a TXT record at the root: \`v=spf1 include:${spfIncludeFor(provider)} -all\` — then add an include for every other service that sends as you (CRM, newsletter tool, helpdesk).` : "Add a TXT record at the root: `v=spf1 include:<your-mail-provider> -all`, with one include per service that sends email as this domain." });
  } else {
    spfAnalysis = await analyzeSpf(spf, resolver);
    const q = spfAnalysis.qualifier;
    const title = q === "-" ? "SPF with a hard fail (-all)" : q === "~" ? "SPF with a soft fail (~all)" : q === "?" ? "SPF ends in ?all — neutral, effectively no policy" : q === "+" ? "SPF ends in +all — anyone may send as you" : "SPF without an all mechanism";
    const status = q === "-" || q === "~" ? "pass" : q === "+" ? "fail" : "warn";
    checks.push({ id: "spf", status, group: "Sending", title, detail: `${spf}${spfAnalysis.includes.length ? ` · authorises ${spfAnalysis.includes.length} include${spfAnalysis.includes.length > 1 ? "s" : ""}` : ""}`, fix: status === "pass" ? undefined : q === "+" ? "Replace +all with -all (or ~all while you confirm every legitimate sender is listed)." : "End the record with -all (or ~all during rollout) so unauthorised senders fail." });
    if (spfAnalysis.overBudget) {
      checks.push({ id: "spf-lookups", status: "fail", group: "Sending", title: `SPF needs ${spfAnalysis.lookups} DNS lookups — limit is 10`, detail: "Over the limit, receivers return permerror and treat the record as invalid, so SPF silently fails for every message.", fix: "Flatten includes you don't need, remove `ptr` and unused `a`/`mx` terms, or use an SPF flattening service. Sub-includes count too." });
    } else if (spfAnalysis.lookups >= 8) {
      checks.push({ id: "spf-lookups", status: "warn", group: "Sending", title: `SPF uses ${spfAnalysis.lookups} of 10 DNS lookups`, detail: "Adding one more sending service could push it over the limit and break SPF entirely.", fix: "Remove includes for services you no longer use before adding new ones." });
    } else {
      checks.push({ id: "spf-lookups", status: "pass", group: "Sending", title: `SPF uses ${spfAnalysis.lookups} of 10 DNS lookups`, detail: "Within the RFC 7208 budget." });
    }
    if (spfAnalysis.hasPtr) checks.push({ id: "spf-ptr", status: "warn", group: "Sending", title: "SPF uses the deprecated ptr mechanism", detail: "ptr is slow, unreliable and discouraged by RFC 7208; some receivers ignore it.", fix: "Replace ptr with ip4:/ip6: ranges or an include from the provider." });
    if (spfAnalysis.unresolved.length) checks.push({ id: "spf-unresolved", status: "warn", group: "Sending", title: `${spfAnalysis.unresolved.length} SPF include${spfAnalysis.unresolved.length > 1 ? "s don't" : " doesn't"} resolve`, detail: spfAnalysis.unresolved.join(", "), fix: "Remove includes for services you've stopped using; a missing include returns permerror on some receivers." });
  }

  /* DMARC */
  const dmarcRecords = dmarcTxt.filter((t) => /^v=dmarc1(\s|;|$)/i.test(t));
  const dmarc = dmarcRecords[0] ?? null;
  const dmarcTags = dmarc ? parseTags(dmarc) : {};
  const policy = (dmarcTags.p ?? "").toLowerCase();
  if (dmarcRecords.length > 1) {
    checks.push({ id: "dmarc", status: "fail", group: "Policy", title: `${dmarcRecords.length} DMARC records — receivers ignore both`, detail: "Only one v=DMARC1 record may exist at _dmarc.", fix: "Delete the duplicate so one record remains." });
  } else if (!dmarc) {
    checks.push({ id: "dmarc", status: "fail", group: "Policy", title: "No DMARC record", detail: "Nothing tells receivers what to do with mail that fails SPF and DKIM, and nothing reports spoofing back to you. Gmail and Yahoo require DMARC for bulk senders; Microsoft is following.", fix: `Add a TXT record at _dmarc.${domain}: \`v=DMARC1; p=none; rua=mailto:dmarc@${domain}\` to start collecting reports, then move to p=quarantine and p=reject once every legitimate sender passes.` });
  } else if (!policy || !["none", "quarantine", "reject"].includes(policy)) {
    checks.push({ id: "dmarc", status: "fail", group: "Policy", title: "DMARC record is malformed", detail: `${dmarc} — the required p= tag is missing or invalid.`, fix: "Use p=none, p=quarantine or p=reject; tags are separated by semicolons." });
  } else {
    const status = policy === "none" ? "warn" : "pass";
    const pct = dmarcTags.pct ? Number(dmarcTags.pct) : 100;
    checks.push({ id: "dmarc", status, group: "Policy", title: policy === "none" ? "DMARC in monitoring mode (p=none)" : `DMARC enforcing: p=${policy}${pct < 100 ? ` for ${pct}% of mail` : ""}`, detail: dmarc, fix: policy === "none" ? "p=none only reports; spoofed mail is still delivered. Once your reports show all legitimate senders passing, move to p=quarantine, then p=reject." : undefined });
    if (pct < 100 && policy !== "none") checks.push({ id: "dmarc-pct", status: "warn", group: "Policy", title: `DMARC applies to only ${pct}% of messages`, detail: "pct< 100 is a rollout aid; the remainder is handled as the next-weaker policy.", fix: "Raise pct to 100 when you're confident in the results." });
    if (dmarcTags.rua) checks.push({ id: "dmarc-reporting", status: "pass", group: "Policy", title: "Aggregate reports (rua) are collected", detail: dmarcTags.rua });
    else checks.push({ id: "dmarc-reporting", status: "warn", group: "Policy", title: "No rua= address — you get no DMARC reports", detail: "Without aggregate reports you can't see who is sending as your domain or whether legitimate mail is failing.", fix: `Add \`rua=mailto:dmarc@${domain}\` (or a DMARC report service address) to the record.` });
    const sp = (dmarcTags.sp ?? policy).toLowerCase();
    if (policy !== "none" && sp === "none") checks.push({ id: "dmarc-subdomains", status: "warn", group: "Policy", title: "Subdomains are not enforced (sp=none)", detail: "Anyone can spoof mail from a subdomain like billing.yourdomain.com.", fix: "Remove sp=none or set sp=reject." });
    if ((dmarcTags.adkim ?? "r").toLowerCase() === "s" || (dmarcTags.aspf ?? "r").toLowerCase() === "s") checks.push({ id: "dmarc-alignment", status: "info", group: "Policy", title: "Strict alignment is enabled", detail: "Strict alignment (adkim=s / aspf=s) rejects mail from subdomains that otherwise pass. Intentional for some setups; a common cause of unexpected failures." });
  }

  /* DKIM */
  const requested = options.dkimSelector?.trim().toLowerCase().replace(/\._domainkey.*$/, "") || null;
  const selectors = requested ? [requested] : DKIM_SELECTORS;
  const dkim: { selector: string; record: string }[] = [];
  await Promise.all(
    selectors.map(async (selector) => {
      const records = await txt(resolver, `${selector}._domainkey.${domain}`);
      const record = records.find((r) => /v=dkim1|p=/i.test(r));
      if (record) dkim.push({ selector, record });
    }),
  );
  dkim.sort((a, b) => a.selector.localeCompare(b.selector));
  if (dkim.length) {
    // A 2048-bit RSA public key is ~392 base64 chars; 1024-bit is ~216.
    const keyLength = (d: { record: string }) => d.record.match(/p=([A-Za-z0-9+/=]+)/)?.[1].length ?? 0;
    const weak = dkim.filter((d) => keyLength(d) > 0 && keyLength(d) < 300);
    const revoked = dkim.filter((d) => /p=\s*(;|$)/.test(d.record));
    checks.push({ id: "dkim", status: "pass", group: "Sending", title: `DKIM found for ${dkim.length} selector${dkim.length > 1 ? "s" : ""}: ${dkim.map((d) => d.selector).join(", ")}`, detail: requested ? "The selector you named publishes a key." : "Found by probing selectors common providers use; your sending services may use others too." });
    if (weak.length) checks.push({ id: "dkim-key-length", status: "warn", group: "Sending", title: `Short DKIM key on ${weak.map((d) => d.selector).join(", ")}`, detail: "A 1024-bit key is the minimum receivers accept; 2048-bit is the current recommendation.", fix: "Rotate to a 2048-bit key in your provider's DKIM settings and update the DNS record." });
    if (revoked.length) checks.push({ id: "dkim-revoked", status: "info", group: "Sending", title: `Revoked DKIM key on ${revoked.map((d) => d.selector).join(", ")}`, detail: "An empty p= means the key was retired — normal after a rotation." });
  } else {
    checks.push({ id: "dkim", status: requested ? "fail" : "warn", group: "Sending", title: requested ? `No DKIM key at ${requested}._domainkey.${domain}` : "No DKIM key found under common selectors", detail: requested ? "The selector you named has no TXT record, so messages signed with it fail DKIM." : `Checked ${DKIM_SELECTORS.length} selector names. DKIM selectors are set by each sending service and aren't discoverable from DNS, so a custom selector may exist — tell me the selector name to check it exactly.`, fix: requested ? "Publish the TXT record your provider gave you at that selector, or sign with the selector that exists." : provider ? `Turn on DKIM in ${provider}'s admin console and add the TXT record it gives you; do the same in every tool that sends as this domain.` : "Enable DKIM signing in your mail provider and every sending tool, and publish the keys they give you." });
  }

  /* Transport & brand */
  const mtaSts = mtaStsTxt.find((t) => /^v=stsv1/i.test(t)) ?? null;
  checks.push(mtaSts ? { id: "mta-sts", status: "pass", group: "Transport", title: "MTA-STS is published", detail: mtaSts } : { id: "mta-sts", status: "info", group: "Transport", title: "No MTA-STS policy", detail: "MTA-STS forces senders to deliver to you over verified TLS. Recommended for domains handling sensitive mail; Gmail and Microsoft support it.", fix: `Publish \`_mta-sts.${domain} TXT "v=STSv1; id=${new Date().toISOString().slice(0, 10).replace(/-/g, "")}"\` and host the policy at https://mta-sts.${domain}/.well-known/mta-sts.txt.` });
  const tlsRpt = tlsRptTxt.find((t) => /^v=tlsrptv1/i.test(t)) ?? null;
  if (tlsRpt) checks.push({ id: "tls-rpt", status: "pass", group: "Transport", title: "TLS reporting (TLS-RPT) is enabled", detail: tlsRpt });
  else if (mtaSts) checks.push({ id: "tls-rpt", status: "warn", group: "Transport", title: "MTA-STS without TLS-RPT", detail: "You won't be told when senders fail to deliver over TLS.", fix: `Add \`_smtp._tls.${domain} TXT "v=TLSRPTv1; rua=mailto:tls-reports@${domain}"\`.` });
  const bimi = bimiTxt.find((t) => /^v=bimi1/i.test(t)) ?? null;
  if (bimi) checks.push({ id: "bimi", status: "pass", group: "Transport", title: "BIMI logo record is published", detail: bimi });
  else if (policy === "quarantine" || policy === "reject") checks.push({ id: "bimi", status: "info", group: "Transport", title: "Eligible for BIMI, not set up", detail: "With DMARC enforcing you can show your logo next to messages in Gmail, Yahoo and Apple Mail. Requires an SVG Tiny PS logo and, for Gmail, a Verified Mark Certificate.", fix: `Publish \`default._bimi.${domain} TXT "v=BIMI1; l=https://${domain}/bimi-logo.svg"\`.` });

  const facts: DnsEmailReport["facts"] = {
    domain,
    provider,
    mxCount: mx.length,
    spf: spf ?? null,
    spfQualifier: spfAnalysis?.qualifier ?? null,
    spfLookups: spfAnalysis?.lookups ?? null,
    dmarcPolicy: policy || null,
    dmarcReporting: Boolean(dmarcTags.rua),
    dkimSelectors: dkim.map((d) => d.selector).join(", ") || null,
    mtaSts: Boolean(mtaSts),
    bimi: Boolean(bimi),
  };

  return {
    ...finalizeChecklist({ kind: "dns-email", requestedUrl: rawDomain, finalUrl: `https://${domain}`, status: 200, title: domain, facts }, checks),
    kind: "dns-email",
    domain,
    records: { mx, spf, dmarc, dkim, mtaSts, tlsRpt, bimi },
  };
}

function spfIncludeFor(provider: string): string {
  const map: Record<string, string> = {
    "Google Workspace": "_spf.google.com",
    "Microsoft 365": "spf.protection.outlook.com",
    "Zoho Mail": "zoho.com",
    "Proton Mail": "_spf.protonmail.ch",
    Fastmail: "spf.messagingengine.com",
    "iCloud Mail": "icloud.com",
    Mailgun: "mailgun.org",
  };
  return map[provider] ?? "<your-provider>";
}
