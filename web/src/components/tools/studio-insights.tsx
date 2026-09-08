"use client";

import InsightCards, { type InsightPage } from "@/components/primitives/InsightCards";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="min-h-[180px] rounded-card bg-surface p-3 shadow-hairline">
      <p className="text-[12px] font-medium text-ink-2">{label}</p>
      <p className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-2 text-[12px] text-ink-3">{hint}</p>
    </div>
  );
}

export function StudioInsights() {
  const run = useDeliveryRunOrThrow();
  const output = run.output as {
    score?: number;
    url?: string;
    findings?: { passed: boolean }[];
    result?: { url?: string; findings?: { passed: boolean }[] };
    grade?: { score?: number; checks?: { passed: boolean }[] };
  } | null;
  const score = output?.score ?? output?.grade?.score;
  const url = output?.url ?? output?.result?.url ?? run.deliverable?.title;
  const findings = output?.findings ?? output?.result?.findings ?? output?.grade?.checks;
  const sources = run.deliverable?.sources ?? [];
  const skills = run.skillLog.filter((skill) => skill.status === "done").length;

  const pages: InsightPage[] = [
    {
      key: "score",
      prose: (
        <>
          This run scored{" "}
          <span className="font-medium text-ink">{score ?? "—"}</span>
          {url ? (
            <>
              {" "}
              on <span className="font-medium text-ink">{url}</span>
            </>
          ) : null}
          .
        </>
      ),
      Card: function ScorePage() {
        return (
          <StatCard
            label="Live score"
            value={score != null ? String(score) : "—"}
            hint={findings ? `${findings.filter((f) => f.passed).length} checks passed` : "Waiting on the scan"}
          />
        );
      },
      pill: "Want me to explain the misses?",
    },
    {
      key: "sources",
      prose: (
        <>
          {sources.length} live source{sources.length === 1 ? "" : "s"} are attached to this deliverable.
        </>
      ),
      Card: function SourcePage() {
        return (
          <StatCard
            label="Sources"
            value={String(sources.length)}
            hint={sources[0]?.kind ?? "No fetch yet"}
          />
        );
      },
      pill: "Show me where each finding came from",
    },
    {
      key: "skills",
      prose: <>{skills} skill{skills === 1 ? "" : "s"} finished before this review.</>,
      Card: function SkillPage() {
        return (
          <StatCard
            label="Skills done"
            value={`${skills}/${run.skillLog.length || skills}`}
            hint={run.agent?.requiredAccuracy.join(" · ") || "No extra accuracy gate"}
          />
        );
      },
      pill: "Re-run only the failed skills",
    },
  ];

  return <InsightCards pages={pages} labels={{ title: "Insights" }} />;
}
