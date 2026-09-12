"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Link2, Mail, Megaphone, Recycle, UsersRound, XCircle } from "lucide-react";
import type { PersonaDeliverable, PressReleaseDeliverable, RepurposeDeliverable, SubjectLinesDeliverable, TestPlanDeliverable, UtmDeliverable } from "@/lib/ai/tools/growth-kits";
import { utmCsv } from "@/lib/marketing/utm";
import { MOBILE_VISIBLE } from "@/lib/marketing/subject-lines";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, Pill, ScoreRing, Tabs, shorten, type Tone } from "@/components/tools/chat/bits";
import { Markdown } from "@/components/tools/chat/markdown";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";

function WarningList({ items, className = "" }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <ul className={`space-y-1 ${className}`}>
      {items.map((w, i) => (
        <li key={i} className="flex items-start gap-1.5 text-[12px] text-ink-2">
          <AlertTriangle className="mt-[2px] h-3 w-3 shrink-0 text-orange" /> {w}
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
        {action}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Bullets({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-1 text-[12.5px] leading-relaxed text-ink ${className}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" /> <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── UTM links ───────────────────────────────────────── */

export function UtmArtifact({ data }: { data: UtmDeliverable }) {
  const all = data.rows.map((r) => `${r.label}\n${r.url}`).join("\n\n");
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-utm-artifact>
      <ArtifactHeader icon={<Link2 className="h-4 w-4" />} title={`${data.rows.length} tracked link${data.rows.length === 1 ? "" : "s"} · ${data.campaign}`} subtitle={shorten(data.baseUrl)}>
        <CopyButton text={all} label="Copy all" />
        <DownloadButton content={utmCsv(data)} filename={`${slugify(data.campaign)}-utm-links.csv`} type="text/csv" label="CSV" />
      </ArtifactHeader>
      <div className="divide-y divide-line">
        {data.rows.map((row, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-ink">{row.label}</p>
                  <Pill t="muted">{row.params.utm_source}</Pill>
                  <Pill t="muted">{row.params.utm_medium}</Pill>
                  {row.params.utm_content && <Pill t="muted">{row.params.utm_content}</Pill>}
                  {row.params.utm_term && <Pill t="muted">{row.params.utm_term}</Pill>}
                </div>
                <p className="mt-1 font-mono text-[11.5px] break-all text-ink-2">{row.url}</p>
                <WarningList items={row.warnings} className="mt-1.5" />
              </div>
              <CopyButton text={row.url} />
            </div>
          </div>
        ))}
      </div>
      {(data.warnings.length > 0 || data.notes) && (
        <div className="border-t border-line bg-field/40 px-4 py-3">
          <WarningList items={data.warnings} />
          {data.notes && <p className={`text-[12px] text-ink-2 ${data.warnings.length ? "mt-2" : ""}`}>{data.notes}</p>}
        </div>
      )}
      <Footnote icon={<CheckCircle2 className="h-3 w-3" />}>
        Convention: {data.convention.case}, {data.convention.separator === "_" ? "underscores" : data.convention.separator} · campaign pattern {data.convention.campaignPattern.split("  ")[0]}
      </Footnote>
    </div>
  );
}

/* ── Personas ────────────────────────────────────────── */

function personaToText(p: PersonaDeliverable["personas"][number]): string {
  return [
    `${p.name} — ${p.role} (${p.priority}, ${p.buyingRole})`,
    p.snapshot,
    `Goals: ${p.goals.join("; ")}`,
    `Pains: ${p.pains.join("; ")}`,
    `Triggers: ${p.triggers.join("; ")}`,
    `Objections: ${p.objections.map((o) => `${o.objection} → ${o.response}`).join(" | ")}`,
    `Channels: ${p.channels.join(", ")}`,
    `Hook: ${p.messaging.hook}`,
    `Value props: ${p.messaging.valueProps.join("; ")}`,
    `Proof: ${p.messaging.proof.join("; ")}`,
    `Use: ${p.messaging.wordsToUse.join(", ")} · Avoid: ${p.messaging.wordsToAvoid.join(", ")}`,
    `Success: ${p.successMetric}`,
  ].join("\n");
}

function personasToMarkdown(d: PersonaDeliverable): string {
  const lines = [`# ICP & personas — ${d.product.name}`, "", d.product.oneLiner, "", "## Ideal customer profile", "", d.icp.summary, "", ...d.icp.firmographics.map((f) => `- **${f.attribute}:** ${f.value}`), "", "**Qualifiers**", ...d.icp.qualifiers.map((q) => `- ${q}`), "", "**Disqualifiers**", ...d.icp.disqualifiers.map((q) => `- ${q}`), ""];
  for (const p of d.personas) {
    lines.push(`## ${p.name} — ${p.role}`, "", `_${p.priority} · ${p.buyingRole}_`, "", p.snapshot, "", "**Goals**", ...p.goals.map((g) => `- ${g}`), "", "**Pains**", ...p.pains.map((g) => `- ${g}`), "", "**Triggers**", ...p.triggers.map((g) => `- ${g}`), "", "**Objections**", ...p.objections.map((o) => `- ${o.objection} — _${o.response}_`), "", "**Channels**", ...p.channels.map((g) => `- ${g}`), "", "**Messaging**", `- Hook: ${p.messaging.hook}`, ...p.messaging.valueProps.map((v) => `- ${v}`), `- Proof: ${p.messaging.proof.join("; ")}`, `- Use: ${p.messaging.wordsToUse.join(", ")}`, `- Avoid: ${p.messaging.wordsToAvoid.join(", ")}`, "", `**Success metric:** ${p.successMetric}`, "");
  }
  lines.push("## Anti-persona", "", d.antiPersona.description, "", d.antiPersona.why, "", "## Notes", "", d.notes);
  return lines.join("\n");
}

export function PersonasArtifact({ data }: { data: PersonaDeliverable }) {
  const tabs = useMemo(() => [{ key: "icp", label: "ICP" }, ...data.personas.map((p, i) => ({ key: `p${i}`, label: p.name.split(" ").slice(-1)[0] || `Persona ${i + 1}` })), { key: "anti", label: "Anti-persona" }], [data.personas]);
  const [tab, setTab] = useState<string>(data.personas.length ? "p0" : "icp");
  const persona = tab.startsWith("p") ? data.personas[Number(tab.slice(1))] : null;

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-personas-artifact>
      <ArtifactHeader icon={<UsersRound className="h-4 w-4" />} title={`${data.personas.length} personas · ${data.product.name}`} subtitle={data.product.oneLiner}>
        <DownloadButton content={personasToMarkdown(data)} filename={`${slugify(data.product.name)}-personas.md`} type="text/markdown" label="Markdown" />
      </ArtifactHeader>
      <div className="overflow-x-auto border-b border-line px-4 py-2">
        <Tabs value={tab} onChange={setTab} options={tabs} />
      </div>

      {tab === "icp" && (
        <div className="divide-y divide-line">
          <Section label="Who buys" action={<CopyButton text={data.icp.summary} />}>
            <p className="text-[13px] leading-relaxed text-ink">{data.icp.summary}</p>
          </Section>
          <Section label="Firmographics">
            <dl className="grid gap-x-4 gap-y-1 text-[12.5px] sm:grid-cols-2">
              {data.icp.firmographics.map((f) => (
                <div key={f.attribute} className="flex gap-2">
                  <dt className="w-28 shrink-0 text-ink-3">{f.attribute}</dt>
                  <dd className="text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
            <Section label="Qualifiers">
              <Bullets items={data.icp.qualifiers} />
            </Section>
            <Section label="Disqualifiers">
              <Bullets items={data.icp.disqualifiers} />
            </Section>
          </div>
        </div>
      )}

      {persona && (
        <div className="divide-y divide-line">
          <div className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-ink">{persona.name}</p>
              <Pill t={persona.priority === "primary" ? "warn" : "muted"}>{persona.priority}</Pill>
              <Pill t="info">{persona.buyingRole}</Pill>
              <span className="ml-auto">
                <CopyButton text={personaToText(persona)} label="Copy persona" />
              </span>
            </div>
            <p className="text-[12.5px] text-ink-2">{persona.role}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink">{persona.snapshot}</p>
          </div>
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
            <Section label="Goals">
              <Bullets items={persona.goals} />
            </Section>
            <Section label="Pains">
              <Bullets items={persona.pains} />
            </Section>
          </div>
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
            <Section label="Buying triggers">
              <Bullets items={persona.triggers} />
            </Section>
            <Section label="Where they are">
              <Bullets items={persona.channels} />
            </Section>
          </div>
          <Section label="Objections & answers">
            <div className="space-y-2">
              {persona.objections.map((o, i) => (
                <div key={i} className="rounded-[8px] bg-field/60 px-3 py-2 text-[12.5px]">
                  <p className="font-medium text-ink">“{o.objection}”</p>
                  <p className="mt-0.5 text-ink-2">{o.response}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section label="Messaging" action={<CopyButton text={`${persona.messaging.hook}\n\n${persona.messaging.valueProps.join("\n")}`} />}>
            <p className="text-[14px] font-semibold leading-snug text-ink">{persona.messaging.hook}</p>
            <Bullets items={persona.messaging.valueProps} className="mt-2" />
            <p className="mt-2 text-[12px] text-ink-2">
              <span className="font-medium text-ink">Proof:</span> {persona.messaging.proof.join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {persona.messaging.wordsToUse.map((w) => (
                <Pill key={`u-${w}`} t="good">
                  {w}
                </Pill>
              ))}
              {persona.messaging.wordsToAvoid.map((w) => (
                <Pill key={`a-${w}`} t="bad">
                  {w}
                </Pill>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-ink-2">
              <span className="font-medium text-ink">Success looks like:</span> {persona.successMetric}
            </p>
          </Section>
        </div>
      )}

      {tab === "anti" && (
        <div className="divide-y divide-line">
          <Section label="Looks like a fit, isn't">
            <p className="text-[13px] leading-relaxed text-ink">{data.antiPersona.description}</p>
          </Section>
          <Section label="Why to walk away">
            <p className="text-[13px] leading-relaxed text-ink">{data.antiPersona.why}</p>
          </Section>
        </div>
      )}

      {data.notes && <Footnote icon={<AlertTriangle className="h-3 w-3" />}>{data.notes}</Footnote>}
    </div>
  );
}

/* ── Subject lines ───────────────────────────────────── */

const severityTone: Record<"high" | "medium" | "low", Tone> = { high: "bad", medium: "warn", low: "muted" };

export function SubjectLinesArtifact({ data }: { data: SubjectLinesDeliverable }) {
  const sorted = useMemo(() => data.results.map((r, i) => ({ ...r, index: i })).sort((a, b) => b.score - a.score), [data.results]);
  const [open, setOpen] = useState<number | null>(data.bestIndex);
  const best = data.results[data.bestIndex];

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-subject-lines-artifact>
      <ArtifactHeader icon={<Mail className="h-4 w-4" />} title={`${data.results.length} subject line${data.results.length === 1 ? "" : "s"} scored`} subtitle={data.context ?? `Best: “${best?.line}”`}>
        <CopyButton text={sorted.map((r) => `${r.score}  ${r.label}: ${r.line}${r.previewText ? ` — ${r.previewText}` : ""}`).join("\n")} label="Copy ranking" />
      </ArtifactHeader>
      <div className="divide-y divide-line">
        {sorted.map((r) => {
          const isOpen = open === r.index;
          const visible = [...r.line].slice(0, MOBILE_VISIBLE).join("");
          const clipped = [...r.line].slice(MOBILE_VISIBLE).join("");
          return (
            <div key={r.index} className={`px-4 py-3 ${r.index === data.bestIndex ? "bg-green-tint/40" : ""}`}>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setOpen(isOpen ? null : r.index)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ScoreRing score={r.score} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill t={r.index === data.bestIndex ? "good" : "muted"}>{r.label}</Pill>
                      <span className="text-[11px] text-ink-3">
                        {r.length} chars · {r.words} words
                      </span>
                      {r.traits.map((t) => (
                        <Pill key={t} t="info">
                          {t}
                        </Pill>
                      ))}
                    </div>
                    <p className="mt-1 text-[14px] font-semibold leading-snug text-ink">
                      {visible}
                      {clipped && <span className="text-ink-3 line-through decoration-ink-3/50">{clipped}</span>}
                    </p>
                    {r.previewText && <p className="truncate text-[12.5px] text-ink-2">{r.previewText}</p>}
                  </div>
                </button>
                <CopyButton text={r.previewText ? `${r.line}\n${r.previewText}` : r.line} />
              </div>
              {isOpen && (
                <ul className="mt-2 space-y-1 pl-[52px]">
                  {r.flags.length === 0 && <li className="text-[12px] text-green">No flags — clean as far as the checks go.</li>}
                  {r.flags.map((f) => (
                    <li key={f.id} className="flex items-start gap-1.5 text-[12px] text-ink-2">
                      <Pill t={severityTone[f.severity]} className="mt-[1px] shrink-0">
                        {f.severity}
                      </Pill>
                      <span>{f.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <Footnote icon={<CheckCircle2 className="h-3 w-3" />}>Struck-through text is what a typical mobile inbox cuts off (~{MOBILE_VISIBLE} characters). Score measures risk and clarity; the audience decides — test the top two.</Footnote>
    </div>
  );
}

/* ── Press release ───────────────────────────────────── */

export function PressReleaseArtifact({ data }: { data: PressReleaseDeliverable }) {
  const [view, setView] = useState<"preview" | "text" | "checks">("preview");
  const failing = data.checks.filter((c) => !c.ok).length;
  const file = slugify(data.headline).slice(0, 60);
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-press-release-artifact>
      <ArtifactHeader icon={<Megaphone className="h-4 w-4" />} title={data.headline} subtitle={`${data.wordCount} words · ${data.quotes.length} quote${data.quotes.length === 1 ? "" : "s"} · ${failing === 0 ? "all checks pass" : `${failing} check${failing === 1 ? "" : "s"} to fix`}`}>
        <Tabs value={view} onChange={setView} options={[{ key: "preview", label: "Preview" }, { key: "text", label: "Plain text" }, { key: "checks", label: `Checks${failing ? ` (${failing})` : ""}` }]} />
        <CopyButton text={data.plainText} />
        <DownloadButton content={data.markdown} filename={`${file}.md`} type="text/markdown" label=".md" />
        <DownloadButton content={data.plainText} filename={`${file}.txt`} type="text/plain" label=".txt" />
      </ArtifactHeader>
      {view === "preview" && (
        <div className="prose prose-sm max-w-none px-6 py-5 prose-headings:text-ink prose-p:text-ink prose-p:leading-relaxed prose-h1:text-[22px] prose-h1:leading-tight prose-h2:text-[14px] prose-h2:tracking-wide prose-h2:uppercase prose-h2:text-ink-3">
          <Markdown text={data.markdown} />
        </div>
      )}
      {view === "text" && <pre className="max-h-[560px] overflow-auto px-5 py-4 font-sans text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink">{data.plainText}</pre>}
      {view === "checks" && (
        <ul className="divide-y divide-line">
          {data.checks.map((c) => (
            <li key={c.id} className="flex items-start gap-2 px-4 py-2.5 text-[12.5px]">
              {c.ok ? <CheckCircle2 className="mt-[2px] h-3.5 w-3.5 shrink-0 text-green" /> : <XCircle className="mt-[2px] h-3.5 w-3.5 shrink-0 text-red" />}
              <span className={c.ok ? "text-ink-2" : "text-ink"}>{c.message}</span>
            </li>
          ))}
        </ul>
      )}
      {data.notes && <Footnote icon={<AlertTriangle className="h-3 w-3" />}>{data.notes}</Footnote>}
    </div>
  );
}

/* ── QA test plan ────────────────────────────────────── */

const priorityTone: Record<string, Tone> = { P0: "bad", P1: "warn", P2: "muted" };

function csvCell(v: string | number | boolean | null | undefined) {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function testPlanCsv(plan: TestPlanDeliverable): string {
  const header = ["id", "area", "title", "priority", "type", "preconditions", "steps", "expected", "test_data", "automate", "result", "notes"];
  const rows = plan.scenarios.map((s) => [s.id, s.area, s.title, s.priority, s.type, s.preconditions ?? "", s.steps.map((st, i) => `${i + 1}. ${st}`).join("\n"), s.expected, s.testData ?? "", s.automate ? "yes" : "no", "", ""]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function testPlanMarkdown(plan: TestPlanDeliverable): string {
  const lines = [`# ${plan.title}`, "", `**Product:** ${plan.product}${plan.version ? ` · **Version:** ${plan.version}` : ""}`, "", plan.objective, "", "## Scope", ...plan.scope.map((s) => `- ${s}`), ""];
  if (plan.outOfScope.length) lines.push("## Out of scope", ...plan.outOfScope.map((s) => `- ${s}`), "");
  if (plan.assumptions.length) lines.push("## Assumptions", ...plan.assumptions.map((s) => `- ${s}`), "");
  lines.push("## Environments", "", "| Environment | Detail | Priority |", "|---|---|---|", ...plan.environments.map((e) => `| ${e.name} | ${e.detail} | ${e.priority} |`), "");
  lines.push("## Scenarios", "");
  for (const s of plan.scenarios) {
    lines.push(`### ${s.id} · ${s.title}`, "", `**Area:** ${s.area} · **Priority:** ${s.priority} · **Type:** ${s.type}${s.automate ? " · automate" : ""}`, "");
    if (s.preconditions) lines.push(`**Preconditions:** ${s.preconditions}`, "");
    if (s.testData) lines.push(`**Test data:** ${s.testData}`, "");
    lines.push(...s.steps.map((st, i) => `${i + 1}. ${st}`), "", `**Expected:** ${s.expected}`, "", "**Result:** ☐ Pass ☐ Fail", "");
  }
  lines.push("## Exit criteria", ...plan.exitCriteria.map((s) => `- ${s}`), "");
  if (plan.risks.length) lines.push("## Risks", ...plan.risks.map((r) => `- **${r.risk}** — ${r.mitigation}`), "");
  if (plan.notes) lines.push("## Notes", "", plan.notes);
  return lines.join("\n");
}

export function TestPlanArtifact({ data }: { data: TestPlanDeliverable }) {
  const areas = useMemo(() => Array.from(new Set(data.scenarios.map((s) => s.area))), [data.scenarios]);
  const [area, setArea] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"scenarios" | "plan">("scenarios");
  const visible = data.scenarios.filter((s) => (area === "all" || s.area === area) && (priority === "all" || s.priority === priority));
  const file = slugify(data.title).slice(0, 60);

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-test-plan-artifact>
      <ArtifactHeader icon={<ClipboardCheck className="h-4 w-4" />} title={data.title} subtitle={`${data.summary.total} scenarios · ${data.summary.byPriority.P0 ?? 0} P0 · ${data.summary.byPriority.P1 ?? 0} P1 · ${data.summary.byPriority.P2 ?? 0} P2 · ${data.summary.automatable} to automate`}>
        <Tabs value={view} onChange={setView} options={[{ key: "scenarios", label: "Scenarios" }, { key: "plan", label: "Plan" }]} />
        <DownloadButton content={testPlanCsv(data)} filename={`${file}.csv`} type="text/csv" label="CSV" />
        <DownloadButton content={testPlanMarkdown(data)} filename={`${file}.md`} type="text/markdown" label=".md" />
      </ArtifactHeader>

      {view === "scenarios" && (
        <>
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
            <div className="max-w-full overflow-x-auto">
              <Tabs value={area} onChange={setArea} options={[{ key: "all", label: `All (${data.scenarios.length})` }, ...areas.map((a) => ({ key: a, label: `${a} (${data.summary.byArea[a]})` }))]} />
            </div>
            <div className="ml-auto">
              <Tabs value={priority} onChange={setPriority} options={[{ key: "all", label: "Any" }, { key: "P0", label: "P0" }, { key: "P1", label: "P1" }, { key: "P2", label: "P2" }]} />
            </div>
          </div>
          <div className="divide-y divide-line">
            {visible.map((s) => {
              const isOpen = open === s.id;
              return (
                <div key={s.id} className="px-4 py-2.5">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className="w-14 shrink-0 pt-[2px] font-mono text-[11px] text-ink-3">{s.id}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{s.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Pill t={priorityTone[s.priority] ?? "muted"}>{s.priority}</Pill>
                          <Pill t="muted">{s.type}</Pill>
                          <Pill t="muted">{s.area}</Pill>
                          {s.automate && <Pill t="info">automate</Pill>}
                        </div>
                      </div>
                    </button>
                    <CopyButton text={[`${s.id} ${s.title}`, s.preconditions ? `Preconditions: ${s.preconditions}` : "", ...s.steps.map((st, i) => `${i + 1}. ${st}`), `Expected: ${s.expected}`].filter(Boolean).join("\n")} />
                  </div>
                  {isOpen && (
                    <div className="mt-2 grid gap-3 pl-[68px] text-[12.5px] sm:grid-cols-[1fr_1fr]">
                      <div>
                        {s.preconditions && (
                          <p className="mb-2 text-ink-2">
                            <span className="font-medium text-ink">Preconditions:</span> {s.preconditions}
                          </p>
                        )}
                        <ol className="space-y-1 text-ink">
                          {s.steps.map((st, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="w-4 shrink-0 text-ink-3 tabular-nums">{i + 1}.</span> <span>{st}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <p className="rounded-[8px] bg-green-tint/60 px-3 py-2 text-ink">
                          <span className="font-medium">Expected:</span> {s.expected}
                        </p>
                        {s.testData && (
                          <p className="mt-2 text-ink-2">
                            <span className="font-medium text-ink">Test data:</span> <span className="font-mono text-[11.5px]">{s.testData}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {visible.length === 0 && <p className="px-4 py-6 text-center text-[12.5px] text-ink-3">No scenarios match these filters.</p>}
          </div>
        </>
      )}

      {view === "plan" && (
        <div className="divide-y divide-line">
          <Section label="Objective">
            <p className="text-[13px] leading-relaxed text-ink">{data.objective}</p>
            <p className="mt-1 text-[12px] text-ink-3">
              {data.product}
              {data.version ? ` · ${data.version}` : ""}
            </p>
          </Section>
          <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-line">
            <Section label="In scope">
              <Bullets items={data.scope} />
            </Section>
            <Section label="Out of scope">{data.outOfScope.length ? <Bullets items={data.outOfScope} /> : <p className="text-[12.5px] text-ink-3">Nothing excluded.</p>}</Section>
          </div>
          <Section label="Environments">
            <div className="space-y-1">
              {data.environments.map((e) => (
                <div key={e.name} className="flex items-start gap-2 text-[12.5px]">
                  <Pill t={priorityTone[e.priority] ?? "muted"} className="mt-[1px] shrink-0">
                    {e.priority}
                  </Pill>
                  <span className="font-medium text-ink">{e.name}</span>
                  <span className="text-ink-2">{e.detail}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section label="Exit criteria">
            <Bullets items={data.exitCriteria} />
          </Section>
          {data.risks.length > 0 && (
            <Section label="Risks">
              <div className="space-y-1.5 text-[12.5px]">
                {data.risks.map((r, i) => (
                  <p key={i}>
                    <span className="font-medium text-ink">{r.risk}</span> <span className="text-ink-2">— {r.mitigation}</span>
                  </p>
                ))}
              </div>
            </Section>
          )}
          {data.assumptions.length > 0 && (
            <Section label="Assumptions">
              <Bullets items={data.assumptions} />
            </Section>
          )}
        </div>
      )}

      {(data.warnings.length > 0 || data.notes) && (
        <div className="border-t border-line bg-field/40 px-4 py-3">
          <WarningList items={data.warnings} />
          {data.notes && <p className={`text-[12px] text-ink-2 ${data.warnings.length ? "mt-2" : ""}`}>{data.notes}</p>}
        </div>
      )}
    </div>
  );
}

/* ── Repurposed content ──────────────────────────────── */

function pieceText(p: RepurposeDeliverable["pieces"][number]): string {
  const body = p.parts.length ? p.parts.join("\n\n") : p.body;
  return [p.title, body, p.cta, p.hashtags.length ? p.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ") : ""].filter(Boolean).join("\n\n");
}

export function RepurposeArtifact({ data }: { data: RepurposeDeliverable }) {
  const [tab, setTab] = useState<string>(data.pieces[0]?.channel ?? "source");
  const piece = data.pieces.find((p) => p.channel === tab);
  const all = data.pieces.map((p) => `## ${p.label}\n\n${pieceText(p)}`).join("\n\n---\n\n");
  const overLimit = data.pieces.filter((p) => p.warnings.length).length;

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-repurpose-artifact>
      <ArtifactHeader icon={<Recycle className="h-4 w-4" />} title={`${data.pieces.length} pieces from “${data.source.title}”`} subtitle={`${data.source.kind}${data.source.url ? ` · ${shorten(data.source.url, 50)}` : ""}${overLimit ? ` · ${overLimit} need a trim` : ""}`}>
        <CopyButton text={all} label="Copy all" />
        <DownloadButton content={`# Repurposed: ${data.source.title}\n\n${data.source.summary}\n\n---\n\n${all}`} filename={`${slugify(data.source.title).slice(0, 60)}-repurposed.md`} type="text/markdown" label=".md" />
      </ArtifactHeader>
      <div className="overflow-x-auto border-b border-line px-4 py-2">
        <Tabs value={tab} onChange={setTab} options={[...data.pieces.map((p) => ({ key: p.channel, label: p.label })), { key: "source", label: "Source" }]} />
      </div>

      {piece && (
        <div>
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
            <span className="text-[11.5px] text-ink-3">
              {piece.chars.toLocaleString()} chars{piece.parts.length ? ` · ${piece.parts.length} parts` : ""}
              {piece.bestTime ? ` · best ${piece.bestTime}` : ""}
            </span>
            {piece.warnings.length > 0 && <Pill t="warn">{piece.warnings.length} warning{piece.warnings.length === 1 ? "" : "s"}</Pill>}
            <span className="ml-auto">
              <CopyButton text={pieceText(piece)} label="Copy piece" />
            </span>
          </div>
          {piece.title && <p className="px-4 pt-2 text-[14px] font-semibold text-ink">{piece.title}</p>}
          {piece.parts.length > 0 ? (
            <ol className="space-y-2 px-4 py-3">
              {piece.parts.map((part, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 shrink-0 pt-[3px] text-[11px] text-ink-3 tabular-nums">{i + 1}</span>
                  <div className="min-w-0 flex-1 rounded-[10px] bg-field/60 px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{part}</div>
                  <span className={`w-9 shrink-0 pt-[3px] text-right text-[10.5px] tabular-nums ${[...part].length > 280 ? "text-red" : "text-ink-3"}`}>{[...part].length}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{piece.body}</p>
          )}
          {(piece.cta || piece.hashtags.length > 0 || piece.visual) && (
            <div className="space-y-1 border-t border-line px-4 py-2.5 text-[12px] text-ink-2">
              {piece.cta && (
                <p>
                  <span className="font-medium text-ink">CTA:</span> {piece.cta}
                </p>
              )}
              {piece.hashtags.length > 0 && <p className="text-primary">{piece.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}</p>}
              {piece.visual && (
                <p>
                  <span className="font-medium text-ink">Visual:</span> {piece.visual}
                </p>
              )}
            </div>
          )}
          {piece.warnings.length > 0 && (
            <div className="border-t border-line bg-field/40 px-4 py-2.5">
              <WarningList items={piece.warnings} />
            </div>
          )}
        </div>
      )}

      {tab === "source" && (
        <div className="divide-y divide-line">
          <Section label="Core argument">
            <p className="text-[13px] leading-relaxed text-ink">{data.source.summary}</p>
          </Section>
          <Section label="Key points">
            <Bullets items={data.source.keyPoints} />
          </Section>
          {data.source.quotes.length > 0 && (
            <Section label="Quotable" action={<CopyButton text={data.source.quotes.join("\n\n")} />}>
              <div className="space-y-1.5">
                {data.source.quotes.map((q, i) => (
                  <p key={i} className="border-l-2 border-primary/60 pl-3 text-[13px] leading-relaxed text-ink">
                    {q}
                  </p>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {data.notes && <Footnote icon={<AlertTriangle className="h-3 w-3" />}>{data.notes}</Footnote>}
    </div>
  );
}
