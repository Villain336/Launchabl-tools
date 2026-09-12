import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { AutomationsList } from "@/components/schedules/automations-list";

export const metadata: Metadata = {
  title: "Automations",
  description: "Scheduled jobs that run on their own and deliver a report page and an email each time.",
  robots: { index: false },
};

export default function AutomationsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading
        eyebrow="Automations"
        title="Jobs that run without you."
        description="Weekly site health checks, monthly content calendars, daily competitor watches — every run becomes a report page and lands in your inbox."
      />
      <div className="mx-auto mt-8 max-w-4xl">
        <AutomationsList />
      </div>
    </Container>
  );
}
