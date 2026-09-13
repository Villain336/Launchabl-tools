/**
 * Projects: the workspace context a signed-in user works inside. One per
 * client or brand. Holds what every tool otherwise has to ask for (company,
 * URL, audience, tone, offers, competitors) and the white-label settings that
 * shared reports carry. Pure module — storage lives in `storage.ts`.
 */

export type ProjectBrand = {
  /** Hex colour, e.g. "#FF6600". */
  primary: string | null;
  /** Public URL of a logo image; shown on white-label reports. */
  logoUrl: string | null;
  /** Name shown as the report author (agency or company). */
  agencyName: string | null;
  /** Hide the "made with Launchabl" footer on shared reports. */
  hideBadge: boolean;
};

/**
 * A vertical this project belongs to, so relevant tools can apply real
 * category knowledge instead of staying generic. See STRATEGY.md §23.5/§24 —
 * this is the "vertical depth" moat vector (§18.2.5), scoped to the one
 * vertical the founder committed to first: home/local services, anchored on
 * the one real customer this product has. Add more verticals here only once
 * this one has real, measured evidence behind it (§24.2's roadmap).
 */
export const VERTICALS = ["home-services"] as const;
export type Vertical = (typeof VERTICALS)[number];
export const VERTICAL_LABELS: Record<Vertical, string> = {
  "home-services": "Home & local services (lawn care, cleaning, HVAC, pressure washing, parking lot & exterior, similar trades)",
};
export const isVertical = (value: unknown): value is Vertical => typeof value === "string" && (VERTICALS as readonly string[]).includes(value);

/**
 * Category knowledge injected into every tool run for a project in this
 * vertical, on top of the generic project facts (company, audience, tone).
 * This is the actual content of the "vertical depth" moat vector — real,
 * specific, trade-level guidance a horizontal "AI tools for any business"
 * competitor doesn't encode, not just a label on the project.
 */
const VERTICAL_GUIDES: Record<Vertical, string> = {
  "home-services": `This account is a home/local service business (lawn care, cleaning, HVAC, pressure washing/exterior, parking-lot/paving, or a similar trade). Apply this without being asked:
- Seasonality drives demand and messaging: lawn care/landscaping peaks in spring (push sign-ups Feb–Mar); HVAC has two peaks (cooling before summer, heating before winter) plus a maintenance-plan window in shoulder seasons; cleaning and exterior/pressure-washing see a "get ready for the season" spike in spring. Time copy and GBP posts to the trade's real season, not a generic calendar.
- Review velocity is the single biggest local-pack ranking lever for this category, more than backlinks or on-page content. As a rule of thumb, a business under roughly 15 total Google reviews will consistently lose the map pack to a lower-quality competitor with 50+, no matter how good the website is. Below that threshold, prioritise review-request automation over more SEO copy.
- The map pack, not organic blue links, is where this category's customers actually click for "[service] near me" and "[service] in [city]" intent — proximity, review count/recency and correct GBP categorisation outrank on-page SEO here. A great website with a neglected GBP profile loses to a mediocre one with a strong profile.
- Service-area pages need one real page per (service × city), not a single combined "areas we serve" page — intent here is hyper-local ("lawn care Greensboro" vs. "lawn care"), and a combined page ranks for neither.
- The real conversion event is a quote/estimate request, not a generic "contact us" — forms and CTAs should ask for the job details (property size, service type, urgency) that let the business quote fast.
- Trust signals that convert for this category specifically: licensed/insured/bonded badges, years in business, and real before/after photos — more than testimonial text alone, which reads as generic across this whole category.`,
};

/** The category-knowledge block for a project's vertical, or `null` if it has none. */
export function verticalContext(project: Pick<Project, "vertical">): string | null {
  return project.vertical ? VERTICAL_GUIDES[project.vertical] : null;
}

export type Project = {
  id: string;
  ownerUid: string;
  name: string;
  company: string;
  url: string;
  audience: string;
  tone: string;
  offers: string;
  competitors: string[];
  notes: string;
  /** Optional vertical, so tools can apply category-specific knowledge (§18.2.5). Null = stay generic. */
  vertical: Vertical | null;
  brand: ProjectBrand;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = Partial<Omit<Project, "id" | "ownerUid" | "createdAt" | "updatedAt" | "brand">> & { brand?: Partial<ProjectBrand> };

export const PROJECT_LIMITS = { perUser: 30, field: 600, notes: 2_000, competitors: 12 } as const;

export const isProjectId = (id: string) => /^pr_[A-Za-z0-9_-]{12}$/.test(id);

const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "");
const multiline = (value: unknown, max: number) => (typeof value === "string" ? value.replace(/\r/g, "").trim().slice(0, max) : "");

export const isHexColour = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);
const isHttpUrl = (value: string) => /^https?:\/\/[^\s]+$/i.test(value);

/** Normalise user input into a Project, keeping fields inside the limits. */
export function normaliseProject(input: ProjectInput, base: Pick<Project, "id" | "ownerUid" | "createdAt"> & Partial<Project>, now = new Date()): Project {
  const competitors = (Array.isArray(input.competitors) ? input.competitors : base.competitors ?? [])
    .map((c) => clean(c, 120))
    .filter(Boolean)
    .slice(0, PROJECT_LIMITS.competitors);
  const brandIn = input.brand ?? {};
  const primary = typeof brandIn.primary === "string" ? brandIn.primary.trim() : base.brand?.primary ?? null;
  const logoUrl = typeof brandIn.logoUrl === "string" ? brandIn.logoUrl.trim() : base.brand?.logoUrl ?? null;
  const agencyName = typeof brandIn.agencyName === "string" ? clean(brandIn.agencyName, 80) : base.brand?.agencyName ?? null;
  const name = clean(input.name ?? base.name, 80) || clean(input.company ?? base.company, 80) || "Untitled project";
  return {
    id: base.id,
    ownerUid: base.ownerUid,
    name,
    company: clean(input.company ?? base.company, PROJECT_LIMITS.field),
    url: clean(input.url ?? base.url, 200),
    audience: clean(input.audience ?? base.audience, PROJECT_LIMITS.field),
    tone: clean(input.tone ?? base.tone, PROJECT_LIMITS.field),
    offers: multiline(input.offers ?? base.offers, PROJECT_LIMITS.field),
    competitors,
    notes: multiline(input.notes ?? base.notes, PROJECT_LIMITS.notes),
    vertical: input.vertical === null ? null : isVertical(input.vertical) ? input.vertical : base.vertical ?? null,
    brand: {
      primary: primary && isHexColour(primary) ? primary.toUpperCase() : null,
      logoUrl: logoUrl && isHttpUrl(logoUrl) && logoUrl.length <= 500 ? logoUrl : null,
      agencyName: agencyName || null,
      hideBadge: typeof brandIn.hideBadge === "boolean" ? brandIn.hideBadge : base.brand?.hideBadge ?? false,
    },
    createdAt: base.createdAt,
    updatedAt: now.toISOString(),
  };
}

/** Bare domain for a project URL ("https://www.acme.io/pricing" → "acme.io"). */
export function projectDomain(project: Pick<Project, "url">): string {
  try {
    return new URL(project.url.startsWith("http") ? project.url : `https://${project.url}`).hostname.replace(/^www\./, "");
  } catch {
    return project.url;
  }
}

/**
 * The system-prompt block every runtime receives when a project is active.
 * Tells the model what it already knows so it stops asking, and how to treat
 * gaps (proceed with sensible assumptions, say so once).
 */
export function projectContext(project: Project): string {
  const lines = [
    `Workspace context — the user is working on "${project.name}". Use these facts without asking for them again; where something is missing, proceed on a sensible assumption and mention it once in your reply.`,
  ];
  if (project.company) lines.push(`Company: ${project.company}`);
  if (project.url) lines.push(`Website: ${project.url}`);
  if (project.audience) lines.push(`Audience: ${project.audience}`);
  if (project.tone) lines.push(`Voice and tone: ${project.tone}`);
  if (project.offers) lines.push(`Offers / products: ${project.offers}`);
  if (project.competitors.length) lines.push(`Competitors: ${project.competitors.join(", ")}`);
  if (project.notes) lines.push(`Notes from the user: ${project.notes}`);
  if (project.brand.primary) lines.push(`Brand colour: ${project.brand.primary} (use it for designs, cards and images unless told otherwise).`);
  const vertical = verticalContext(project);
  if (vertical) lines.push("", vertical);
  return lines.join("\n");
}

/**
 * Fill a template's [slots] from the project so people don't retype the
 * company, domain or audience. Unknown slots are left for the user.
 */
export function fillTemplateSlots(prompt: string, project: Project | null): string {
  if (!project) return prompt;
  const domain = project.url ? projectDomain(project) : "";
  const map: [RegExp, string][] = [
    [/\[(domain|company domain|url|website)\]/gi, domain],
    [/\[(company|company name|brand|name)\]/gi, project.company],
    [/\[(audience|who|target audience|customer)\]/gi, project.audience],
    [/\[(what you sell|what you do|what it does|offer|product)\]/gi, project.offers.split("\n")[0] ?? ""],
    [/\[(confident \/ playful \/ technical|tone|voice)\]/gi, project.tone],
  ];
  let out = prompt;
  for (const [pattern, value] of map) if (value) out = out.replace(pattern, value);
  return out;
}
