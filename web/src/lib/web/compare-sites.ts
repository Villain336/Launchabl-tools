import { fetchHtml, FetchPageError, mapLimit } from "@/lib/web/fetch-page";
import { auditWebsiteHtml, type WebsiteAuditReport } from "@/lib/web/website-audit";

/**
 * Side-by-side comparison of 2–4 pages on the same signals. The first URL
 * is "yours"; every metric declares which direction is better so the
 * artifact can highlight the leader per row and the model can talk about
 * gaps rather than raw numbers.
 */

export type CompareMetricKey =
  | "score"
  | "words"
  | "loadTimeMs"
  | "htmlKb"
  | "titleLength"
  | "descriptionLength"
  | "h1Count"
  | "h2Count"
  | "imagesTotal"
  | "altCoverage"
  | "internalLinks"
  | "externalLinks"
  | "schemaTypes"
  | "ogImage"
  | "https"
  | "securityHeaders"
  | "scripts"
  | "thirdParties"
  | "fails";

export type CompareMetric = {
  key: CompareMetricKey;
  label: string;
  /** How to pick a leader for the row. */
  better: "higher" | "lower" | "true";
  unit?: string;
  group: "Overall" | "Content" | "On-page" | "Rich results" | "Technical";
};

export const COMPARE_METRICS: CompareMetric[] = [
  { key: "score", label: "Audit score", better: "higher", group: "Overall" },
  { key: "fails", label: "Failing checks", better: "lower", group: "Overall" },
  { key: "words", label: "Visible words", better: "higher", group: "Content" },
  { key: "h2Count", label: "H2 sections", better: "higher", group: "Content" },
  { key: "imagesTotal", label: "Images", better: "higher", group: "Content" },
  { key: "altCoverage", label: "Alt text coverage", better: "higher", unit: "%", group: "Content" },
  { key: "internalLinks", label: "Internal links", better: "higher", group: "Content" },
  { key: "externalLinks", label: "Outbound links", better: "lower", group: "Content" },
  { key: "titleLength", label: "Title length", better: "higher", unit: " chars", group: "On-page" },
  { key: "descriptionLength", label: "Description length", better: "higher", unit: " chars", group: "On-page" },
  { key: "h1Count", label: "H1 tags", better: "lower", group: "On-page" },
  { key: "schemaTypes", label: "Schema types", better: "higher", group: "Rich results" },
  { key: "ogImage", label: "Open Graph image", better: "true", group: "Rich results" },
  { key: "loadTimeMs", label: "HTML load time", better: "lower", unit: " ms", group: "Technical" },
  { key: "htmlKb", label: "HTML weight", better: "lower", unit: " KB", group: "Technical" },
  { key: "scripts", label: "External scripts", better: "lower", group: "Technical" },
  { key: "thirdParties", label: "Third-party hosts", better: "lower", group: "Technical" },
  { key: "securityHeaders", label: "Security headers", better: "higher", unit: "/6", group: "Technical" },
  { key: "https", label: "HTTPS", better: "true", group: "Technical" },
];

export type CompareValue = number | boolean | null;

export type ComparedSite = {
  requestedUrl: string;
  finalUrl: string | null;
  title: string | null;
  ok: boolean;
  error?: string;
  values: Record<CompareMetricKey, CompareValue>;
  schemaTypes: string[];
  keywords: string[];
  /** Check titles that failed — the concrete gaps for this site. */
  failing: string[];
};

export type ComparisonReport = {
  comparedAt: string;
  sites: ComparedSite[];
  metrics: CompareMetric[];
  /** Index of the leading site for each metric, or null when tied/unavailable. */
  leaders: Partial<Record<CompareMetricKey, number | null>>;
  /** Metrics where site 0 (yours) trails the best competitor. */
  gaps: { key: CompareMetricKey; label: string; yours: CompareValue; best: CompareValue; leader: number }[];
  /** Metrics where site 0 leads. */
  wins: CompareMetricKey[];
  /** Keywords competitors share that site 0 doesn't use. */
  missingKeywords: string[];
};

const emptyValues = (): Record<CompareMetricKey, CompareValue> =>
  Object.fromEntries(COMPARE_METRICS.map((m) => [m.key, null])) as Record<CompareMetricKey, CompareValue>;

function valuesFrom(report: WebsiteAuditReport): Record<CompareMetricKey, CompareValue> {
  const m = report.metrics;
  return {
    score: report.score,
    fails: report.summary.fail,
    words: m.words,
    loadTimeMs: m.loadTimeMs,
    htmlKb: m.htmlKb,
    titleLength: m.titleLength,
    descriptionLength: m.descriptionLength,
    h1Count: m.h1Count,
    h2Count: m.h2Count,
    imagesTotal: m.imagesTotal,
    altCoverage: m.imagesTotal ? Math.round((m.imagesWithAlt / m.imagesTotal) * 100) : null,
    internalLinks: m.internalLinks,
    externalLinks: m.externalLinks,
    schemaTypes: m.jsonLdTypes.length,
    ogImage: m.hasOgImage,
    https: m.https,
    securityHeaders: m.securityHeaders,
    scripts: m.scripts,
    thirdParties: m.thirdParties,
  };
}

const score = (v: CompareValue) => (typeof v === "boolean" ? (v ? 1 : 0) : v);

export function leaderFor(metric: CompareMetric, values: CompareValue[]): number | null {
  let best: number | null = null;
  let bestScore: number | null = null;
  let tie = false;
  values.forEach((raw, i) => {
    const v = score(raw);
    if (v === null) return;
    if (bestScore === null) {
      best = i;
      bestScore = v;
      return;
    }
    const wins = metric.better === "lower" ? v < bestScore : v > bestScore;
    if (wins) {
      best = i;
      bestScore = v;
      tie = false;
    } else if (v === bestScore) tie = true;
  });
  return tie ? null : best;
}

export function buildComparison(sites: ComparedSite[], comparedAt = new Date().toISOString()): ComparisonReport {
  const leaders: ComparisonReport["leaders"] = {};
  const gaps: ComparisonReport["gaps"] = [];
  const wins: CompareMetricKey[] = [];
  for (const metric of COMPARE_METRICS) {
    const values = sites.map((s) => s.values[metric.key]);
    const leader = leaderFor(metric, values);
    leaders[metric.key] = leader;
    if (leader === null) continue;
    if (leader === 0) wins.push(metric.key);
    else if (sites[0]?.ok && values[0] !== null) gaps.push({ key: metric.key, label: metric.label, yours: values[0], best: values[leader], leader });
  }
  const yoursKw = new Set(sites[0]?.keywords ?? []);
  const shared = new Map<string, number>();
  for (const site of sites.slice(1)) for (const kw of site.keywords) shared.set(kw, (shared.get(kw) ?? 0) + 1);
  const missingKeywords = Array.from(shared)
    .filter(([kw]) => !yoursKw.has(kw))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);
  return { comparedAt, sites, metrics: COMPARE_METRICS, leaders, gaps, wins, missingKeywords };
}

export async function compareSites(urls: string[]): Promise<ComparisonReport> {
  const unique = Array.from(new Set(urls.map((u) => u.trim()).filter(Boolean))).slice(0, 4);
  const sites = await mapLimit(unique, 4, async (requestedUrl): Promise<ComparedSite> => {
    try {
      const raw = await fetchHtml(requestedUrl);
      const report = auditWebsiteHtml(raw);
      return {
        requestedUrl,
        finalUrl: raw.finalUrl,
        title: report.title,
        ok: true,
        values: valuesFrom(report),
        schemaTypes: report.metrics.jsonLdTypes,
        keywords: report.metrics.keywords,
        failing: report.checks.filter((c) => c.status === "fail").map((c) => c.title),
      };
    } catch (error) {
      return {
        requestedUrl,
        finalUrl: null,
        title: null,
        ok: false,
        error: error instanceof FetchPageError ? error.message : "Couldn't fetch this page.",
        values: emptyValues(),
        schemaTypes: [],
        keywords: [],
        failing: [],
      };
    }
  });
  return buildComparison(sites);
}
