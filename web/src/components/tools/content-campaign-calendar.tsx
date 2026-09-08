"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";
import { calendarToCsv, generateCalendar, type CalendarEntry } from "@/lib/content-calendar";
import { operatorSource, sourcesFromLog } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

const goals = [
  { value: "awareness", label: "Brand awareness" },
  { value: "leads", label: "Lead generation" },
  { value: "sales", label: "Direct sales" },
  { value: "retention", label: "Customer retention" },
];

export function ContentCampaignCalendar() {
  const run = useDeliveryRunOrThrow();
  const [brand, setBrand] = useState("");
  const [goal, setGoal] = useState(goals[0].value);
  const [days, setDays] = useState(30);
  const entries = (run.output as CalendarEntry[] | null) ?? [];
  const filledBrand = brand || run.brief.trim();
  const source = operatorSource("Brand, goal, and duration from this run");

  const start = async () => {
    if (!filledBrand.trim()) return;
    const next = generateCalendar(filledBrand, goal, days);
    await run.runScan(
      async (skill) => {
        if (skill.id === "calendar.30-day") {
          return { payload: next, sources: [source], detail: `${next.length} days` };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Operator-provided brief" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: next,
        deliverable: {
          kind: "report",
          title: `${brand} calendar`,
          artifacts: [{ name: "calendar.csv", mime: "text/csv", text: calendarToCsv(next) }],
          sources: sourcesFromLog(log),
          warnings: [],
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-foreground">Brand / business</label>
              <input
                value={filledBrand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Riverside Roasters"
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Primary goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                {goals.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Days — {days}</label>
              <input type="range" min={7} max={30} step={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="mt-4 w-full" />
            </div>
          </div>
          <Button className="mt-5" onClick={start} disabled={run.scanning || !filledBrand.trim()}>
            Build calendar
          </Button>
        </div>
      }
      review={
        entries.length ? (
          <div>
            <SourceChip source={source} />
            <div className="mt-3 max-h-[420px] overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">Day</th>
                    <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">Channel</th>
                    <th className="border-b border-border px-3 py-2 text-left font-medium text-muted-foreground">Idea</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.day}>
                      <td className="border-b border-slate-100 px-3 py-2 text-muted-foreground">{e.day}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-foreground">{e.channel}</td>
                      <td className="border-b border-slate-100 px-3 py-2 text-foreground">{e.idea}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No calendar yet.</p>
        )
      }
      exportPanel={
        entries.length ? (
          <Button
            onClick={() =>
              downloadBlob(
                new Blob([calendarToCsv(entries)], { type: "text/csv" }),
                `${brand.toLowerCase().replace(/\s+/g, "-")}-calendar.csv`,
              )
            }
          >
            <Download className="h-4 w-4" /> Download CSV
          </Button>
        ) : null
      }
    />
  );
}
