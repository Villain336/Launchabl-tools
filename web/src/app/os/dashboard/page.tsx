import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpsWorkspace } from "@/components/service-business/ops-workspace";

export const metadata: Metadata = {
  title: "OS dashboard",
  description: "Leads, jobs, estimates, payments, and this month's allotment.",
  alternates: { canonical: "/os/dashboard" },
};

export default function OsDashboardPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading eyebrow="OS" title="Revenue and the job book" description="Leads from the directory land here. Turn them into jobs, send an estimate, record the payment." />
      <div className="mt-10">
        <OpsWorkspace />
      </div>
    </Container>
  );
}
