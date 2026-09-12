"use client";

import { useState } from "react";
import { CalendarDays, Target } from "lucide-react";
import type { CalendarDeliverable, CalendarEntry } from "@/lib/ai/tools/marketing-kits";
import { ArtifactHeader, DownloadButton, Footnote, Pill, Tabs, type Tone } from "@/components/tools/chat/bits";

const STAGE_TONE: Record<CalendarEntry["stage"], Tone> = { awareness: "info", consideration: "warn", conversion: "good", retention: "muted" };

const CHANNEL_LABEL: Record<string, string> = { x: "X", linkedin: "LinkedIn", tiktok: "TikTok", youtube: "YouTube", blog: "Blog", instagram: "Instagram", facebook: "Facebook", email: "Email", newsletter: "Newsletter", podcast: "Podcast", webinar: "Webinar", community: "Community", ads: "Ads", other: "Other" };

const csvCell = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function calendarToCsv(cal: CalendarDeliverable): string {
  const head = ["date", "weekday", "week", "channel", "format", "title", "brief", "cta", "pillar", "stage", "campaign"];
  const rows = cal.entries.map((e) => [e.date, e.weekday, String(e.week), e.channel, e.format, e.title, e.brief, e.cta, e.pillar, e.stage, e.campaign ?? ""]);
  return [head, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export function calendarToIcs(cal: CalendarDeliverable): string {
  const stamp = cal.startDate.replace(/-/g, "");
  const events = cal.entries.map((e, i) => {
    const d = e.date.replace(/-/g, "");
    const next = new Date(new Date(`${e.date}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
    return ["BEGIN:VEVENT", `UID:${stamp}-${i}@launchabl.io`, `DTSTAMP:${stamp}T000000Z`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`, `SUMMARY:${icsEscape(`[${CHANNEL_LABEL[e.channel] ?? e.channel}] ${e.title}`)}`, `DESCRIPTION:${icsEscape(`${e.format} · ${e.pillar} · ${e.stage}\n\n${e.brief}\n\nCTA: ${e.cta}`)}`, "END:VEVENT"].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Launchabl//Content Calendar//EN", `X-WR-CALNAME:${icsEscape(cal.title)}`, ...events, "END:VCALENDAR", ""].join("\r\n");
}

export function CalendarArtifact({ cal }: { cal: CalendarDeliverable }) {
  const [view, setView] = useState<"weeks" | "plan">("weeks");
  const [channel, setChannel] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const entries = channel === "all" ? cal.entries : cal.entries.filter((e) => e.channel === channel);
  const weeks = Array.from(new Set(entries.map((e) => e.week))).sort((a, b) => a - b);
  const slug = cal.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "calendar";
  const perWeek = cal.entries.length / Math.max(1, Math.ceil(cal.days / 7));

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <ArtifactHeader icon={<CalendarDays className="h-4 w-4" />} title={cal.title} subtitle={`${cal.entries.length} pieces · ${cal.startDate} → ${cal.endDate} · ~${perWeek.toFixed(1)} per week · ${cal.channels.map((c) => CHANNEL_LABEL[c] ?? c).join(", ")}`}>
        <Tabs value={view} onChange={setView} options={[{ key: "weeks", label: "Calendar" }, { key: "plan", label: "Strategy" }]} />
        <DownloadButton content={calendarToCsv(cal)} filename={`${slug}-content-calendar.csv`} type="text/csv" label="CSV" />
        <DownloadButton content={calendarToIcs(cal)} filename={`${slug}-content-calendar.ics`} type="text/calendar" label="ICS" />
        <DownloadButton content={JSON.stringify(cal, null, 2)} filename={`${slug}-content-calendar.json`} type="application/json" label="JSON" />
      </ArtifactHeader>

      {view === "weeks" ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-4 py-2">
            {["all", ...cal.channels].map((c) => (
              <button key={c} type="button" onClick={() => setChannel(c)} className={`h-6 rounded-[6px] px-2 text-[11.5px] font-medium transition-colors ${channel === c ? "bg-ink text-surface" : "bg-field text-ink-2 hover:text-ink"}`}>
                {c === "all" ? `All (${cal.entries.length})` : `${CHANNEL_LABEL[c] ?? c} (${cal.entries.filter((e) => e.channel === c).length})`}
              </button>
            ))}
          </div>
          <div className="max-h-[520px] overflow-auto">
            {weeks.map((week) => (
              <div key={week}>
                <p className="sticky top-0 bg-field/90 px-4 py-1.5 text-[10.5px] font-medium tracking-wide text-ink-3 uppercase backdrop-blur">Week {week}</p>
                <ul className="divide-y divide-line">
                  {entries
                    .filter((e) => e.week === week)
                    .map((e, i) => {
                      const key = `${e.day}-${e.channel}-${i}`;
                      const expanded = open === key;
                      return (
                        <li key={key}>
                          <button type="button" onClick={() => setOpen(expanded ? null : key)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-hover">
                            <div className="w-14 shrink-0">
                              <p className="text-[12.5px] font-medium tabular-nums text-ink">{e.date.slice(5)}</p>
                              <p className="text-[11px] text-ink-3">{e.weekday.slice(0, 3)}</p>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-ink">{e.title}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-ink-3">
                                <span className="rounded-[4px] bg-field px-1.5 py-px text-ink-2">{CHANNEL_LABEL[e.channel] ?? e.channel}</span>
                                <span>{e.format}</span>
                                <span>· {e.pillar}</span>
                                {e.campaign && <span>· {e.campaign}</span>}
                              </p>
                              {expanded && (
                                <div className="mt-2 rounded-control bg-field px-3 py-2 text-[12.5px] leading-relaxed text-ink">
                                  <p className="whitespace-pre-wrap">{e.brief}</p>
                                  <p className="mt-1.5 font-medium text-accent-ink">CTA: {e.cta}</p>
                                </div>
                              )}
                            </div>
                            <Pill t={STAGE_TONE[e.stage]}>{e.stage}</Pill>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
            {entries.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-ink-2">Nothing on this channel.</p>}
          </div>
        </>
      ) : (
        <div className="divide-y divide-line">
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Goal</p>
            <p className="mt-1 text-[13px] text-ink">{cal.goal}</p>
            <p className="mt-1 text-[12.5px] text-ink-2">Audience: {cal.audience}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Pillars</p>
            <dl className="mt-1.5 grid gap-2 sm:grid-cols-2">
              {cal.pillars.map((p) => (
                <div key={p.name} className="rounded-control bg-field px-3 py-2">
                  <dt className="text-[12.5px] font-medium text-ink">
                    {p.name} <span className="text-ink-3">· {cal.entries.filter((e) => e.pillar === p.name).length}</span>
                  </dt>
                  <dd className="text-[12px] text-ink-2">{p.description}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Cadence</p>
            <p className="mt-1 text-[12.5px] text-ink">{cal.cadence}</p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">Funnel mix</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(["awareness", "consideration", "conversion", "retention"] as const).map((s) => {
                const n = cal.entries.filter((e) => e.stage === s).length;
                return n ? (
                  <Pill key={s} t={STAGE_TONE[s]}>
                    {s} · {n}
                  </Pill>
                ) : null;
              })}
            </div>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10.5px] font-medium tracking-wide text-ink-3 uppercase">KPIs</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {cal.kpis.map((k) => (
                <li key={k.metric} className="flex items-center gap-2 text-[12.5px]">
                  <Target className="h-3 w-3 shrink-0 text-ink-3" />
                  <span className="text-ink">{k.metric}</span>
                  <span className="text-ink-3">→ {k.target}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <Footnote icon={<CalendarDays className="h-3 w-3" />}>{cal.notes || "Click a row for the brief. Import the CSV into Notion, Airtable or Sheets; the ICS drops into any calendar."}</Footnote>
    </div>
  );
}
