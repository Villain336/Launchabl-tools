import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/agency-badge";
import { LinkButton } from "@/components/ui/agency-button";
import { caseStudies, getCaseStudyBySlug } from "@/lib/case-studies";
import { toolClusters } from "@/lib/site-config";

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};
  return { title: study.client, description: study.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  const cluster = toolClusters.find((c) => c.slug === study.toolCluster);

  return (
    <Container className="py-16 sm:py-24">
      <Link href="/case-studies" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> All case studies
      </Link>

      <div className="mt-6 max-w-2xl">
        {cluster && <Badge tone="info">{cluster.name}</Badge>}
        <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{study.client}</h1>
        <p className="mt-1 text-sm uppercase tracking-wide text-slate-500">{study.industry}</p>
        <p className="mt-6 text-lg text-slate-600">{study.summary}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <blockquote className="rounded-2xl bg-slate-50 p-8 text-lg italic text-slate-700">
            &ldquo;{study.quote.text}&rdquo;
            <footer className="mt-4 text-sm font-medium not-italic text-slate-500">
              — {study.quote.author}
            </footer>
          </blockquote>
        </div>
        <div className="rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-4xl font-bold text-indigo-600">{study.metric.value}</p>
          <p className="mt-2 text-sm text-slate-500">{study.metric.label}</p>
        </div>
      </div>

      <div className="mt-16 rounded-3xl bg-indigo-600 p-10 text-center text-white">
        <h3 className="text-2xl font-bold">Want a result like this?</h3>
        <div className="mt-6 flex justify-center gap-4">
          <LinkButton href="/tools" variant="secondary">
            Start with a free tool
          </LinkButton>
          <LinkButton href="/pricing" className="bg-white text-indigo-700 hover:bg-indigo-50">
            See the unlimited plan
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
