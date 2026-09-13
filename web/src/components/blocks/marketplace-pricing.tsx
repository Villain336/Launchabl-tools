import Link from "next/link";
import { AGENCY_PACKAGES, LEAD_TIERS } from "@/lib/marketplace/pricing";
import { Container } from "@/components/ui/container";

export function MarketplacePricing() {
  const cards = [
    { name: "Directory listing", price: "Free", note: `${LEAD_TIERS.listing.monthlyLeads} leads / month`, href: "/os/storefront" },
    { name: LEAD_TIERS.os.label, price: `$${LEAD_TIERS.os.priceMonthly}/mo`, note: `${LEAD_TIERS.os.monthlyLeads} leads / month`, href: "/os" },
    { name: LEAD_TIERS["os-plus"].label, price: `$${LEAD_TIERS["os-plus"].priceMonthly}/mo`, note: `${LEAD_TIERS["os-plus"].monthlyLeads} leads / month`, href: "/os" },
    { name: AGENCY_PACKAGES.launch.label, price: `$${AGENCY_PACKAGES.launch.price.toLocaleString()}`, note: "one-time setup", href: "/agency" },
    { name: AGENCY_PACKAGES["managed-growth"].label, price: `$${AGENCY_PACKAGES["managed-growth"].price}/mo`, note: `${LEAD_TIERS.managed.monthlyLeads} leads / month + done-for-you`, href: "/agency" },
  ];
  return (
    <section className="border-t border-border py-16">
      <Container>
        <h2 className="font-heading text-3xl font-bold">Directory, OS, and agency</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Subscription tiers buy lead volume, never quality. Every delivered lead is the same kind of request. Tools Pro and credit packs below stay for the compute-heavy tools.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
