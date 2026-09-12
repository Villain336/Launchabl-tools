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
