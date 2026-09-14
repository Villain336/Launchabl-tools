import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AgencyStartForm } from "@/components/agency/agency-start-form";
import { AGENCY_MODEL } from "@/lib/service-business/agency-model";
import { siteConfig } from "@/lib/site-config";

const title = "Start Build, Network, or Run";
const description =
  "Tell us the business, the city, and the trade. A person reads it. Build is $1,200 with 90 days of Network. Live in 14 days or Build is refunded.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/agency/start" },
  openGraph: { type: "website", url: "/agency/start", title, description },
};

export default function AgencyStartPage() {
  return (
    <Container className="py-16 sm:py-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start">
        <div>
          <SectionHeading
            eyebrow="Agency intake"
            title="City, trade, and how work shows up today."
            description="We will not invent a crew on your city page. If Run is the wrong promise because we cannot sit on those neighborhood asks yet, we will sell Build instead."
          />
          <ul className="mt-8 max-w-xl space-y-3 text-sm leading-6 text-muted-foreground">
            <li>— {AGENCY_MODEL.guarantee}</li>
            <li>— Build includes {AGENCY_MODEL.buildIncludesNetworkDays} days of Network, then ${AGENCY_MODEL.networkUsd}/month.</li>
            <li>— Run is ${AGENCY_MODEL.runUsd}/month and includes Network. One city, one trade.</li>
            <li>
              — Prefer a tool first?{" "}
              <Link href={siteConfig.freeAudit.href} className="underline">
                Free website audit
              </Link>
              , no account.
            </li>
          </ul>
        </div>
        <AgencyStartForm />
      </div>
    </Container>
  );
}
