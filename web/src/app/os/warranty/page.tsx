import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { WarrantyWorkspace } from "@/components/service-business/warranty-workspace";

export const metadata: Metadata = {
  title: "OS warranty",
  description: "Coverage dates and maintenance reminders for completed work.",
  alternates: { canonical: "/os/warranty" },
};

export default function OsWarrantyPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/warranty" />
      <SectionHeading
        eyebrow="OS"
        title="Warranty and maintenance"
        description="Know what's still covered and when the next visit is due. Reminders fire from Automations."
      />
      <div className="mt-10">
        <WarrantyWorkspace />
      </div>
    </Container>
  );
}
