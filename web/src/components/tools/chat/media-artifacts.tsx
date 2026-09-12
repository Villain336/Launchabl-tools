"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, AudioLines, BookOpen, Clapperboard, Quote, Scissors } from "lucide-react";
import type { ClipsDeliverable, TranscriptDeliverable, TranscriptWindow } from "@/lib/ai/tools/media";
import { formatTimestamp, markedText, toSrt, toVtt } from "@/lib/media/transcript";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, Pill, Tabs } from "@/components/tools/chat/bits";

const slugify = (s: string) => s.toLowerCase().replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "recording";

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

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

/* ── readTranscript (working step) ───────────────────── */

export function TranscriptReadNote({ data }: { data: TranscriptWindow }) {
  return (
    <p className="text-[12.5px] text-ink-3">
      Read &ldquo;{data.name}&rdquo; {formatTimestamp(data.window.start)}–{formatTimestamp(data.window.end)}
      {data.windowCount > 1 ? ` (part ${data.window.index + 1} of ${data.windowCount})` : ""}
    </p>
  );
}

/* ── Transcript package ──────────────────────────────── */

function transcriptMarkdown(d: TranscriptDeliverable): string {
  const lines = [`# ${d.title}`, "", `_${d.name} · ${formatTimestamp(d.durationSec)} · ${d.words.toLocaleString()} words_`, "", d.summary, ""];
  if (d.chapters.length) lines.push("## Chapters", ...d.chapters.map((c) => `- **${c.label}** ${c.title}`), "");
  lines.push("## Takeaways", ...d.takeaways.map((t) => `- ${t}`), "");
  if (d.quotes.length) lines.push("## Quotes", ...d.quotes.map((q) => `> "${q.text}" — ${q.label}`), "");
  if (d.actionItems.length) lines.push("## Action items", ...d.actionItems.map((a) => `- [ ] ${a}`), "");
  lines.push("## Transcript", "", markedText(d.segments, 30, d.text));
  return lines.join("\n");
}

type TranscriptTab = "brief" | "transcript";

export function TranscriptArtifact({ data }: { data: TranscriptDeliverable }) {
  const [tab, setTab] = useState<TranscriptTab>("brief");
  const base = slugify(data.name);
  const marked = useMemo(() => markedText(data.segments, 30, data.text), [data.segments, data.text]);
  const captionsReady = data.timed && data.segments.length > 0;
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-transcript-artifact>
      <ArtifactHeader
        icon={<AudioLines className="h-4 w-4" />}
        title={data.title}
        subtitle={`${data.name} · ${formatTimestamp(data.durationSec)} · ${data.words.toLocaleString()} words${data.language ? ` · ${data.language.toUpperCase()}` : ""}`}
      >
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { key: "brief", label: "Brief" },
            { key: "transcript", label: "Transcript" },
          ]}
        />
      </ArtifactHeader>

      {tab === "brief" ? (
        <div className="divide-y divide-line">
          <Section label="Summary">
            <p className="text-[13px] leading-relaxed text-ink">{data.summary}</p>
          </Section>
          {data.chapters.length > 0 && (
            <Section label="Chapters">
              <ol className="space-y-1">
                {data.chapters.map((c, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-[13px] text-ink">
                    <span className="w-[52px] shrink-0 font-mono text-[11.5px] text-ink-3">{c.label}</span>
                    <span>{c.title}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
          <Section label="Takeaways">
            <ul className="space-y-1.5">
              {data.takeaways.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-ink">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" /> {t}
                </li>
              ))}
            </ul>
          </Section>
          {data.quotes.length > 0 && (
            <Section label="Quotes">
              <ul className="space-y-2">
                {data.quotes.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-ink">&ldquo;{q.text}&rdquo;</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                        <span className="font-mono">{q.label}</span>
                        {!q.verbatim && <Pill t="warn">not word-for-word</Pill>}
                      </p>
                    </div>
                    <CopyButton text={`"${q.text}"`} />
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {data.actionItems.length > 0 && (
            <Section label="Action items">
              <ul className="space-y-1">
                {data.actionItems.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ink">
                    <span className="mt-[3px] size-3.5 shrink-0 rounded-[3px] border border-line-strong" /> {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <WarningList items={data.warnings} className="px-4 py-3" />
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto px-4 py-3">
          <p className="text-[13px] leading-[1.7] whitespace-pre-wrap text-ink">{marked}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 border-t border-line bg-field/40 px-3 py-2">
        <span className="px-1 text-[11.5px] text-ink-3">Download</span>
        <DownloadButton content={transcriptMarkdown(data)} filename={`${base}-brief.md`} type="text/markdown" label="Brief (MD)" />
        <DownloadButton content={data.text} filename={`${base}-transcript.txt`} type="text/plain" label="TXT" />
        {captionsReady && <DownloadButton content={toSrt(data.segments)} filename={`${base}.srt`} type="application/x-subrip" label="SRT" />}
        {captionsReady && <DownloadButton content={toVtt(data.segments)} filename={`${base}.vtt`} type="text/vtt" label="VTT" />}
        <span className="ml-auto pr-1">
          <CopyButton text={data.text} label="Copy transcript" />
        </span>
      </div>
      <Footnote icon={<BookOpen className="h-3 w-3" />}>
        Transcribed with {data.model.split("/")[1]}{data.timed ? " · segment timestamps" : " · no timestamps"} · stored 7 days
      </Footnote>
    </div>
  );
}

/* ── Clips ───────────────────────────────────────────── */

const PLATFORM_LABEL: Record<ClipsDeliverable["platform"], string> = {
  tiktok: "TikTok",
  reels: "Reels",
  shorts: "Shorts",
  linkedin: "LinkedIn",
  x: "X",
  "podcast-teaser": "Podcast teaser",
};

function clipsMarkdown(d: ClipsDeliverable): string {
  const lines = [`# Clips from ${d.name} · ${PLATFORM_LABEL[d.platform]}`, ""];
  d.clips.forEach((c, i) => {
    lines.push(`## ${i + 1}. ${c.title} (${c.range}, ${c.durationSec}s)`, "", `**Hook:** ${c.hook}`, "", `**Caption:** ${c.caption}`, "", `**Why:** ${c.why}`, "", `> ${c.excerpt}`, "", "```", c.ffmpeg, "```", "");
  });
  if (d.notes) lines.push(`_${d.notes}_`);
  return lines.join("\n");
}

function ClipRow({ clip, index, base }: { clip: ClipsDeliverable["clips"][number]; index: number; base: string }) {
  const [open, setOpen] = useState(false);
  const t = clip.warnings.length ? "warn" : "good";
  return (
    <div className="px-4 py-3" data-clip>
      <div className="flex items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-field font-mono text-[11px] text-ink-2">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold text-ink">{clip.title}</p>
            <Pill t={t}>
              {clip.range} · {clip.durationSec}s
            </Pill>
          </div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink">
            <span className="text-ink-3">Hook · </span>
            {clip.hook}
          </p>
          <p className="mt-1 text-[12.5px] leading-snug whitespace-pre-wrap text-ink-2">{clip.caption}</p>
          <p className="mt-1 text-[12px] text-ink-3">{clip.why}</p>
          <WarningList items={clip.warnings} className="mt-1.5" />
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <button type="button" onClick={() => setOpen((v) => !v)} className="h-7 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink">
              {open ? "Hide words" : "Spoken words"}
            </button>
            <CopyButton text={clip.caption} label="Copy caption" />
            <CopyButton text={clip.ffmpeg} label="Copy ffmpeg" />
            {clip.segments.length > 0 && <DownloadButton content={toSrt(clip.segments)} filename={`${base}-clip-${index + 1}.srt`} type="application/x-subrip" label="SRT" />}
          </div>
          {open && (
            <div className="mt-2 rounded-[8px] bg-field/60 px-3 py-2">
              <p className="text-[12.5px] leading-relaxed text-ink">{clip.excerpt || "No speech in this range."}</p>
              <p className="mt-1.5 font-mono text-[11px] break-all text-ink-3">{clip.ffmpeg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClipsArtifact({ data }: { data: ClipsDeliverable }) {
  const base = slugify(data.name);
  const allCommands = data.clips.map((c) => c.ffmpeg).join("\n");
  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card" data-clips-artifact>
      <ArtifactHeader
        icon={<Scissors className="h-4 w-4" />}
        title={`${data.clips.length} clip${data.clips.length === 1 ? "" : "s"} for ${PLATFORM_LABEL[data.platform]}`}
        subtitle={`${data.name} · ${formatTimestamp(data.mediaDurationSec)} source`}
      >
        <CopyButton text={allCommands} label="Copy all ffmpeg" />
        <DownloadButton content={clipsMarkdown(data)} filename={`${base}-clips.md`} type="text/markdown" label="Brief (MD)" />
      </ArtifactHeader>
      <div className="divide-y divide-line">
        {data.clips.map((clip, i) => (
          <ClipRow key={i} clip={clip} index={i} base={base} />
        ))}
      </div>
      {(data.warnings.length > 0 || data.notes) && (
        <div className="border-t border-line bg-field/40 px-4 py-3">
          <WarningList items={data.warnings} />
          {data.notes && <p className={`text-[12px] text-ink-2 ${data.warnings.length ? "mt-2" : ""}`}>{data.notes}</p>}
        </div>
      )}
      <Footnote icon={<Clapperboard className="h-3 w-3" />}>
        Cut with the ffmpeg commands (lossless, seconds), or type the timestamps into CapCut / Descript / Premiere. Each clip&rsquo;s SRT is already re-timed to start at 0.
      </Footnote>
    </div>
  );
}
