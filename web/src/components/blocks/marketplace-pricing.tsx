import Link from "next/link";
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";
import { Container } from "@/components/ui/container";

export function MarketplacePricing() {
  const cards = [
    { name: "Directory listing", price: "Free", note: "Brochure only — cannot claim pings", href: "/os/storefront" },
    { name: AGENCY_PACKAGES.network.label, price: `$${AGENCY_PACKAGES.network.price}/mo`, note: `DoorDash seat after day 90 · ${LEAD_TIERS.network.monthlyLeads} leads + pings`, href: "/agency" },
    { name: AGENCY_PACKAGES.launch.label, price: `$${AGENCY_PACKAGES.launch.price.toLocaleString()}`, note: "one-time — 90 days of Network included", href: "/agency/start" },
    { name: AGENCY_PACKAGES["managed-growth"].label, price: `$${AGENCY_PACKAGES["managed-growth"].price}/mo`, note: `We sit on the asks · Network included · ${LEAD_TIERS.managed.monthlyLeads} leads`, href: "/agency" },
  ];
  return (
    <section className="border-t border-border py-16">
      <Container>
        <h2 className="font-heading text-3xl font-bold">Build, Network, Run</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          We build the business and sit on the neighborhood asks. Build includes 90 days of Network. After that, staying on the ping board is $99/month — not a fee per ping. Tools Pro and credit packs below stay for the compute-heavy tools.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link key={card.name} href={card.href} className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40">
              <p className="text-sm font-medium text-muted-foreground">{card.name}</p>
              <p className="mt-2 text-2xl font-bold">{card.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
