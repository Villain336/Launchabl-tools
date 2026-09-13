import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";

const title = "How this works";
const description = "Quote requests go to one contractor. Reviews only exist after completed work. We do not invent stars or sell the same homeowner five ways.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/how-it-works" },
  openGraph: { type: "website", url: "/how-it-works", title, description },
};

export default function HowItWorksPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Trust"
        title="What we will not copy from Angi, Jobber, or a generic CRM"
        description="The directory is small on purpose. The OS is thinner than ServiceTitan. The only things we will not compromise are exclusive leads and reviews that require a real job."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Exclusive quote requests</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Angi&rsquo;s own pro agreement says a lead is frequently sent to several other approved pros. Thumbtack shows a list and charges when a homeowner contacts more than one. Here, the form on a storefront goes to that listing only. City pages do not silently assign you to whoever is first in the grid.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Reviews require completed work</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Directories win on star volume. We will lose that comparison for a long time. A review cannot be created unless the job is marked completed in the OS and the homeowner has a private link. Empty is honest. Invented five-stars are how this project already burned trust once.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Rank is completed jobs, not ad spend</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Subscriptions buy more exclusive leads, never a better slot on the city page. Listings with recorded completed work sort above empty ones. We do not sell “featured” placement — that is how a directory becomes a worse Yellow Pages.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Three legs, one NC market</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Jobber and Housecall Pro do not run a consumer directory. Angi does not run the contractor&rsquo;s job book. A generic CRM has neither. The agency exists to put real NC contractors on the directory this week, not after a marketplace fairy tale.
          </p>
        </article>
      </div>

      <div className="mt-12 max-w-2xl space-y-4 text-sm leading-7 text-muted-foreground">
        <p>
          We are not a unicorn today. Angi reported hundreds of millions in revenue in the first half of 2026 and says homeowners have used its network for more than 300 million projects. ServiceTitan, Housecall Pro, and Jobber own field-service software. Copying their feature lists is how a five-day-old product dies.
        </p>
        <p>
          What can compound: North Carolina density, exclusive demand, and a public record of work that actually happened in the OS. That is slower than buying leads. It is also the only shape the incumbents do not already sell.
        </p>
        <p>
          Read the full comparison in the strategy doc internally. Publicly:{" "}
          <Link href="/nc" className="underline">
            browse the directory
          </Link>
          ,{" "}
          <Link href="/os" className="underline">
            open the OS
          </Link>
          , or{" "}
          <Link href="/agency" className="underline">
            talk to the agency
          </Link>
          .
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton href="/nc">Browse NC</LinkButton>
        <LinkButton href="/os" variant="secondary">
          The OS
        </LinkButton>
      </div>
    </Container>
  );
}
