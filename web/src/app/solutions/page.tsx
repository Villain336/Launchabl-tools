import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { siteConfig } from "@/lib/site-config";

const title = "Solutions";
const description = `Everything included in the Launchabl unlimited marketing & design plan — start with a free website audit, then ${siteConfig.price} unlocks it all for life.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/solutions" },
  openGraph: { type: "website", url: "/solutions", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const solutions = [
  {
    name: "Brand & identity",
    summary: "Logo, visual system, brand guidelines, and voice — built once, refined as often as you need.",
    deliverables: ["Logo & mark", "Color + type system", "Brand guidelines doc", "Social profile kit"],
  },
  {
    name: "Website design & build",
    summary: "A conversion-focused site, hosted and maintained, with ongoing edits included.",
    deliverables: ["Landing pages", "Full site builds", "Ongoing edits & new pages", "Hosting included"],
  },
  {
    name: "Content & copywriting",
    summary: "Ad copy, email sequences, landing page copy, and blog content that's actually on-brand.",
    deliverables: ["Ad & landing copy", "Email sequences", "Blog & SEO content", "Product descriptions"],
  },
  {
    name: "SEO & technical marketing",
    summary: "The unglamorous fixes that actually move rankings — schema, site speed, technical audits.",
    deliverables: ["Structured data across your site", "Technical SEO audits", "Site speed fixes", "Local SEO setup"],
  },
  {
    name: "Social & campaign design",
    summary: "On-brand social templates, campaign creative, and ad variations, delivered on a queue.",
    deliverables: ["Social templates", "Ad creative variations", "Launch campaign kits", "Presentation design"],
  },
  {
    name: "Domain, hosting & setup",
    summary: "The technical setup most agencies punt back to you — we just handle it.",
    deliverables: ["Domain registration", "DNS & email setup", "Managed hosting", "SSL & security basics"],
  },
];

/** Schema.org data so search engines and AI answer engines can enumerate what the unlimited plan covers. */
function solutionsJsonLd() {
  const url = `${siteConfig.url}/solutions`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: `${siteConfig.name} unlimited marketing & design plan`,
      description,
      url,
      provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Solutions included in the unlimited plan",
        itemListElement: solutions.map((solution, index) => ({
          "@type": "Offer",
          position: index + 1,
          itemOffered: {
            "@type": "Service",
            name: solution.name,
            description: solution.summary,
          },
        })),
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Solutions", item: url },
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

export default function SolutionsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionsJsonLd()) }} />
      <SectionHeading
        eyebrow="Solutions"
        title="Everything the unlimited plan covers"
        description={`Start with a free website audit. Then one flat price of ${siteConfig.price}, one active request at a time, unlimited requests over the life of your plan. No hourly billing, no scope negotiations.`}
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution) => (
          <CardSpotlight key={solution.name} className="h-full p-6">
            <div className="relative z-20">
              <h3 className="text-lg font-semibold text-foreground">{solution.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{solution.summary}</p>
              <ul className="mt-4 space-y-2">
                {solution.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </CardSpotlight>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Want to try before you commit?</h3>
        <p className="mt-2 text-primary-foreground/80">
          Every solution above has a free tool version in our toolbox — start with a free website audit, no account required.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href={siteConfig.freeAudit.href} variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            {siteConfig.freeAudit.cta}
          </LinkButton>
          <LinkButton href="/tools" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Explore free tools
          </LinkButton>
          <LinkButton href="/pricing" className="bg-background text-foreground hover:bg-background/90">
            See pricing
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
