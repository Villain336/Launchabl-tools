import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/agency-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { caseStudies } from "@/lib/case-studies";
import { toolClusters } from "@/lib/site-config";

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

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.map((study) => {
          const cluster = toolClusters.find((c) => c.slug === study.toolCluster);
          return (
            <Link key={study.slug} href={`/case-studies/${study.slug}`} className="group block h-full">
              <Card className="h-full justify-between p-6 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/30">
                <div>
                  <CardHeader className="gap-2 p-0">
                    {cluster && <Badge tone="info">{cluster.name}</Badge>}
                    <CardTitle className="mt-1 text-lg font-semibold transition-colors group-hover:text-primary">
                      {study.client}
                    </CardTitle>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{study.industry}</p>
                    <CardDescription>{study.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <p className="text-2xl font-bold text-primary">{study.metric.value}</p>
                    <p className="text-xs text-muted-foreground">{study.metric.label}</p>
                  </CardContent>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Read case study <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
