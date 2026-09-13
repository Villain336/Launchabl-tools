import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { OffersWorkspace } from "@/components/service-business/offers-workspace";

export const metadata: Metadata = {
  title: "OS offers",
  description: "Claim city-wide jobs pinged to your crew. First claim owns the quote and payment.",
  alternates: { canonical: "/os/offers" },
};

export default function OsOffersPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/offers" />
      <SectionHeading
        eyebrow="OS"
        title="Jobs pinged to your phone"
        description="A homeowner asked for this trade in your city. First crew to claim it owns the job, the quote, and the payment. Not a shared Angi lead."
      />
      <div className="mt-10">
        <OffersWorkspace />
      </div>
    </Container>
  );
}
