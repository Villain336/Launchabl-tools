import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/agency-badge";
import { LinkButton } from "@/components/ui/agency-button";
import { Card } from "@/components/ui/card";
import { caseStudies, getCaseStudyBySlug } from "@/lib/case-studies";
import { getToolBySlug } from "@/lib/site-config";

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

  const tool = getToolBySlug(study.tool);

  return (
    <Container className="py-16 sm:py-24">
      <Link href="/case-studies" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All case studies
      </Link>

      <div className="mt-6 max-w-2xl">
        {tool && <Badge tone="info">Started with {tool.name}</Badge>}
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{study.client}</h1>
        <p className="mt-1 text-sm uppercase tracking-wide text-muted-foreground">{study.industry}</p>
        <p className="mt-6 text-lg text-muted-foreground">{study.summary}</p>
        {study.url && (
          <Link
            href={study.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {study.url.replace(/^https?:\/\//, "")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {study.image && (
        <div className="relative mt-10 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image
            src={study.image}
            alt={`${study.client} website screenshot`}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 960px, 100vw"
            priority
          />
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-8">
          <blockquote className="text-lg italic text-foreground">
            &ldquo;{study.quote.text}&rdquo;
            <footer className="mt-4 text-sm font-medium not-italic text-muted-foreground">
              — {study.quote.author}
            </footer>
          </blockquote>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-4xl font-bold text-primary">{study.metric.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{study.metric.label}</p>
        </Card>
      </div>

      <div className="mt-16 rounded-3xl bg-primary p-10 text-center text-primary-foreground">
        <h3 className="text-2xl font-bold">Want a result like this?</h3>
        <div className="mt-6 flex justify-center gap-4">
          <LinkButton href="/tools" variant="secondary" className="bg-background text-foreground hover:bg-background/90">
            Start with a free tool
          </LinkButton>
          <LinkButton href="/pricing" className="bg-background text-foreground hover:bg-background/90">
            See the unlimited plan
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
