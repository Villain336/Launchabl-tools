"use client";

import { ArrowRight, Clock } from "lucide-react";
import { AGENT_TEMPLATES, CATEGORY_LABEL, type AgentTemplate } from "@/lib/agent/templates";

/**
 * Job templates for the agent's empty state. Clicking one drops the brief
 * into the composer with the first [slot] selected, so the person fills in
 * their URL or brand and hits Enter.
 */
export function AgentTemplates({ onPick }: { onPick: (template: AgentTemplate) => void }) {
  return (
    <div className="w-full" data-agent-templates>
      <p className="mb-3 text-[12px] font-medium tracking-wide text-ink-3 uppercase">Start from a job</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {AGENT_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onPick(template)}
            className="group flex flex-col rounded-[12px] border border-line bg-field/60 px-4 py-3.5 text-left transition-colors duration-100 hover:border-line-strong hover:bg-field"
            data-template={template.id}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-primary">{CATEGORY_LABEL[template.category]}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-3">
                <Clock className="h-3 w-3" /> ~{template.minutes} min
              </span>
            </span>
            <span className="mt-1.5 text-[14px] font-semibold text-ink">{template.title}</span>
            <span className="mt-1 text-[12.5px] leading-snug text-ink-2">{template.outcome}</span>
            <span className="mt-3 flex flex-wrap items-center gap-1">
              {template.skills.map((skill) => (
                <span key={skill} className="rounded-chip bg-surface px-1.5 py-0.5 text-[11px] text-ink-3 shadow-card">
                  {skill}
                </span>
              ))}
              <ArrowRight className="ml-auto h-3.5 w-3.5 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
