import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ListingCard } from "@/components/marketplace/listing-card";
import { DispatchForm } from "@/components/marketplace/dispatch-form";
import { getCity, NC_CITIES, isTradeSlug } from "@/lib/marketplace/cities";
import { listDirectoryFiltered } from "@/lib/marketplace/listing";
import { TRADE_LABELS, TRADES, tradeMarketplacePitch } from "@/lib/service-business/profile";

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
  const availableCrews = listings.filter(
    (listing) => listing.orgId && listing.storefront.published && listing.storefront.acceptingOffers !== false,
  ).length;
  return (
    <Container className="py-16">
      <SectionHeading
        eyebrow={`${record.name}, NC`}
        title={`${TRADE_LABELS[trade]} in ${record.name}`}
        description={tradeMarketplacePitch(trade, record.name)}
      />
      <div className="mt-10 max-w-xl">
        <DispatchForm
          city={record.slug}
          trade={trade}
          tradeLabel={TRADE_LABELS[trade]}
          cityLabel={record.name}
          availableCrews={availableCrews}
        />
      </div>
      <h2 className="mt-14 text-xl font-semibold text-foreground">Or book a specific crew</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Already know who you want? Open their page and pick a weekday time.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
          How dispatch and booking work
        </a>
      </p>
    </Container>
  );
}
