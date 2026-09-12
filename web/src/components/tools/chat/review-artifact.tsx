"use client";

import { ShieldCheck } from "lucide-react";
import type { ReviewResult } from "@/lib/ai/tools/review";
import { ArtifactHeader, Footnote, Pill, ScoreRing } from "@/components/tools/chat/bits";

/** The agent's self-check: independent scores per deliverable and what it fixed. */

const scoreTone = (score: number, pass: number): "good" | "warn" | "bad" => (score >= 90 ? "good" : score >= pass ? "warn" : "bad");

export function ReviewArtifact({ data }: { data: ReviewResult }) {
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-review-artifact>
      <ArtifactHeader
        icon={<ShieldCheck className="h-4 w-4" />}
        title={data.verdict === "ship" ? "Quality check passed" : "Quality check: revisions applied"}
        subtitle={`${data.reviewed} deliverable${data.reviewed === 1 ? "" : "s"} scored against the brief by an independent reviewer`}
      >
        <ScoreRing score={data.overall} size={44} />
      </ArtifactHeader>
      <ul className="divide-y divide-line">
        {data.checks.map((check, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-2.5">
            <Pill t={scoreTone(check.score, data.passMark)}>{Math.round(check.score)}</Pill>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink">{check.deliverable}</p>
              <p className="text-[12.5px] text-ink-2">{check.strengths}</p>
              {check.issue && (
                <p className="mt-1 text-[12.5px] text-ink-2">
                  <span className="font-medium text-orange">Issue · </span>
                  {check.issue}
                </p>
              )}
              {check.fix && check.score < data.passMark && (
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  <span className="font-medium text-ink">Fix · </span>
                  {check.fix}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {data.gaps.length > 0 && (
        <div className="border-t border-line bg-field/40 px-4 py-2.5">
          <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Not yet covered</p>
          <ul className="mt-1 space-y-0.5">
            {data.gaps.map((gap, i) => (
              <li key={i} className="text-[12.5px] text-ink-2">
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
      <Footnote icon={<ShieldCheck className="h-3 w-3" />}>
        Pass mark {data.passMark}. Anything below it was revised by the agent before handover. Reviewer: {data.model.split("/")[1] ?? data.model}.
      </Footnote>
    </div>
  );
}
