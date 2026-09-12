/**
 * Domain availability via RDAP (the registry protocol that replaced WHOIS)
 * with a DNS fallback for TLDs that don't publish RDAP. Plus the static
 * knowledge a registrar page gives you: typical pricing, registrar deep
 * links and the post-purchase checklist.
 */
import { promises as dns } from "dns";

export type DomainStatus = "available" | "taken" | "unknown";

export type DomainCheck = {
  domain: string;
  tld: string;
  status: DomainStatus;
  /** Where the answer came from: rdap = authoritative registry data, dns = heuristic. */
  source: "rdap" | "dns" | "invalid";
  registrar: string | null;
  registered: string | null;
  expires: string | null;
  /** EPP status codes for registered names (clientTransferProhibited, redemptionPeriod…). */
  flags: string[];
  note: string | null;
};

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/** Lower-case, strip protocol/path/www, keep the rest. Returns null when it isn't a plausible hostname. */
export function normaliseDomain(input: string): string | null {
  let s = input.trim().toLowerCase();
  s = s.replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").split(/[/?#\s]/)[0];
  if (!s.includes(".")) return null;
  const labels = s.split(".");
  if (labels.some((l) => !LABEL.test(l))) return null;
  if (labels[labels.length - 1].length < 2) return null;
  return s;
}

/** Brand or phrase → a registrable second-level label. */
export function labelFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

export const DEFAULT_TLDS = ["com", "io", "co", "ai", "app", "dev", "net", "org", "so", "xyz"];

/** Typical first-year / renewal pricing at cost-plus registrars (Cloudflare, Porkbun). Ranges in USD, indicative only. */
export const TLD_PRICING: Record<string, { first: [number, number]; renew: [number, number]; note?: string }> = {
  com: { first: [9, 13], renew: [10, 15] },
  net: { first: [11, 15], renew: [12, 16] },
  org: { first: [9, 13], renew: [11, 15] },
  io: { first: [32, 48], renew: [35, 55], note: "Popular with developer tools; renewals have risen steadily." },
  co: { first: [10, 30], renew: [25, 35], note: "First-year promos are common; budget for the renewal price." },
  ai: { first: [70, 95], renew: [70, 95], note: "Registered in two-year terms at most registrars, so expect roughly double at checkout." },
  app: { first: [13, 18], renew: [14, 20], note: "HTTPS-only TLD (HSTS preloaded) — you must serve TLS." },
  dev: { first: [12, 16], renew: [13, 18], note: "HTTPS-only TLD (HSTS preloaded)." },
  so: { first: [15, 25], renew: [20, 30] },
  xyz: { first: [2, 12], renew: [12, 15], note: "Cheap first year, normal renewal; some spam filters distrust it." },
  me: { first: [8, 20], renew: [18, 25] },
  us: { first: [6, 10], renew: [8, 12], note: "Requires a US nexus; WHOIS privacy is not allowed." },
  uk: { first: [6, 10], renew: [8, 12] },
  "co.uk": { first: [6, 10], renew: [8, 12] },
  ca: { first: [10, 15], renew: [12, 17], note: "Requires Canadian presence." },
  de: { first: [6, 10], renew: [8, 12] },
  eu: { first: [6, 12], renew: [8, 14], note: "Requires EU/EEA residency." },
  au: { first: [10, 16], renew: [12, 18], note: "Requires an Australian ABN/ACN." },
  tech: { first: [5, 50], renew: [45, 60], note: "Steep renewal." },
  studio: { first: [20, 30], renew: [25, 35] },
  design: { first: [35, 55], renew: [40, 60] },
  agency: { first: [15, 25], renew: [20, 30] },
  store: { first: [3, 50], renew: [50, 65], note: "Steep renewal." },
  shop: { first: [3, 35], renew: [30, 40] },
  online: { first: [2, 35], renew: [30, 40], note: "Steep renewal." },
  site: { first: [2, 30], renew: [28, 35], note: "Steep renewal." },
  cloud: { first: [8, 25], renew: [20, 28] },
  tools: { first: [25, 35], renew: [28, 38] },
  inc: { first: [1900, 2500], renew: [1900, 2500], note: "Premium-priced TLD." },
  ly: { first: [60, 100], renew: [60, 100], note: "Libyan ccTLD; registrations for 'ly' words are legal but policy-restricted." },
  gg: { first: [60, 90], renew: [60, 90] },
  to: { first: [40, 60], renew: [40, 60] },
  fm: { first: [80, 120], renew: [80, 120] },
  tv: { first: [25, 40], renew: [30, 45] },
};

export function tldOf(domain: string): string {
  const parts = domain.split(".");
  const two = parts.slice(-2).join(".");
  if (parts.length > 2 && two in TLD_PRICING) return two;
  return parts[parts.length - 1];
}

export type RegistrarLink = { registrar: string; url: string; why: string };

export function registrarLinks(domain: string): RegistrarLink[] {
  const q = encodeURIComponent(domain);
  return [
    { registrar: "Cloudflare Registrar", url: `https://dash.cloudflare.com/?to=/:account/domains/register/${domain}`, why: "Wholesale price, no markup, free WHOIS privacy, DNS included. Needs a free Cloudflare account; ~60 TLDs." },
    { registrar: "Porkbun", url: `https://porkbun.com/checkout/search?q=${q}`, why: "Near-wholesale pricing on 500+ TLDs, free privacy and SSL, plain UI." },
    { registrar: "Namecheap", url: `https://www.namecheap.com/domains/registration/results/?domain=${q}`, why: "Wide TLD coverage, frequent first-year promos — check the renewal price before buying." },
    { registrar: "Squarespace Domains", url: `https://domains.squarespace.com/domain-search?query=${q}`, why: "Former Google Domains. Simple, slightly higher price, good if you already use Squarespace." },
  ];
}

export type PostPurchaseStep = { step: string; detail: string; tool?: string };

export function postPurchaseChecklist(domain: string): PostPurchaseStep[] {
  return [
    { step: "Turn on auto-renew and registrar lock", detail: "Expired domains are snapped up within hours. Lock prevents unauthorised transfers." },
    { step: "Point DNS at your host", detail: `Add the A/CNAME records your host gives you for ${domain} and www.${domain}; redirect one to the other so you have a single canonical site.`, tool: "hosting" },
    { step: "Publish SPF, DKIM and DMARC before sending any email", detail: `Start with "v=spf1 include:<your-provider> ~all", your provider's DKIM record, and "_dmarc TXT v=DMARC1; p=none; rua=mailto:dmarc@${domain}".`, tool: "dns-email-health" },
    { step: "Register the brand elsewhere", detail: "Claim the matching handles on the two or three social networks that matter to you, even if you won't post yet." },
    { step: "Set up the site basics", detail: "HTTPS (usually automatic at the host), a sitemap and robots.txt, meta tags and Open Graph so shares look right from day one.", tool: "sitemap-robots-generator" },
    { step: "Consider defensive registrations", detail: "The .com if you bought another TLD, and common typos — only where the brand is worth protecting; skip the rest." },
  ];
}

type RdapEvent = { eventAction?: string; eventDate?: string };
type RdapEntity = { roles?: string[]; vcardArray?: unknown; publicIds?: { type?: string; identifier?: string }[]; entities?: RdapEntity[] };
type RdapResponse = { status?: string[]; events?: RdapEvent[]; entities?: RdapEntity[]; ldhName?: string };

function registrarFrom(entities: RdapEntity[] | undefined): string | null {
  if (!entities) return null;
  for (const e of entities) {
    if (e.roles?.includes("registrar")) {
      const vcard = e.vcardArray as [string, unknown[][]] | undefined;
      const fn = Array.isArray(vcard?.[1]) ? (vcard[1] as unknown[][]).find((row) => row[0] === "fn") : undefined;
      if (fn && typeof fn[3] === "string") return fn[3];
      const iana = e.publicIds?.find((p) => /iana/i.test(p.type ?? ""))?.identifier;
      if (iana) return `IANA registrar ${iana}`;
    }
    const nested = registrarFrom(e.entities);
    if (nested) return nested;
  }
  return null;
}

async function resolves(domain: string): Promise<boolean> {
  const tries = [dns.resolve4(domain), dns.resolveNs(domain), dns.resolveMx(domain)];
  const results = await Promise.allSettled(tries);
  return results.some((r) => r.status === "fulfilled" && Array.isArray(r.value) && r.value.length > 0);
}

const RDAP_HEADERS = { accept: "application/rdap+json", "user-agent": "Mozilla/5.0 (compatible; LaunchablBot/1.0; +https://launchabl.io)" };

type Bootstrap = { services: [string[], string[]][] };
let bootstrapCache: { at: number; byTld: Map<string, string> } | null = null;

/**
 * IANA's RDAP bootstrap maps each TLD to its registry's RDAP server. Cached
 * for a day; rdap.org (a redirector to the same servers) is the fallback.
 */
async function rdapBaseFor(tld: string, fetchImpl: typeof fetch): Promise<string> {
  const last = tld.split(".").pop() ?? tld;
  if (!bootstrapCache || Date.now() - bootstrapCache.at > 24 * 60 * 60 * 1000) {
    try {
      const response = await fetchImpl("https://data.iana.org/rdap/dns.json", { headers: RDAP_HEADERS, signal: AbortSignal.timeout(5_000) });
      if (response.ok) {
        const data = (await response.json()) as Bootstrap;
        const byTld = new Map<string, string>();
        for (const [tlds, urls] of data.services ?? []) {
          const url = urls.find((u) => u.startsWith("https://")) ?? urls[0];
          if (url) for (const t of tlds) byTld.set(t.toLowerCase(), url.endsWith("/") ? url : `${url}/`);
        }
        bootstrapCache = { at: Date.now(), byTld };
      }
    } catch {
      // keep whatever we had; fall back to rdap.org below
    }
  }
  return bootstrapCache?.byTld.get(last) ?? EXTRA_RDAP[last] ?? "https://rdap.org/";
}

/** ccTLDs that run RDAP but aren't in IANA's bootstrap file. */
const EXTRA_RDAP: Record<string, string> = {
  io: "https://rdap.identitydigital.services/rdap/",
  me: "https://rdap.identitydigital.services/rdap/",
  us: "https://rdap.nic.us/",
  de: "https://rdap.denic.de/",
  so: "https://rdap.nic.so/",
};

/** rdap.org answers 404 with this title when a TLD simply has no RDAP — not an availability signal. */
async function isNoServiceResponse(response: Response): Promise<boolean> {
  try {
    const data = (await response.clone().json()) as { title?: string; description?: string[] };
    return /no rdap service/i.test(`${data.title ?? ""} ${(data.description ?? []).join(" ")}`);
  } catch {
    return false;
  }
}

/** One domain: RDAP first (authoritative), DNS second (heuristic). */
export async function checkDomain(raw: string, { timeoutMs = 6_000, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {}): Promise<DomainCheck> {
  const domain = normaliseDomain(raw);
  if (!domain) return { domain: raw, tld: "", status: "unknown", source: "invalid", registrar: null, registered: null, expires: null, flags: [], note: "Not a valid domain name." };
  const tld = tldOf(domain);
  const base = { domain, tld, registrar: null, registered: null, expires: null, flags: [] as string[], note: null as string | null };
  try {
    const rdapBase = await rdapBaseFor(tld, fetchImpl);
    const response = await fetchImpl(`${rdapBase}domain/${domain}`, { headers: RDAP_HEADERS, redirect: "follow", signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 404 && !(await isNoServiceResponse(response))) return { ...base, status: "available", source: "rdap" };
    if (response.ok) {
      const data = (await response.json().catch(() => ({}))) as RdapResponse;
      const ev = (action: RegExp) => data.events?.find((e) => action.test(e.eventAction ?? ""))?.eventDate?.slice(0, 10) ?? null;
      const flags = (data.status ?? []).filter((s) => !/^active$/i.test(s));
      const note = flags.some((f) => /redemption|pendingDelete/i.test(f)) ? "Registered but in redemption / pending delete — it may drop soon; a backorder service can catch it." : null;
      return { ...base, status: "taken", source: "rdap", registrar: registrarFrom(data.entities), registered: ev(/registration/i), expires: ev(/expiration/i), flags, note };
    }
  } catch {
    // fall through to DNS
  }
  const taken = await resolves(domain).catch(() => false);
  return taken ? { ...base, status: "taken", source: "dns", note: "Resolves in DNS, so it's registered. This TLD doesn't publish RDAP, so registrar and dates aren't available." } : { ...base, status: "unknown", source: "dns", note: "No RDAP for this TLD and nothing in DNS — probably available, but confirm at the registrar." };
}

export async function checkDomains(domains: string[], options?: { timeoutMs?: number; fetchImpl?: typeof fetch; concurrency?: number }): Promise<DomainCheck[]> {
  const unique = Array.from(new Set(domains.map((d) => d.trim().toLowerCase()).filter(Boolean))).slice(0, 40);
  const limit = options?.concurrency ?? 8;
  const out: DomainCheck[] = new Array(unique.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, unique.length) }, async () => {
      while (next < unique.length) {
        const i = next;
        next += 1;
        out[i] = await checkDomain(unique[i], options);
      }
    }),
  );
  return out;
}

export function priceLine(tld: string): string | null {
  const p = TLD_PRICING[tld];
  if (!p) return null;
  const fmt = ([a, b]: [number, number]) => (a === b ? `$${a}` : `$${a}–${b}`);
  return `${fmt(p.first)} first year · ${fmt(p.renew)}/yr renewal${p.note ? ` · ${p.note}` : ""}`;
}
