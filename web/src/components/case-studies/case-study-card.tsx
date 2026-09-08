"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CometCard } from "@/components/ui/comet-card";
import type { CaseStudy } from "@/lib/case-studies";
import { toolClusters } from "@/lib/site-config";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const cluster = toolClusters.find((c) => c.slug === study.toolCluster);
  const imageSrc = study.image ?? "/brand/logo.jpg";

  return (
    <CometCard className="h-full">
      <div
        className="flex h-full w-full flex-col items-stretch rounded-[16px] border border-neutral-200 bg-white p-2 md:p-3"
        style={{ transformStyle: "preserve-3d" }}
      >
        <Link href={`/case-studies/${study.slug}`} className="mx-2 flex-1">
          <div className="relative mt-2 aspect-[4/3] w-full overflow-hidden rounded-[16px] bg-white">
            <Image
              src={imageSrc}
              alt={`${study.client} website`}
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 40vw, 90vw"
            />
          </div>
        </Link>
        <div className="mt-2 flex flex-shrink-0 flex-col gap-2 p-4 font-sans text-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link href={`/case-studies/${study.slug}`} className="text-sm font-semibold hover:text-primary">
                {study.client}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{study.industry}</p>
            </div>
            {cluster && (
              <p className="max-w-[8rem] text-right text-[10px] uppercase tracking-wide text-primary">
                {cluster.name}
              </p>
            )}
          </div>
          <p className="line-clamp-3 text-sm text-muted-foreground">{study.summary}</p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <p className="text-xs font-medium text-primary">
              {study.metric.value}
              <span className="ml-1 font-normal text-muted-foreground">{study.metric.label}</span>
            </p>
            {study.url && (
              <a
                href={study.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground hover:text-primary"
              >
                Visit site <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </CometCard>
  );
}
