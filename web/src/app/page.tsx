import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/agency-button";
import { ListingCard } from "@/components/marketplace/listing-card";
import { listDirectory } from "@/lib/marketplace/listing";
import { NC_CITIES } from "@/lib/marketplace/cities";
import { TRADE_LABELS, TRADES } from "@/lib/service-business/profile";
import { siteConfig } from "@/lib/site-config";

export default async function Home() {
  const listings = await listDirectory();

  return (
    <>
      <section className="border-b border-border bg-background py-16 sm:py-24">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">North Carolina directory</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl font-bold tracking-tight sm:text-6xl">
            Book a local crew this week. Or run the book from your phone.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Pick a weekday time and a starting price on the contractor&rsquo;s page. It lands on their job book — not a pile of &ldquo;we&rsquo;ll call you back.&rdquo; Starting with three NC businesses we already work with.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/nc/greensboro" size="lg">
              Browse Greensboro <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/os" variant="secondary" size="lg">
              The OS
            </LinkButton>
            <LinkButton href="/agency" variant="secondary" size="lg">
              Agency
            </LinkButton>
            <LinkButton href="/how-it-works" variant="secondary" size="lg">
              How it works
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl font-bold">Founding businesses</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Three listings to start. Each one has a customizable storefront — theme, colors, services, photos — like a Shopify page, built for a trade.
              </p>
            </div>
            <Link href="/nc" className="hidden text-sm font-medium underline sm:inline">
              All of NC
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border py-16">
        <Container>
          <h2 className="font-heading text-3xl font-bold">Trades and cities</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {TRADES.map((trade) => (
              <Link key={trade} href={`/nc/greensboro/${trade}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">
                {TRADE_LABELS[trade]}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {NC_CITIES.map((city) => (
              <Link key={city.slug} href={`/nc/${city.slug}`} className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-primary/40">
                {city.name}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-border bg-primary py-16 text-primary-foreground">
        <Container className="flex flex-col items-center text-center">
          <h2 className="font-heading text-3xl font-bold">Contractors: your booking link is the product</h2>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            Text it after a phone call. Put it on Google. A Saturday slot hits your phone. The OS is what you run after they book. Agency Launch is {siteConfig.price} if you want us to stand that up.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <LinkButton href="/os" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Open the OS
            </LinkButton>
            <LinkButton href="/agency" className="bg-background text-foreground hover:bg-background/90">
              Talk to the agency
            </LinkButton>
            <LinkButton href="/tools" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
              Free SEO tools
            </LinkButton>
          </div>
        </Container>
      </section>
    </>
  );
}
