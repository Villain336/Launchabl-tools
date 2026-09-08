"use client";

import { motion } from "motion/react";
import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import type { SkillResult } from "@/lib/deliverable";
import { SourceChip } from "@/components/tools/source-chip";

const statusIcon = {
  queued: <CircleDashed className="h-4 w-4 text-muted-foreground" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  done: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  failed: <XCircle className="h-4 w-4 text-red-600" />,
};

export function SkillTimeline({ log }: { log: SkillResult[] }) {
  if (log.length === 0) {
    return <p className="text-sm text-muted-foreground">Waiting to run…</p>;
  }

  return (
    <ol className="space-y-2">
      {log.map((skill, index) => (
        <motion.li
          key={skill.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="rounded-xl border border-border bg-white p-3"
        >
          <div className="flex items-start gap-2">
            <span className="mt-0.5">{statusIcon[skill.status]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{skill.label}</p>
              {skill.detail && (
                <p className="mt-0.5 text-xs text-muted-foreground">{skill.detail}</p>
              )}
              {skill.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skill.sources.map((source) => (
                    <SourceChip key={`${source.kind}-${source.retrievedAt}-${source.note}`} source={source} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
