import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { ScheduleWorkspace } from "@/components/service-business/schedule-workspace";

export const metadata: Metadata = {
  title: "OS schedule",
  description: "Book jobs with drive time, duration, and crew conflicts.",
  alternates: { canonical: "/os/schedule" },
};

export default function OsSchedulePage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/schedule" />
      <SectionHeading
        eyebrow="OS"
        title="The job book"
        description="Schedule accounts for drive time, job length, and whether that crew member is already booked."
      />
      <div className="mt-10">
        <ScheduleWorkspace />
      </div>
    </Container>
  );
}
