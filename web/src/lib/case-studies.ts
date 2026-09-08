export type CaseStudy = {
  slug: string;
  client: string;
  industry: string;
  summary: string;
  metric: { label: string; value: string };
  toolCluster: string;
  quote: { text: string; author: string };
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "riverside-roasters",
    client: "Riverside Roasters",
    industry: "Coffee & CPG",
    summary:
      "A local coffee roaster needed a brand, a site, and a launch campaign before their new roastery opened — all within one flat price.",
    metric: { label: "Pre-orders in launch week", value: "412" },
    toolCluster: "launch",
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
    toolCluster: "get-found",
    quote: {
      text: "The schema generator caught gaps we didn't know existed. The full technical SEO pass on the unlimited plan is what actually moved the needle.",
      author: "David Okafor, Managing Partner",
    },
  },
  {
    slug: "loop-studio",
    client: "Loop Studio",
    industry: "Creative / photography",
    summary:
      "An independent photo studio needed to protect proofs shared with clients before final purchase, and clean metadata from every delivered gallery.",
    metric: { label: "Unauthorized reposts, before vs. after", value: "-89%" },
    toolCluster: "protect",
    quote: {
      text: "Watermarking proofs used to be a manual Photoshop chore. Now it's part of our delivery pipeline, and the unlimited plan handles our whole gallery site.",
      author: "Priya Nair, Owner",
    },
  },
];

export function getCaseStudyBySlug(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
