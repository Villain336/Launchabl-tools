"use client";

import { useState } from "react";
import { ClipboardList, MapPin } from "lucide-react";
import type { LocalSeoKit } from "@/lib/ai/tools/marketing-kits";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, OpenInEditorButton, Pill, Tabs } from "@/components/tools/chat/bits";

type Tab = "profile" | "keywords" | "qa" | "reviews" | "posts" | "schema" | "checklist";

function Block({ label, text, meta }: { label: string; text: string; meta?: string }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">
          {label}
          {meta ? <span className="ml-1.5 normal-case tracking-normal">· {meta}</span> : null}
        </p>
        <CopyButton text={text} />
      </div>
      <p className="mt-1 text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink">{text}</p>
    </div>
  );
}

function kitToMarkdown(kit: LocalSeoKit): string {
  const b = kit.business;
  return [
    `# Local SEO kit — ${b.name}`,
    ``,
    `## Profile`,
    `- Type: ${b.type}`,
    `- Location: ${[b.streetAddress, b.city, b.region, b.postalCode, b.country].filter(Boolean).join(", ")}`,
    b.phone ? `- Phone: ${b.phone}` : null,
    b.website ? `- Website: ${b.website}` : null,
    `- Primary category: ${kit.categories.primary}`,
    `- Secondary categories: ${kit.categories.secondary.join(", ")}`,
    ``,
    `## Google Business Profile description`,
    kit.gbpDescription,
    ``,
    `## Services`,
    ...kit.services.map((s) => `- **${s.name}** — ${s.description}`),
    ``,
    `## Keywords`,
    ...kit.keywords.map((k) => `- ${k}`),
    ``,
    `## Q&A`,
    ...kit.qa.flatMap((q) => [`**Q: ${q.question}**`, q.answer, ``]),
    `## Review responses`,
    `### Positive`,
    ...kit.reviewResponses.positive.map((r) => `- ${r}`),
    `### Negative`,
    ...kit.reviewResponses.negative.map((r) => `- ${r}`),
    `### Mixed`,
    ...kit.reviewResponses.mixed.map((r) => `- ${r}`),
    ``,
    `## GBP posts`,
    ...kit.posts.flatMap((p) => [`### ${p.title} (${p.type})`, p.body, `CTA: ${p.cta}`, ``]),
    `## Review request`,
    `SMS: ${kit.reviewRequest.sms}`,
    ``,
    kit.reviewRequest.email,
    ``,
    `## LocalBusiness JSON-LD`,
    "```json",
    kit.jsonLd,
    "```",
    ``,
    `## Checklist`,
    ...kit.checklist.map((c) => `- [ ] **${c.title}** — ${c.detail}`),
    ``,
    kit.notes ? `> ${kit.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function LocalSeoArtifact({ kit }: { kit: LocalSeoKit }) {
  const [tab, setTab] = useState<Tab>("profile");
  const b = kit.business;
  const place = [b.city, b.region].filter(Boolean).join(", ");

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <ArtifactHeader icon={<MapPin className="h-4 w-4" />} title={`${b.name} · local SEO kit`} subtitle={`${b.type.replace(/([a-z])([A-Z])/g, "$1 $2")} in ${place}${b.serviceArea.length ? ` · serves ${b.serviceArea.slice(0, 3).join(", ")}${b.serviceArea.length > 3 ? "…" : ""}` : ""}`}>
        <DownloadButton content={kitToMarkdown(kit)} filename={`${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-local-seo-kit.md`} type="text/markdown" label="Kit (.md)" />
      </ArtifactHeader>
      <div className="overflow-x-auto border-b border-line px-4 py-2">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { key: "profile", label: "Profile" },
            { key: "keywords", label: `Keywords (${kit.keywords.length})` },
            { key: "qa", label: `Q&A (${kit.qa.length})` },
            { key: "reviews", label: "Reviews" },
            { key: "posts", label: `Posts (${kit.posts.length})` },
            { key: "schema", label: "Schema" },
            { key: "checklist", label: "Checklist" },
          ]}
        />
      </div>

      {tab === "profile" && (
        <div className="divide-y divide-line">
          <Block label="GBP description" text={kit.gbpDescription} meta={`${kit.gbpDescription.length}/750 chars${kit.gbpDescription.length > 750 ? " — over Google's limit, trim before pasting" : ""}`} />
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Categories</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Pill t="info">{kit.categories.primary} · primary</Pill>
              {kit.categories.secondary.map((c) => (
                <span key={c} className="rounded-control bg-field px-2 py-0.5 text-[12px] text-ink">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Services</p>
              <CopyButton text={kit.services.map((s) => `${s.name}\n${s.description}`).join("\n\n")} />
            </div>
            <dl className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {kit.services.map((s) => (
                <div key={s.name} className="rounded-control bg-field px-3 py-2">
                  <dt className="text-[12.5px] font-medium text-ink">{s.name}</dt>
                  <dd className="text-[12px] text-ink-2">{s.description}</dd>
                </div>
              ))}
            </dl>
          </div>
          {b.hours.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Hours</p>
              <ul className="mt-1 text-[12.5px] text-ink">
                {b.hours.map((h, i) => (
                  <li key={i}>
                    {h.days.length > 2 ? `${h.days[0]}–${h.days[h.days.length - 1]}` : h.days.join(", ")}: {h.opens}–{h.closes}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === "keywords" && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Local search phrases to target</p>
            <CopyButton text={kit.keywords.join("\n")} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {kit.keywords.map((k) => (
              <span key={k} className="rounded-control bg-field px-2 py-1 text-[12.5px] text-ink">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "qa" && (
        <dl className="divide-y divide-line">
          {kit.qa.map((q) => (
            <div key={q.question} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-[13px] font-medium text-ink">{q.question}</dt>
                <CopyButton text={`${q.question}\n${q.answer}`} />
              </div>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{q.answer}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === "reviews" && (
        <div className="divide-y divide-line">
          {kit.reviewResponses.positive.map((r, i) => <Block key={`p${i}`} label={`Positive review · reply ${i + 1}`} text={r} />)}
          {kit.reviewResponses.negative.map((r, i) => <Block key={`n${i}`} label={`Negative review · reply ${i + 1}`} text={r} />)}
          {kit.reviewResponses.mixed.map((r, i) => <Block key={`m${i}`} label={`Mixed review · reply ${i + 1}`} text={r} />)}
          <Block label="Review request · SMS" text={kit.reviewRequest.sms} meta={`${kit.reviewRequest.sms.length} chars`} />
          <Block label="Review request · email" text={kit.reviewRequest.email} />
        </div>
      )}

      {tab === "posts" && (
        <div className="divide-y divide-line">
          {kit.posts.map((p) => (
            <div key={p.title} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-ink">
                  {p.title} <Pill t="muted">{p.type}</Pill>
                </p>
                <CopyButton text={`${p.title}\n\n${p.body}\n\n${p.cta}`} />
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-2">{p.body}</p>
              <p className="mt-1 text-[12px] font-medium text-accent-ink">{p.cta} →</p>
            </div>
          ))}
        </div>
      )}

      {tab === "schema" && (
        <div>
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <p className="text-[12px] text-ink-2">LocalBusiness JSON-LD built from the profile details — paste on the homepage or contact page.</p>
            <div className="flex items-center gap-1">
              <CopyButton text={`<script type="application/ld+json">\n${kit.jsonLd}\n</script>`} label="Copy <script>" />
              <DownloadButton content={kit.jsonLd} filename="local-business.jsonld" type="application/ld+json" label=".jsonld" />
              <OpenInEditorButton title={`LocalBusiness JSON-LD for ${b.name}`} from="Local SEO kit" files={[{ path: "local-business.jsonld", content: kit.jsonLd }]} />
            </div>
          </div>
          <pre className="max-h-[360px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">{kit.jsonLd}</pre>
        </div>
      )}

      {tab === "checklist" && (
        <ol className="divide-y divide-line">
          {kit.checklist.map((c, i) => (
            <li key={c.id} className="flex gap-3 px-4 py-2.5">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-field text-[11px] font-semibold text-ink-2">{i + 1}</span>
              <div>
                <p className="text-[13px] font-medium text-ink">{c.title}</p>
                <p className="text-[12.5px] text-ink-2">{c.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <Footnote icon={<ClipboardList className="h-3 w-3" />}>{kit.notes}</Footnote>
    </div>
  );
}
