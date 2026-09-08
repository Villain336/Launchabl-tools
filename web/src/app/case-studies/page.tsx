import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { caseStudies } from "@/lib/case-studies";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Illustrative examples of how the tools and the unlimited plan work together.",
};

export default function CaseStudiesPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Proof, not just promises"
        title="Case studies"
        description="Illustrative examples, tagged by which tool cluster kicked things off and the metric that mattered most."
      />

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study) => (
          <CaseStudyCard key={study.slug} study={study} />
        ))}
      </div>
    </Container>
  );
}
