import { notFound, redirect } from "next/navigation";
import { getListing, listingPath } from "@/lib/marketplace/listing";

export default async function ShortListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing || !listing.storefront.published) notFound();
  redirect(listingPath(listing));
}
