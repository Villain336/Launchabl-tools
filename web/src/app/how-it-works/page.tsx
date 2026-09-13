import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";

const title = "How this works";
const description = "Ask for the job and we ping every available crew — first claim quotes and gets paid here. Or book a specific crew's Saturday. Not a shared Angi lead.";

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
        title="Why a local would actually use this"
        description="Nobody opens an app because leads are exclusive. They open it to get the lawn done this week — ping the trade, or grab Saturday at 9 with a crew they already know."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Ping the trade, or book a name</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            DoorDash, not Angi: we notify every available crew in that city and trade. First one to claim owns the job, sends the quote, and you pay on the same page. If you already have a name, skip the blast and take a weekday slot on their calendar. After a claim, nobody else gets your number.
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">Book a time, don&rsquo;t join a platform</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Homeowners already have Google and a neighbor. They will not &ldquo;switch to Launchabl.&rdquo; They will tap a booking link the contractor texts them, or a weekday slot on a storefront that already showed up in search. The contractor is the distribution. The page is a calendar, not a brand.
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
