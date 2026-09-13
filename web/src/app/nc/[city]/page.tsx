import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ListingCard } from "@/components/marketplace/listing-card";
import { getCity, NC_CITIES } from "@/lib/marketplace/cities";
import { listDirectoryFiltered } from "@/lib/marketplace/listing";
import { TRADE_LABELS, TRADES } from "@/lib/service-business/profile";

export function generateStaticParams() {
  return NC_CITIES.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const record = getCity(city);
  if (!record) return {};
  return {
    title: `Service businesses in ${record.name}, NC`,
    description: `Find local contractors in ${record.name}, North Carolina.`,
    alternates: { canonical: `/nc/${record.slug}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const record = getCity(city);
  if (!record) notFound();
  const listings = await listDirectoryFiltered({ city: record.slug });
  return (
    <Container className="py-16">
      <SectionHeading
        eyebrow={`${record.region} · North Carolina`}
        title={`Contractors in ${record.name}`}
        description="Request a quote on a listing. Every page is a customizable storefront for that business."
      />
      <div className="mt-6 flex flex-wrap gap-2">
        {TRADES.map((trade) => (
          <Link key={trade} href={`/nc/${record.slug}/${trade}`} className="rounded-full border border-border px-3 py-1.5 text-sm">
            {TRADE_LABELS[trade]}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.length === 0 && <p className="text-sm text-muted-foreground">No listings in {record.name} yet. Check another city, or get your business on the directory.</p>}
        {listings.map((listing) => (
          <ListingCard key={listing.slug} listing={listing} city={record.slug} />
        ))}
      </div>
    </Container>
  );
}
