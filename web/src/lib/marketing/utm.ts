/**
 * UTM link builder with the conventions analytics teams actually enforce:
 * lowercase values, no spaces, one taxonomy for medium, existing query
 * strings preserved, and a warning for anything that will fragment reports.
 */

export const STANDARD_MEDIUMS = ["cpc", "paid_social", "social", "email", "referral", "display", "affiliate", "organic", "video", "sms", "push", "print", "qr", "partner"] as const;

const MEDIUM_ALIASES: Record<string, string> = {
  ppc: "cpc",
  "paid-search": "cpc",
  paidsearch: "cpc",
  sem: "cpc",
  adwords: "cpc",
  "paid social": "paid_social",
  paidsocial: "paid_social",
  newsletter: "email",
  mail: "email",
  banner: "display",
  banners: "display",
  affiliates: "affiliate",
  seo: "organic",
  text: "sms",
};

export type UtmLinkInput = { label?: string; source: string; medium: string; content?: string; term?: string };

export type UtmRow = {
  label: string;
  url: string;
  params: { utm_source: string; utm_medium: string; utm_campaign: string; utm_content?: string; utm_term?: string };
  warnings: string[];
};

export type UtmBuild = {
  baseUrl: string;
  campaign: string;
  rows: UtmRow[];
  warnings: string[];
  /** Normalised naming rules applied, for the reply and the CSV header. */
  convention: { case: "lowercase"; separator: "_"; campaignPattern: string };
};

export function normalizeUtmValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function normalizeMedium(value: string): { medium: string; changed: boolean } {
  const raw = value.trim().toLowerCase();
  const alias = MEDIUM_ALIASES[raw];
  const medium = normalizeUtmValue(alias ?? raw);
  return { medium, changed: medium !== value };
}

export function buildUtmLinks(input: { baseUrl: string; campaign: string; links: UtmLinkInput[] }): UtmBuild {
  const warnings: string[] = [];
  let base: URL;
  try {
    const candidate = /^[a-z]+:\/\//i.test(input.baseUrl.trim()) ? input.baseUrl.trim() : `https://${input.baseUrl.trim()}`;
    base = new URL(candidate);
  } catch {
    throw new Error(`"${input.baseUrl}" is not a valid URL.`);
  }
  if (base.protocol !== "https:") warnings.push("The destination isn't HTTPS — most ad platforms and email clients flag http:// links.");
  const existingUtm = [...base.searchParams.keys()].filter((k) => k.startsWith("utm_"));
  if (existingUtm.length) {
    warnings.push(`The destination already carried ${existingUtm.join(", ")}; those were replaced.`);
    for (const key of existingUtm) base.searchParams.delete(key);
  }
  if (base.hash) warnings.push("The destination has a #fragment; UTM parameters were placed before it so analytics can read them.");

  const campaign = normalizeUtmValue(input.campaign);
  if (!campaign) throw new Error("Campaign name is required.");
  if (campaign !== input.campaign.trim()) warnings.push(`Campaign normalised to "${campaign}" (lowercase, underscores) so every link lands in one report row.`);

  const mediums = new Set<string>();
  const seen = new Set<string>();
  const rows: UtmRow[] = input.links.map((link, index) => {
    const rowWarnings: string[] = [];
    const source = normalizeUtmValue(link.source);
    const { medium, changed } = normalizeMedium(link.medium);
    if (!source) rowWarnings.push("Missing utm_source.");
    if (!medium) rowWarnings.push("Missing utm_medium.");
    if (changed && link.medium.trim().toLowerCase() !== medium) rowWarnings.push(`Medium "${link.medium}" mapped to the standard "${medium}".`);
    if (medium && !(STANDARD_MEDIUMS as readonly string[]).includes(medium)) rowWarnings.push(`"${medium}" isn't a standard medium — GA4's default channel grouping may file it under Unassigned.`);
    mediums.add(medium);
    const content = link.content ? normalizeUtmValue(link.content) : undefined;
    const term = link.term ? normalizeUtmValue(link.term) : undefined;

    const url = new URL(base.toString());
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", medium);
    url.searchParams.set("utm_campaign", campaign);
    if (content) url.searchParams.set("utm_content", content);
    if (term) url.searchParams.set("utm_term", term);

    const key = url.toString();
    if (seen.has(key)) rowWarnings.push("Duplicate of an earlier link — reports won't tell them apart.");
    seen.add(key);

    return {
      label: link.label?.trim() || [source, medium, content].filter(Boolean).join(" · ") || `Link ${index + 1}`,
      url: url.toString(),
      params: { utm_source: source, utm_medium: medium, utm_campaign: campaign, ...(content ? { utm_content: content } : {}), ...(term ? { utm_term: term } : {}) },
      warnings: rowWarnings,
    };
  });

  if (mediums.has("social") && mediums.has("paid_social")) warnings.push("Both 'social' and 'paid_social' are in use — fine if organic and paid posts are both in this campaign; otherwise pick one.");

  return {
    baseUrl: base.toString(),
    campaign,
    rows,
    warnings,
    convention: { case: "lowercase", separator: "_", campaignPattern: "<yyyy>_<q or mm>_<initiative>_<variant>  e.g. 2026_q4_launch_v1" },
  };
}

export function utmCsv(build: UtmBuild): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const header = ["label", "url", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const lines = build.rows.map((r) => [r.label, r.url, r.params.utm_source, r.params.utm_medium, r.params.utm_campaign, r.params.utm_content ?? "", r.params.utm_term ?? ""].map(esc).join(","));
  return [header.join(","), ...lines].join("\n");
}
