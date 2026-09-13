import { cityLabel, type PublicListing } from "@/lib/marketplace/listing";
import { isTradeSlug } from "@/lib/marketplace/cities";
import { TRADE_LABELS } from "@/lib/service-business/profile";
import { LeadForm } from "./lead-form";

export function StorefrontView({
  listing,
  city,
  trade,
  sourcePath,
}: {
  listing: PublicListing;
  city: string;
  trade: string;
  sourcePath: string;
}) {
  const { storefront } = listing;
  const theme = storefront.theme;
  const wrapper =
    theme === "bold"
      ? "bg-zinc-950 text-zinc-50"
      : theme === "workshop"
        ? "bg-stone-100 text-stone-900"
        : "bg-background text-foreground";
  const muted = theme === "bold" ? "text-zinc-400" : "text-muted-foreground";
  const panel = theme === "bold" ? "border-zinc-800 bg-zinc-900" : theme === "workshop" ? "border-stone-300 bg-white" : "border-border bg-card";

  return (
    <div className={wrapper} style={{ ["--sf-accent" as string]: storefront.accent }}>
      <section className="relative overflow-hidden">
        {storefront.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={storefront.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${muted}`}>
            {isTradeSlug(trade) ? TRADE_LABELS[trade] : trade} · {cityLabel(city)}, NC
          </p>
          <div className="mt-4 flex items-center gap-4">
            {storefront.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storefront.logoUrl} alt="" className="h-14 w-14 rounded-xl object-cover" />
            )}
            <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{listing.name}</h1>
          </div>
          {storefront.tagline && <p className={`mt-4 max-w-2xl text-lg ${muted}`}>{storefront.tagline}</p>}
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
            {listing.licensed && <span className={`rounded-full border px-3 py-1 ${panel}`}>Licensed</span>}
            {listing.insured && <span className={`rounded-full border px-3 py-1 ${panel}`}>Insured</span>}
            {listing.bonded && <span className={`rounded-full border px-3 py-1 ${panel}`}>Bonded</span>}
            {storefront.yearsInBusiness && <span className={`rounded-full border px-3 py-1 ${panel}`}>{storefront.yearsInBusiness} years</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-10">
          {storefront.about && (
            <div>
              <h2 className="text-xl font-semibold">About</h2>
              <p className={`mt-3 whitespace-pre-wrap text-[15px] leading-7 ${muted}`}>{storefront.about}</p>
            </div>
          )}
          {storefront.showServices && storefront.services.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold">Services</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {storefront.services.map((service) => (
                  <li key={service.name} className={`rounded-2xl border p-4 ${panel}`}>
                    <p className="font-semibold">{service.name}</p>
                    {service.description && <p className={`mt-1 text-sm ${muted}`}>{service.description}</p>}
                    {service.priceFrom && <p className="mt-2 text-sm font-medium">From {service.priceFrom}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {storefront.showGallery && storefront.gallery.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold">Work</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {storefront.gallery.map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={photo.url} src={photo.url} alt={photo.caption} className="aspect-[4/3] w-full rounded-xl object-cover" />
                ))}
              </div>
            </div>
          )}
          {storefront.showHours && storefront.hours && (
            <div>
              <h2 className="text-xl font-semibold">Hours</h2>
              <p className={`mt-2 text-sm ${muted}`}>{storefront.hours}</p>
              {listing.address && <p className={`mt-1 text-sm ${muted}`}>{listing.address}</p>}
            </div>
          )}
        </div>
        {storefront.showLeadForm && (
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="mb-3 text-xl font-semibold">{storefront.ctaLabel}</h2>
            <LeadForm listingSlug={listing.slug} city={city} trade={trade} sourcePath={sourcePath} ctaLabel={storefront.ctaLabel} accent={storefront.accent} />
          </aside>
        )}
      </section>
    </div>
  );
}
