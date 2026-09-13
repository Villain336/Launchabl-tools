import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ListingCard } from "@/components/marketplace/listing-card";
import { NC_CITIES } from "@/lib/marketplace/cities";
import { listDirectory } from "@/lib/marketplace/listing";
import { TRADE_LABELS, tradesForPublicNav } from "@/lib/service-business/profile";

export const metadata: Metadata = {
  title: "North Carolina service directory",
    description: "Find lawn care, cleaning, HVAC, junk removal, plumbing, and more across North Carolina.",
  alternates: { canonical: "/nc" },
};

export default async function NcIndexPage() {
  const listings = await listDirectory();
  return (
    <Container className="py-16">
      <SectionHeading eyebrow="North Carolina" title="Every city and trade we cover" description="Starting with founding listings we already work with. Each contractor page is a customizable storefront." />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.slug} listing={listing} />
        ))}
      </div>
      <div className="mt-12 flex flex-wrap gap-2">
        {NC_CITIES.map((city) => (
          <Link key={city.slug} href={`/nc/${city.slug}`} className="rounded-full border border-border px-3 py-1.5 text-sm">
            {city.name}
          </Link>
        ))}
        {tradesForPublicNav().map((trade) => (
          <Link key={trade} href={`/nc/greensboro/${trade}`} className="rounded-full border border-border px-3 py-1.5 text-sm">
            {TRADE_LABELS[trade]}
          </Link>
        ))}
      </div>
    </Container>
  );
}
