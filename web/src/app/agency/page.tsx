import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { siteConfig } from "@/lib/site-config";
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";
import { AGENCY_VERTICAL_GROUPS } from "@/lib/service-business/verticals";

const title = "Build and run your business";
const description =
  "We build the front door and run the operation. The client and customer network comes with it — home services first, then medspas, dentists, and vets.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/agency" },
  openGraph: { type: "website", url: "/agency", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const packages = [
  {
    name: AGENCY_PACKAGES.launch.label,
    tagline: `$${AGENCY_PACKAGES.launch.price.toLocaleString()} one-time`,
    summary: "We stand the business up: brand, site, booking, OS, and a live network profile.",
    deliverables: [
      "Brand and site with a live booking calendar",
      "OS job book — customers, jobs, estimates, payments",
      "Network profile, search-indexed",
      "Local SEO and Google Business Profile foundation",
    ],
  },
  {
    name: AGENCY_PACKAGES.network.label,
    tagline: `$${AGENCY_PACKAGES.network.price} / month`,
    summary: "The DoorDash seat. Stay in the network, receive city-wide jobs, first claim owns them. Not a fee per ping.",
    deliverables: [
      "Pings for your city and trade (home services)",
      "Booking / recall demand for local-care clients",
      `${LEAD_TIERS.network.monthlyLeads} quote leads / month on top of pings`,
      "OS included so you can claim, quote, and get paid",
    ],
  },
  {
    name: AGENCY_PACKAGES["managed-growth"].label,
    tagline: `$${AGENCY_PACKAGES["managed-growth"].price} / month`,
    summary: "We run it. Network is included. Local SEO, reviews, and the book — you do the work, we keep the front door fed.",
    deliverables: [
      "Network seat included — no extra $99",
      "Ongoing local SEO, GBP, and review cadence",
      `${LEAD_TIERS.managed.monthlyLeads} leads / month`,
      "Monthly report. You can take the OS over any time.",
    ],
  },
];

export default function AgencyPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Agency"
        title="The first build-and-run agency. The network comes with it."
        description="We do not sell a logo and walk away. We build the business, put you on the client and customer network, and stay to run the front door. Start with home services. Local care — medspa, dentist, vet — is booking and reviews, not a clinical chart."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {AGENCY_VERTICAL_GROUPS.map((group) => (
          <div key={group.id} className="rounded-2xl border border-border p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{group.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">{group.pitch}</p>
            <p className="mt-3 text-sm text-foreground">{group.examples.join(" · ")}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
        Build is ${AGENCY_PACKAGES.launch.price.toLocaleString()}. Network is ${AGENCY_PACKAGES.network.price}/month to stay on the board — we do not charge per ping. Run is $
        {AGENCY_PACKAGES["managed-growth"].price}/month and includes Network. Free listings cannot claim jobs. We do not replace Dentrix, ezyVet, or a medspa EMR. Multi-location or unusual work gets a custom quote.
      </p>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Tell us about the business</h3>
        <p className="mt-2 text-primary-foreground/80">Start with a free audit, then talk about Build, Network, or Run.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href={siteConfig.freeAudit.href} variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            {siteConfig.freeAudit.cta}
          </LinkButton>
          <LinkButton
            href={`mailto:hello@launchabl.io?subject=${encodeURIComponent("Agency — Build, Network, or Run")}`}
            className="bg-background text-foreground hover:bg-background/90"
          >
            Talk to a person
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
