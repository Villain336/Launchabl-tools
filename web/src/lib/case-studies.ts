export type CaseStudy = {
  slug: string;
  client: string;
  industry: string;
  summary: string;
  metric: { label: string; value: string };
  /** Slug of the free tool that kicked the engagement off. */
  tool: string;
  quote: { text: string; author: string };
  image?: string;
  url?: string;
  /**
   * True if this is a hypothetical/composite example rather than a real,
   * named customer. Must be true unless there is a real customer behind the
   * name, quote, and metric — never present an invented result as a real
   * testimonial. Every UI that renders a CaseStudy must surface this flag.
   */
  illustrative: boolean;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "atlas-lot-care",
    client: "Atlas Lot Care",
    industry: "Parking lot services · Greensboro, NC",
    summary:
      "Atlas Parking Lot Solutions needed a live site that could sell striping, sealcoating, ADA markings, and lot maintenance across the Triad — without looking like a template. Launchabl designed and shipped atlaslotcare.com: a conversion-focused homepage, service grid, coverage story, and a quote path, with Atlas Intelligence on-site to catch inbound questions.",
    metric: { label: "Live at", value: "atlaslotcare.com" },
    tool: "brand-creator",
    image: "/case-studies/atlaslotcare.png",
    url: "https://atlaslotcare.com",
    quote: {
      text: "The site is the product: a clear offer, a local service story, and a path to a quote — built so a Greensboro lot-care company can send one URL instead of a PDF.",
      author: "Launchabl, on the Atlas Lot Care launch",
    },
    illustrative: false,
  },
  {
    slug: "riverside-roasters",
    client: "Riverside Roasters (hypothetical example)",
    industry: "Coffee & CPG",
    summary:
      "A composite, hypothetical example — not a real customer — showing how a local coffee roaster could use a free brand-name tool to kick off a full brand + site + launch campaign on the unlimited plan.",
    metric: { label: "Illustrative target", value: "412 pre-orders" },
    tool: "brand-creator",
    quote: {
      text: "We used the Brand Creator tool to test names for free, then rolled straight into the unlimited plan for the full identity and site. Launch week outsold our projections by 3x.",
      author: "Illustrative example — not a real customer",
    },
    illustrative: true,
  },
  {
    slug: "northstar-legal",
    client: "Northstar Legal Group (hypothetical example)",
    industry: "Professional services",
    summary:
      "A composite, hypothetical example — not a real customer — showing how a firm with inconsistent metadata across hundreds of documents could use the free schema-generator tool as an entry point into a full technical SEO pass.",
    metric: { label: "Illustrative target", value: "+164% organic traffic" },
    tool: "schema-generator",
    quote: {
      text: "The schema generator caught gaps we didn't know existed. The full technical SEO pass on the unlimited plan is what actually moved the needle.",
      author: "Illustrative example — not a real customer",
    },
    illustrative: true,
  },
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
