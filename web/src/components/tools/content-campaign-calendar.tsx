"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { calendarToCsv, generateCalendar } from "@/lib/content-calendar";

const goals = [
  { value: "awareness", label: "Brand awareness" },
  { value: "leads", label: "Lead generation" },
  { value: "sales", label: "Direct sales" },
  { value: "retention", label: "Customer retention" },
];

export function ContentCampaignCalendar() {
  const [brand, setBrand] = useState("");
  const [goal, setGoal] = useState(goals[0].value);
  const [days, setDays] = useState(30);

  const entries = useMemo(() => generateCalendar(brand, goal, days), [brand, goal, days]);

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Brand / business</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Riverside Roasters"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Primary goal</label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          >
            {goals.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Days — {days}</label>
          <input
            type="range"
            min={7}
            max={30}
            step={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-4 w-full"
          />
        </div>
      </div>

      <Button
        className="mt-6"
        onClick={() =>
          downloadBlob(
            new Blob([calendarToCsv(entries)], { type: "text/csv" }),
            `${(brand || "content").toLowerCase().replace(/\s+/g, "-")}-calendar.csv`,
          )
        }
      >
        <Download className="h-4 w-4" /> Download CSV
      </Button>

      <div className="mt-6 max-h-[420px] overflow-y-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-500">Day</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-500">Channel</th>
              <th className="border-b border-slate-200 px-3 py-2 text-left font-medium text-slate-500">Idea</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.day}>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-500">{e.day}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{e.channel}</td>
                <td className="border-b border-slate-100 px-3 py-2 text-slate-700">{e.idea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
