import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { AutomationWorkspace } from "@/components/service-business/automation-workspace";

export const metadata: Metadata = {
  title: "OS automations",
  description: "Lead follow-up, review requests, job reminders, and warranty alerts.",
  alternates: { canonical: "/os/automations" },
};

export default function OsAutomationsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/automations" />
      <SectionHeading
        eyebrow="OS"
        title="Automations and alerts"
        description="Follow-ups and reminders that fire themselves. Separate from the SEO report schedules at /automations."
      />
      <div className="mt-10">
        <AutomationWorkspace />
      </div>
    </Container>
  );
}
