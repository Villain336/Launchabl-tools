"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, ChevronDown, Globe, Server, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { DomainCheckToolOutput, DomainPlanDeliverable, HostingOption, HostingPlanDeliverable, StackToolOutput } from "@/lib/ai/tools/launch-kits";
import type { DomainStatus } from "@/lib/web/domains";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, Pill, type Tone } from "@/components/tools/chat/bits";

const statusTone: Record<DomainStatus, Tone> = { available: "good", taken: "bad", unknown: "warn" };
const statusLabel: Record<DomainStatus, string> = { available: "Available", taken: "Taken", unknown: "Unclear" };

function Section({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
        {action}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 text-[12.5px] leading-relaxed text-ink">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" /> <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Domain availability (tool result strip) ─────────── */

export function DomainCheckArtifact({ data }: { data: DomainCheckToolOutput }) {
  if (!data.ok) return <p className="text-[12.5px] text-red">{data.error}</p>;
  const available = data.results.filter((r) => r.status === "available").length;
  const text = data.results.map((r) => `${r.domain}\t${r.status}${r.registrar ? `\t${r.registrar}` : ""}${r.expires ? `\texpires ${r.expires}` : ""}`).join("\n");
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-domain-check>
      <ArtifactHeader icon={<Globe className="h-4 w-4" />} title={`${available} of ${data.results.length} available`} subtitle="Checked against the registries (RDAP), DNS fallback where a TLD has none">
        <CopyButton text={text} label="Copy" />
      </ArtifactHeader>
      <ul className="divide-y divide-line">
        {data.results.map((r) => (
          <li key={r.domain} className="flex flex-wrap items-center gap-2 px-4 py-2 text-[12.5px]">
            <span className="min-w-0 flex-1 font-mono font-medium text-ink">{r.domain}</span>
            <Pill t={statusTone[r.status]}>{statusLabel[r.status]}</Pill>
            <span className="w-full text-[11.5px] text-ink-3 sm:w-auto">
              {r.status === "taken" && [r.registrar, r.registered && `since ${r.registered.slice(0, 4)}`, r.expires && `expires ${r.expires}`].filter(Boolean).join(" · ")}
              {r.status !== "taken" && r.note}
              {r.flags.some((f) => /redemption|pendingDelete/i.test(f)) && <span className="ml-1 text-orange">· may drop soon</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Domain plan ─────────────────────────────────────── */

const verdictTone: Record<DomainPlanDeliverable["shortlist"][number]["verdict"], Tone> = { buy: "good", consider: "warn", skip: "muted" };

export function DomainPlanArtifact({ data }: { data: DomainPlanDeliverable }) {
  const md = [
    `# Domain plan — ${data.brand}`,
    "",
    `**Recommended:** ${data.recommended.domain} (${statusLabel[data.recommended.status]})`,
    "",
    data.recommended.why,
    "",
    data.recommended.price ? `Typical price: ${data.recommended.price}` : "",
    "",
    "## Shortlist",
    ...data.shortlist.map((s) => `- **${s.domain}** — ${s.verdict} · ${statusLabel[s.status]}${s.price ? ` · ${s.price}` : ""} — ${s.why}`),
    "",
    `**Budget:** ${data.budget}`,
    "",
    "## Ownership",
    ...data.ownership.map((o) => `- ${o}`),
    "",
    "## Where to buy",
    ...data.recommended.registrars.map((r) => `- [${r.registrar}](${r.url}) — ${r.why}`),
    "",
    "## After you buy",
    ...data.checklist.map((c, i) => `${i + 1}. **${c.step}** — ${c.detail}`),
    "",
    data.notes ? `_${data.notes}_` : "",
  ].join("\n");

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-domain-plan>
      <ArtifactHeader icon={<Globe className="h-4 w-4" />} title={`Register ${data.recommended.domain}`} subtitle={`Domain plan for ${data.brand}`}>
        <CopyButton text={md} label="Copy" />
        <DownloadButton content={md} filename={`${data.recommended.domain}-domain-plan.md`} type="text/markdown" label=".md" />
      </ArtifactHeader>

      <div className="border-b border-line px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[15px] font-semibold text-ink">{data.recommended.domain}</p>
          <Pill t={statusTone[data.recommended.status]}>{statusLabel[data.recommended.status]}</Pill>
          {data.recommended.price && <span className="text-[11.5px] text-ink-3">{data.recommended.price}</span>}
        </div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{data.recommended.why}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {data.recommended.registrars.map((r) => (
            <a key={r.registrar} href={r.url} target="_blank" rel="noopener noreferrer" className="group rounded-control border border-line px-3 py-2 transition-colors hover:border-primary hover:bg-hover" data-registrar-link>
              <span className="flex items-center justify-between text-[12.5px] font-medium text-ink">
                {r.registrar} <ArrowUpRight className="h-3.5 w-3.5 text-ink-3 group-hover:text-primary" />
              </span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">{r.why}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line">
        <Section label="Shortlist">
          <ul className="divide-y divide-line/60">
            {data.shortlist.map((s) => (
              <li key={s.domain} className="flex flex-wrap items-start gap-2 py-1.5 text-[12.5px]">
                <span className="font-mono font-medium text-ink">{s.domain}</span>
                <Pill t={verdictTone[s.verdict]}>{s.verdict}</Pill>
                <Pill t={statusTone[s.status]}>{statusLabel[s.status]}</Pill>
                <span className="w-full text-[12px] text-ink-2">
                  {s.why}
                  {s.price && <span className="text-ink-3"> · {s.price}</span>}
                  {s.status === "taken" && (s.registrar || s.expires) && <span className="text-ink-3"> · {[s.registrar, s.expires && `expires ${s.expires}`].filter(Boolean).join(", ")}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Section>
        <Section label="Budget">
          <p className="text-[12.5px] leading-relaxed text-ink">{data.budget}</p>
        </Section>
        <Section label="Ownership">
          <Bullets items={data.ownership} />
        </Section>
        <Section label="After you buy">
          <ol className="space-y-2">
            {data.checklist.map((c, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px]">
                <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-field text-[10px] font-semibold text-ink-3">{i + 1}</span>
                <span>
                  <span className="font-medium text-ink">{c.step}</span>
                  <span className="text-ink-2"> — {c.detail}</span>
                  {c.tool && (
                    <>
                      {" "}
                      <Link href={`/tools/${c.tool}`} className="font-medium text-primary hover:underline">
                        Open tool ↗
                      </Link>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </Section>
        {data.notes && (
          <div className="bg-field/40 px-4 py-3">
            <p className="text-[12px] text-ink-2">{data.notes}</p>
          </div>
        )}
      </div>
      <Footnote icon={<ShieldCheck className="h-3 w-3" />}>Availability from the registries via RDAP · prices are typical ranges at cost-plus registrars, confirm at checkout</Footnote>
    </div>
  );
}

/* ── Stack detection strip ───────────────────────────── */

export function StackArtifact({ data }: { data: StackToolOutput }) {
  if (!data.ok) return <p className="text-[12.5px] text-red">{data.error}</p>;
  const d = data.detection;
  const parts = [d.framework && `Framework: ${d.framework}`, d.cms && `CMS: ${d.cms}`, d.host && `Host: ${d.host}`, d.cdn && `CDN: ${d.cdn}`].filter(Boolean);
  return (
    <p className="text-[12.5px] text-ink-3" data-stack-detect>
      Read {data.url.replace(/^https?:\/\//, "")} · HTTP {data.status} · {parts.length ? parts.join(" · ") : "No recognisable framework or host signals"} · TTFB {data.ttfbMs} ms
    </p>
  );
}

/* ── Hosting plan ────────────────────────────────────── */

function DnsTable({ option }: { option: HostingOption }) {
  return (
    <div className="overflow-hidden rounded-control border border-line">
      <table className="w-full text-[12px]">
        <thead className="bg-field text-left text-[10.5px] tracking-wide text-ink-3 uppercase">
          <tr>
            <th className="px-2.5 py-1.5 font-medium">Host</th>
            <th className="px-2.5 py-1.5 font-medium">Type</th>
            <th className="px-2.5 py-1.5 font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {option.dns.map((r, i) => (
            <tr key={i}>
              <td className="px-2.5 py-1.5 font-mono text-ink">{r.host}</td>
              <td className="px-2.5 py-1.5 font-mono text-ink-2">{r.type}</td>
              <td className="px-2.5 py-1.5 font-mono break-all text-ink">
                {r.value}
                {r.note && <span className="block font-sans text-[11px] text-ink-3">{r.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OptionCard({ option, primary, domain }: { option: HostingOption; primary?: boolean; domain: string | null }) {
  const [open, setOpen] = useState(Boolean(primary));
  const p = option.provider;
  return (
    <div className={`rounded-control border ${primary ? "border-primary/40 bg-primary/[0.03]" : "border-line"}`} data-hosting-option={p.id}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 px-3 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold text-ink">{p.name}</p>
            <Pill t={primary ? "good" : "muted"}>{option.plan}</Pill>
            <span className="text-[11.5px] text-ink-3">{option.monthlyCost}</span>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{option.why}</p>
        </div>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line px-3 py-3">
          <div className="grid gap-2 text-[12px] sm:grid-cols-3">
            <div className="rounded-control bg-field px-2.5 py-2">
              <p className="text-[10.5px] tracking-wide text-ink-3 uppercase">Free tier</p>
              <p className="mt-0.5 text-ink">{p.freeTier ?? "None"}</p>
            </div>
            <div className="rounded-control bg-field px-2.5 py-2">
              <p className="text-[10.5px] tracking-wide text-ink-3 uppercase">Pricing</p>
              <p className="mt-0.5 text-ink">{p.startingPrice}</p>
            </div>
            <div className="rounded-control bg-field px-2.5 py-2">
              <p className="text-[10.5px] tracking-wide text-ink-3 uppercase">SSL</p>
              <p className="mt-0.5 text-ink">{p.ssl}</p>
            </div>
          </div>
          <div>
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Deploy</p>
            <ol className="mt-1 space-y-1 text-[12.5px] text-ink">
              {p.deploy.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-ink-3">{i + 1}.</span> <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">DNS records{domain ? ` for ${domain}` : ""}</p>
              <CopyButton text={option.dnsText} label="Copy records" />
            </div>
            <div className="mt-1">
              <DnsTable option={option} />
            </div>
            <a href={p.connectDocs} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-primary hover:underline">
              Provider&apos;s domain guide <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          {p.caveats.length > 0 && (
            <div>
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Caveats</p>
              <Bullets items={p.caveats} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HostingPlanArtifact({ data }: { data: HostingPlanDeliverable }) {
  const md = [
    `# Hosting plan — ${data.site.name}`,
    "",
    `Stack: ${data.site.stack} · Traffic: ${data.site.traffic} · Budget: ${data.site.budget}${data.site.domain ? ` · Domain: ${data.site.domain}` : ""}`,
    "",
    `## Recommended: ${data.recommended.provider.name} — ${data.recommended.plan} (${data.recommended.monthlyCost})`,
    "",
    data.recommended.why,
    "",
    "### Deploy",
    ...data.recommended.provider.deploy.map((s, i) => `${i + 1}. ${s}`),
    "",
    "### DNS records",
    "```",
    data.recommended.dnsText,
    "```",
    "",
    "## Alternatives",
    ...data.alternatives.map((a) => `- **${a.provider.name}** — ${a.plan} (${a.monthlyCost}): ${a.why}`),
    "",
    ...(data.migration.length ? ["## Migration", ...data.migration.map((m, i) => `${i + 1}. ${m}`), ""] : []),
    "## Launch checklist",
    ...data.launchChecklist.map((c) => `- [ ] ${c}`),
    "",
    data.notes ? `_${data.notes}_` : "",
  ].join("\n");

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-hosting-plan>
      <ArtifactHeader icon={<Server className="h-4 w-4" />} title={`Host ${data.site.name} on ${data.recommended.provider.name}`} subtitle={`${data.site.stack} · ${data.site.traffic}`}>
        <CopyButton text={md} label="Copy" />
        <DownloadButton content={md} filename={`${data.site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hosting-plan.md`} type="text/markdown" label=".md" />
      </ArtifactHeader>
      <div className="space-y-2 px-4 py-3">
        <OptionCard option={data.recommended} primary domain={data.site.domain} />
        {data.alternatives.length > 0 && <p className="pt-1 text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Instead, if…</p>}
        {data.alternatives.map((a) => (
          <OptionCard key={a.provider.id} option={a} domain={data.site.domain} />
        ))}
      </div>
      <div className="divide-y divide-line border-t border-line">
        {data.migration.length > 0 && (
          <Section label="Migration without downtime">
            <ol className="space-y-1.5">
              {data.migration.map((m, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] text-ink">
                  <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-field text-[10px] font-semibold text-ink-3">{i + 1}</span>
                  <span>{m}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}
        <Section label="Launch checklist">
          <ul className="space-y-1">
            {data.launchChecklist.map((c, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] text-ink">
                <CheckCircle2 className="mt-[3px] h-3.5 w-3.5 shrink-0 text-ink-3" /> <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
        {data.notes && (
          <div className="bg-field/40 px-4 py-3">
            <p className="text-[12px] text-ink-2">{data.notes}</p>
          </div>
        )}
      </div>
      <Footnote icon={<ShieldCheck className="h-3 w-3" />}>Provider facts, prices and DNS records come from Launchabl&apos;s hosting knowledge base, not the model — verify pricing at signup</Footnote>
    </div>
  );
}
