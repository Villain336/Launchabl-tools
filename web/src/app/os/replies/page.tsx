import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { RepliesWorkspace } from "@/components/service-business/replies-workspace";

export const metadata: Metadata = {
  title: "OS reply queue",
  description: "We draft the Nextdoor, Facebook, or GBP reply. You copy it and send it from your phone. We do not scrape and we do not post as you.",
  alternates: { canonical: "/os/replies" },
};

export default function OsRepliesPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/replies" />
      <SectionHeading
        eyebrow="Run"
        title="Copy the reply. Send it from your phone."
        description="We sit on the neighborhood asks and draft the answer. You paste it into Nextdoor, Facebook, or Google. The booking link is already in it."
      />
      <div className="mt-10">
        <RepliesWorkspace />
      </div>
    </Container>
  );
}
