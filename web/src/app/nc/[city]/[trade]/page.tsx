import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ListingCard } from "@/components/marketplace/listing-card";
import { getCity, NC_CITIES, isTradeSlug } from "@/lib/marketplace/cities";
import { listDirectoryFiltered } from "@/lib/marketplace/listing";
import { TRADE_LABELS, TRADES } from "@/lib/service-business/profile";

export function generateStaticParams() {
  return NC_CITIES.flatMap((city) => TRADES.map((trade) => ({ city: city.slug, trade })));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string; trade: string }> }): Promise<Metadata> {
  const { city, trade } = await params;
  const record = getCity(city);
  if (!record || !isTradeSlug(trade)) return {};
  const label = TRADE_LABELS[trade];
  return {
    title: `${label} in ${record.name}, NC`,
    description: `Request ${label.toLowerCase()} in ${record.name}, North Carolina.`,
    alternates: { canonical: `/nc/${record.slug}/${trade}` },
  };
}

export default async function TradeCityPage({ params }: { params: Promise<{ city: string; trade: string }> }) {
  const { city, trade } = await params;
  const record = getCity(city);
  if (!record || !isTradeSlug(trade)) notFound();
  const listings = await listDirectoryFiltered({ city: record.slug, trade });
  return (
    <Container className="py-16">
      <SectionHeading
        eyebrow={`${record.name}, NC`}
        title={`${TRADE_LABELS[trade]} in ${record.name}`}
        description="Open a storefront to send a quote request. Each request goes to that contractor only — we do not sell the same homeowner to a list of companies."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {listings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No one listed for this trade in {record.name} yet. That empty state is honest — we will not invent contractors to fill it.
          </p>
        )}
        {listings.map((listing) => (
          <ListingCard key={listing.slug} listing={listing} city={record.slug} trade={trade} />
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        <a href="/how-it-works" className="underline">
          How this is different from Angi or Thumbtack
        </a>
      </p>
    </Container>
  );
}
