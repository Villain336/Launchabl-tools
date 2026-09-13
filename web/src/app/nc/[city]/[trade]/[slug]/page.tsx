import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontView } from "@/components/marketplace/storefront-view";
import { getCity, isTradeSlug } from "@/lib/marketplace/cities";
import { FOUNDING_LISTINGS } from "@/lib/marketplace/founding";
import { getListingForPublicPage, listingPath } from "@/lib/marketplace/listing";
import { siteConfig } from "@/lib/site-config";
import { TRADE_LABELS } from "@/lib/service-business/profile";

export function generateStaticParams() {
  return FOUNDING_LISTINGS.flatMap((listing) =>
    listing.cities.flatMap((city) => listing.trades.map((trade) => ({ city, trade, slug: listing.slug }))),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ city: string; trade: string; slug: string }> }): Promise<Metadata> {
  const { city, trade, slug } = await params;
  if (!isTradeSlug(trade)) return {};
  const listing = await getListingForPublicPage(city, trade, slug);
  if (!listing) return {};
  const record = getCity(city);
  const title = `${listing.name} — ${TRADE_LABELS[trade]} in ${record?.name ?? city}, NC`;
  const description = listing.storefront.tagline || listing.storefront.about.slice(0, 160);
  const path = listingPath(listing, city, trade);
  return {
    title: listing.name,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ city: string; trade: string; slug: string }> }) {
  const { city, trade, slug } = await params;
  if (!getCity(city) || !isTradeSlug(trade)) notFound();
  const listing = await getListingForPublicPage(city, trade, slug);
  if (!listing) notFound();
  const record = getCity(city);
  const path = listingPath(listing, city, trade);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: listing.name,
    url: `${siteConfig.url}${path}`,
    telephone: listing.phone || undefined,
    address: listing.address
      ? { "@type": "PostalAddress", streetAddress: listing.address, addressLocality: record?.name, addressRegion: "NC", addressCountry: "US" }
      : undefined,
    areaServed: listing.cities.map((c) => getCity(c)?.name).filter(Boolean),
    description: listing.storefront.about || listing.storefront.tagline,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StorefrontView listing={listing} city={city} trade={trade} sourcePath={path} />
    </>
  );
}
