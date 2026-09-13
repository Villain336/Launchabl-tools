import Link from "next/link";
import { cityLabel, listingPath, type PublicListing } from "@/lib/marketplace/listing";
import { TRADE_LABELS } from "@/lib/service-business/profile";

export function ListingCard({ listing, city, trade }: { listing: PublicListing; city?: string; trade?: string }) {
  const href = listingPath(listing, city, trade);
  const where = listing.cities.map(cityLabel).join(" · ");
  const what = listing.trades.map((t) => TRADE_LABELS[t]).join(", ");
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{listing.name}</h3>
        {listing.placeholder && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Founding
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{listing.storefront.tagline || what}</p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">{where}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {listing.licensed && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">Licensed</span>}
        {listing.insured && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">Insured</span>}
        {listing.bonded && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">Bonded</span>}
        {listing.proof.completedJobs > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">{listing.proof.completedJobs} jobs completed</span>
        )}
      </div>
    </Link>
  );
}
