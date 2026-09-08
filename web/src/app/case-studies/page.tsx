import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { caseStudies } from "@/lib/case-studies";
import { toolClusters } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Real clients, real numbers — how the tools and the unlimited plan work together.",
};

export default function CaseStudiesPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Proof, not just promises"
        title="Case studies"
        description="Every case study is tagged by which tool cluster kicked things off and the metric that mattered most to that client."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study) => {
          const cluster = toolClusters.find((c) => c.slug === study.toolCluster);
          return (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              className="group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all hover:border-indigo-300 hover:shadow-md"
            >
              {cluster && <Badge tone="info">{cluster.name}</Badge>}
              <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                {study.client}
              </h3>
              <p className="text-xs uppercase tracking-wide text-slate-500">{study.industry}</p>
              <p className="mt-3 text-sm text-slate-600">{study.summary}</p>
              <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-2xl font-bold text-indigo-600">{study.metric.value}</p>
                <p className="text-xs text-slate-500">{study.metric.label}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                Read case study <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
