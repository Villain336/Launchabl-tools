import Link from "next/link";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { caseStudies } from "@/lib/case-studies";

export default function TestimonialsBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-20 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-block rounded-md border border-border px-3 py-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Case studies
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Proof, not just promises
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Illustrative examples of how the free tools and the unlimited plan work together.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link href="/case-studies" className="text-sm font-medium text-primary hover:underline">
            See all case studies
          </Link>
        </p>
      </div>
    </section>
  );
}
