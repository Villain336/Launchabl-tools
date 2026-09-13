import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { siteConfig } from "@/lib/site-config";

const title = "Agency";
const description = "Done-for-you setup and ongoing marketing for NC home & local-service businesses — brand, marketplace profile, local SEO, and growth, handled by a real team.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/agency" },
  openGraph: { type: "website", url: "/agency", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const packages = [
  {
    name: "Launch",
    tagline: "$1,200 one-time",
    summary: "We build your brand, site, and marketplace profile, and lay the local SEO foundation — done once, built to last.",
    deliverables: [
      "Brand & logo (if you need one)",
      "A real website, hosted",
      "Your marketplace profile, live and search-indexed",
      "Local SEO & Google Business Profile foundation — schema, service-area pages, listings",
    ],
  },
  {
    name: "Managed Growth",
    tagline: "$497 / month",
    summary: "We keep running your local SEO, content, and reviews every month, so your marketplace profile and rankings keep improving without you touching a tool.",
    deliverables: [
      "Ongoing local SEO & Google Business Profile management",
      "Review-generation cadence",
      "Marketplace profile & listing upkeep",
      "Monthly report on what it's driving",
    ],
  },
];

export default function AgencyPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Agency"
        title={`Don't have time to run it yourself? We will.`}
        description="For NC lawn care, HVAC, cleaning, pressure washing, parking-lot & paving, plumbing, electrical, and painting businesses — a real team, using the same platform, does the setup and the ongoing marketing work for you."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {packages.map((pkg) => (
          <CardSpotlight key={pkg.name} className="h-full p-6">
            <div className="relative z-20">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{pkg.tagline}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{pkg.summary}</p>
              <ul className="mt-4 space-y-2">
                {pkg.deliverables.map((d) => (
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

      <p className="mt-8 text-sm text-muted-foreground">
        Launch is $1,200. Managed Growth starts at $497/month. Multi-location or unusual trades get a custom quote. Every managed client also gets a{" "}
        <a href="/os" className="underline">
          self-serve OS
        </a>{" "}
        account included, and can take over running it themselves at any time — nothing locks you out of your own data.
      </p>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Tell us about your business</h3>
        <p className="mt-2 text-primary-foreground/80">Start with a free audit, then talk to a real person about Launch or Managed Growth.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href={siteConfig.freeAudit.href} variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            {siteConfig.freeAudit.cta}
          </LinkButton>
          <LinkButton
            href={`mailto:hello@launchabl.io?subject=${encodeURIComponent("Agency — Launch or Managed Growth")}`}
            className="bg-background text-foreground hover:bg-background/90"
          >
            Talk to a person
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
