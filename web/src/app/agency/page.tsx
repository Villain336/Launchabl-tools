import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { siteConfig } from "@/lib/site-config";
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";
import { AGENCY_VERTICAL_GROUPS } from "@/lib/service-business/verticals";
import {
  AGENCY_MODEL,
  AGENCY_VS,
  AGENCY_WONT,
  BUILD_SEQUENCE,
  REPLY_KIT,
  WINTER_HUNT,
} from "@/lib/service-business/agency-model";

const title = "Build and run your business";
const description =
  "We sit on “anyone know a guy?” and turn it into a booking link. Build is $1,200 with 90 days of Network. Then $99/month to stay on the board — or $497/month if we run the front door.";

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
    summary: "We stand the business up in 14 days: brand, site, booking, OS, live Network profile, and a reply kit they can use on day 2.",
    deliverables: [
      "Live /b booking page + OS job book",
      `${AGENCY_MODEL.buildIncludesNetworkDays} days of Network included — then $${AGENCY_MODEL.networkUsd}/month`,
      "Nextdoor, Facebook, and GBP reply scripts that end on /b",
      AGENCY_MODEL.guarantee,
    ],
  },
  {
    name: AGENCY_PACKAGES.network.label,
    tagline: `$${AGENCY_PACKAGES.network.price} / month after day 90`,
    summary: "The DoorDash seat. Stay in the network, receive city-wide jobs, first claim owns them. Not a fee per ping.",
    deliverables: [
      "Pings for your city and trade once three crews sit",
      "Booking / recall demand for local-care clients",
      `${LEAD_TIERS.network.monthlyLeads} quote leads / month on top of pings`,
      "OS included so you can claim, quote, and get paid",
    ],
  },
  {
    name: AGENCY_PACKAGES["managed-growth"].label,
    tagline: `$${AGENCY_PACKAGES["managed-growth"].price} / month`,
    summary: "We sit on that city×trade’s neighborhood asks. Network is included. You do the work. We keep the front door fed.",
    deliverables: [
      "Network seat included — no extra $99",
      "Reply queue: we draft, they send from their phone",
      "We only sell this where we will actually reply",
      "GBP, reviews, and the book — not a clinic chart",
      "Monthly report. You can take the OS over any time.",
    ],
  },
];

export default function AgencyPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Agency"
        title="We sit on “anyone know a guy?” and turn it into a booking link."
        description="Not another Jobber clone. Not a logo and a walk-away. The neighborhood already has the demand. We build the front door, put you on the client network, and stay if you want the asks answered. One city, one trade, until that board is real."
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton href="/agency/start" size="lg">
          Start with Build
        </LinkButton>
        <LinkButton href={siteConfig.freeAudit.href} variant="secondary" size="lg">
          {siteConfig.freeAudit.cta}
        </LinkButton>
      </div>
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">{AGENCY_MODEL.guarantee}</p>

      <div className="mt-16 grid gap-4 lg:grid-cols-3">
        {AGENCY_VS.map((item) => (
          <article key={item.name} className="rounded-2xl border border-border p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Vs {item.name}</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{item.ours}</p>
          </article>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold">The sequence</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Audit → 14-day Build → 90 days of Network → then ${AGENCY_MODEL.networkUsd}/month or Run. We do not open a city×trade board until {AGENCY_MODEL.foundingCrewsToOpenBoard} claiming crews sit on it. A seated crew that brings the next one gets a month of Network credited.
        </p>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {BUILD_SEQUENCE.map((step) => (
            <li key={step.day} className="rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Days {step.day}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-heading text-2xl font-bold">The reply kit is the first product</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {REPLY_KIT.rule} {REPLY_KIT.cta} On Run, those drafts land in a phone queue — they copy and send. We do not post as them. Nextdoor is the demand engine. Our marketplace is the Network perk that comes with the agency — not a second Angi they have to join.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {REPLY_KIT.channels.map((channel) => (
            <li key={channel} className="rounded-full border border-border px-3 py-1.5 text-sm">
              {channel}
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <LinkButton href={REPLY_KIT.queueHref} variant="secondary">
            Open the reply queue
          </LinkButton>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold">Who we Build for</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Winter hunt is {WINTER_HUNT.map((slug) => slug.replaceAll("-", " ")).join(" → ")}. Appliance sits next to cleaning so January still has work. Hoods and clinics stay agency-first — no empty city pages.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENCY_VERTICAL_GROUPS.map((group) => (
            <div key={group.id} className="rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{group.label}</p>
              <p className="mt-2 text-sm text-muted-foreground">{group.pitch}</p>
              <p className="mt-3 text-sm text-foreground">{group.examples.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
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

      <section className="mt-16">
        <h2 className="font-heading text-2xl font-bold">What we will not do</h2>
        <ul className="mt-4 max-w-2xl space-y-2 text-sm leading-6 text-muted-foreground">
          {AGENCY_WONT.map((line) => (
            <li key={line}>— {line}</li>
          ))}
        </ul>
      </section>

      <section className="mt-16 rounded-2xl border border-border p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Named proof</p>
        <h2 className="mt-1 font-heading text-2xl font-bold">{AGENCY_MODEL.proof.name}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{AGENCY_MODEL.proof.note}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <LinkButton href={AGENCY_MODEL.proof.url} target="_blank" rel="noreferrer">
            atlaslotcare.com
          </LinkButton>
          <LinkButton href={AGENCY_MODEL.proof.href} variant="secondary">
            The case study
          </LinkButton>
        </div>
      </section>

      <p className="mt-10 text-sm text-muted-foreground">
        Build is ${AGENCY_PACKAGES.launch.price.toLocaleString()} and includes {AGENCY_MODEL.buildIncludesNetworkDays} days of Network. Then Network is $
        {AGENCY_PACKAGES.network.price}/month — we do not charge per ping. Run is ${AGENCY_PACKAGES["managed-growth"].price}/month and includes Network. Free listings cannot claim jobs. Ads and Twilio never outrun this month&apos;s retainers plus Builds closed. The 5% dispatch take stays off until three crews and twenty paid jobs exist on that board.
      </p>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Tell us the city and the trade</h3>
        <p className="mt-2 text-primary-foreground/80">A form a person reads. If we cannot sit on those asks, we will say so.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href="/agency/start" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Start the agency
          </LinkButton>
          <LinkButton href={siteConfig.freeAudit.href} className="bg-background text-foreground hover:bg-background/90">
            {siteConfig.freeAudit.cta}
          </LinkButton>
        </div>
        <p className="mt-4 text-xs text-primary-foreground/70">
          Or{" "}
          <Link href="mailto:hello@launchabl.io?subject=Agency%20%E2%80%94%20Build%2C%20Network%2C%20or%20Run" className="underline">
            email hello@launchabl.io
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}
