import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { InventoryWorkspace } from "@/components/service-business/inventory-workspace";

export const metadata: Metadata = {
  title: "OS inventory",
  description: "What's on hand, what's low, and what a job used.",
  alternates: { canonical: "/os/inventory" },
};

export default function OsInventoryPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/inventory" />
      <SectionHeading eyebrow="OS" title="Inventory" description="Track parts and materials. Quantity never goes below zero — if it's not on the truck, the job can't consume it." />
      <div className="mt-10">
        <InventoryWorkspace />
      </div>
    </Container>
  );
}
