import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { siteConfig } from "@/lib/site-config";

const title = "The OS";
const description = "City-wide jobs ping your phone. First claim owns the quote. Or customers pick a weekday time on your page. You run the work from the truck — not another CRM speech."

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
  { name: "Dispatch offers", summary: "A homeowner asks for the trade in your city. Every available crew gets the ping. First claim owns the job, sends the quote, and gets paid on that request.", status: "live" },
  { name: "Public booking", summary: "Customers pick an open weekday slot on your page. It becomes a job on the calendar, not a quote you have to chase.", status: "live" },
  { name: "Customizable storefront", summary: "Your public listing is a theme you control — colors, services, photos, booking — like Shopify, for a trade.", status: "live" },
  { name: "Marketplace leads", summary: "Quote requests still work for messy jobs. Booked slots always land — we do not hold a Saturday because your allotment ran out.", status: "live" },
  { name: "Jobs", summary: "Turn a lead into a job on the book, assigned to someone on the team.", status: "live" },
  { name: "Digital estimates", summary: "Line-item estimates tied to a customer and job, ready to send.", status: "live" },
  { name: "Payment collection", summary: "Record cash/check/card on a job, or send a Stripe Checkout invoice. Same ledger either way.", status: "live" },
  { name: "Revenue dashboard", summary: "Leads, open jobs, pipeline, cash collected, warranties due, and low stock.", status: "live" },
  { name: "Knowledge notes & AI agents", summary: "Your agent learns from every job and quote it helps with, and remembers it next time.", status: "live" },
  { name: "Staff & team accounts", summary: "Invite your crew with their own sign-in and the right permissions — every change logged.", status: "live" },
  { name: "Smart job scheduling", summary: "A calendar that accounts for drive time, crew availability, and job length — overlaps are blocked.", status: "live" },
  { name: "Automations", summary: "Lead follow-up, review requests, job reminders, and warranty alerts that fire themselves.", status: "live" },
  { name: "Warranty & maintenance tracking", summary: "Know exactly what's still under warranty and when a maintenance visit is due.", status: "live" },
  { name: "Inventory management", summary: "What's on hand, what's low, what a job actually used.", status: "live" },
  { name: "Telegram/iMessage alerts", summary: "Telegram and email from the truck. iMessage is not a public API — use those two until a Messages provider exists.", status: "live" },
];

export default function OsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="The OS"
        title="Jobs hit your phone. The page still books your regulars."
        description="City-wide work lands in Offers — Telegram or email today, not carrier SMS yet. First claim owns the quote. /b/your-name is still what you text after a call. Built for NC lawn, cleaning, HVAC, junk removal, and the other launch trades."
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
          <LinkButton href="/os/dashboard" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Open the dashboard
          </LinkButton>
          <LinkButton href="/os/offers" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Open offers
          </LinkButton>
          <LinkButton href="/os/storefront" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Customize your page
          </LinkButton>
          <LinkButton href="/os/schedule" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Open the schedule
          </LinkButton>
          <LinkButton href="/agency" className="bg-background text-foreground hover:bg-background/90">
            Rather have {siteConfig.name} run it for you?
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
