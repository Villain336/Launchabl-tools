import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { siteConfig } from "@/lib/site-config";

const title = "The OS";
const description = "Run your NC service business from one place — customers, jobs, estimates, staff, and the leads coming in from the marketplace, with AI agents helping along the way.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/os" },
  openGraph: { type: "website", url: "/os", title, description },
  twitter: { card: "summary_large_image", title, description },
};

/**
 * Status is deliberately honest, not aspirational — §22.2's lesson (an
 * invented case study cost real trust) applies just as much to a feature
 * list. See `docs/STRATEGY.md` §25.8 for what's actually shipped.
 */
const features: { name: string; summary: string; status: "live" | "beta" | "coming-soon" }[] = [
  { name: "Unified customer profiles", summary: "Every customer, their contact info, job history, and notes in one place — not scattered across texts and spreadsheets.", status: "live" },
  { name: "Knowledge notes & AI agents", summary: "Your agent learns from every job and quote it helps with, and remembers it next time.", status: "live" },
  { name: "Staff & team accounts", summary: "Invite your crew with their own sign-in and the right permissions — every change logged.", status: "live" },
  { name: "Smart job scheduling", summary: "A calendar that accounts for drive time, crew availability, and job length.", status: "coming-soon" },
  { name: "Near-perfect digital estimates", summary: "AI-drafted estimates from a job description, ready for your review before they go out.", status: "coming-soon" },
  { name: "Automations", summary: "Follow-up texts, review requests, and reminders that fire themselves.", status: "coming-soon" },
  { name: "Warranty & maintenance tracking", summary: "Know exactly what's still under warranty and when a maintenance visit is due.", status: "coming-soon" },
  { name: "Inventory management", summary: "What's on hand, what's low, what a job actually used.", status: "coming-soon" },
  { name: "Telegram/iMessage alerts", summary: "Run the business from your phone between jobs, not from a laptop at night.", status: "coming-soon" },
  { name: "Payment collection", summary: "Send an invoice, get paid, without a separate tool.", status: "coming-soon" },
  { name: "Revenue dashboard", summary: "What's actually driving revenue this month, at a glance.", status: "coming-soon" },
];

export default function OsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="The OS"
        title="One place to run your service business"
        description="Built for the trades already on the NC marketplace — lawn care, HVAC, cleaning, pressure washing, parking-lot & paving, plumbing, electrical, and painting. Self-serve: you run it, we build it."
      />

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <CardSpotlight key={feature.name} className="h-full p-6">
            <div className="relative z-20">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-foreground">{feature.name}</h3>
                <ToolStatusBadge status={feature.status} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{feature.summary}</p>
            </div>
          </CardSpotlight>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Get started today</h3>
        <p className="mt-2 text-primary-foreground/80">
          Set up your team, add your customers, and start using what&rsquo;s live now — the rest ships as it&rsquo;s ready. Free to try.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LinkButton href="/team" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Create your team
          </LinkButton>
          <LinkButton href="/crm" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Open the CRM
          </LinkButton>
          <LinkButton href="/agency" className="bg-background text-foreground hover:bg-background/90">
            Rather have {siteConfig.name} run it for you?
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
