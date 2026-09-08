"use client";

import Link from "next/link";
import { CometCard } from "@/components/ui/comet-card";
import type { CaseStudy } from "@/lib/case-studies";
import { toolClusters } from "@/lib/site-config";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  const cluster = toolClusters.find((c) => c.slug === study.toolCluster);

  return (
    <CometCard className="h-full">
      <Link
        href={`/case-studies/${study.slug}`}
        className="flex h-full w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#1F2121] p-2 md:p-3"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="mx-2 flex-1">
          <div className="relative mt-2 aspect-[4/5] w-full overflow-hidden rounded-[16px] bg-black">
            <img
              src="/brand/logo.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="text-3xl font-bold tabular-nums text-[#FF6600]">{study.metric.value}</p>
              <p className="mt-1 text-xs text-white/80">{study.metric.label}</p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-shrink-0 items-start justify-between gap-3 p-4 font-sans text-white">
          <div>
            <p className="text-sm font-semibold">{study.client}</p>
            <p className="mt-0.5 text-xs text-neutral-400">{study.industry}</p>
          </div>
          {cluster && (
            <p className="max-w-[8rem] text-right text-[10px] uppercase tracking-wide text-[#FFB800]">
              {cluster.name}
            </p>
          )}
        </div>
      </Link>
    </CometCard>
  );
}
