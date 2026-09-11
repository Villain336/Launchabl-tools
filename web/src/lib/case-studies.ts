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
  },
  {
    slug: "riverside-roasters",
    client: "Riverside Roasters",
    industry: "Coffee & CPG",
    summary:
      "A local coffee roaster needed a brand, a site, and a launch campaign before their new roastery opened — all within one flat price.",
    metric: { label: "Pre-orders in launch week", value: "412" },
    tool: "brand-creator",
    quote: {
      text: "We used the Brand Creator tool to test names for free, then rolled straight into the unlimited plan for the full identity and site. Launch week outsold our projections by 3x.",
      author: "Maya Chen, Founder",
    },
  },
  {
    slug: "northstar-legal",
    client: "Northstar Legal Group",
    industry: "Professional services",
    summary:
      "A regional law firm's site had zero structured data and inconsistent metadata across hundreds of scanned documents shared with clients.",
    metric: { label: "Organic traffic in 4 months", value: "+164%" },
    tool: "schema-generator",
    quote: {
      text: "The schema generator caught gaps we didn't know existed. The full technical SEO pass on the unlimited plan is what actually moved the needle.",
      author: "David Okafor, Managing Partner",
    },
  },
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
