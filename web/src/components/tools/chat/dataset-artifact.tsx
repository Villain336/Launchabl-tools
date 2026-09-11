"use client";

import { useState } from "react";
import { Check, Copy, Download, Table2 } from "lucide-react";
import type { Dataset } from "@/lib/ai/tools/dataset-builder";
import { downloadBlob } from "@/lib/download";

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function datasetToCsv(data: Dataset): string {
  return [data.columns.map((c) => csvCell(c.name)).join(","), ...data.rows.map((row) => row.map(csvCell).join(","))].join("\n");
}

function coerce(value: string, type: Dataset["columns"][number]["type"]): unknown {
  if (value === "") return null;
  switch (type) {
    case "integer":
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    }
    case "boolean":
      return /^(true|yes|1)$/i.test(value) ? true : /^(false|no|0)$/i.test(value) ? false : value;
    default:
      return value;
  }
}

export function datasetToJson(data: Dataset): string {
  const records = data.rows.map((row) => Object.fromEntries(data.columns.map((c, i) => [c.name, coerce(row[i] ?? "", c.type)])));
  return JSON.stringify(records, null, 2);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "dataset";

export function DatasetArtifact({ data }: { data: Dataset }) {
  const [copied, setCopied] = useState(false);
  const csv = datasetToCsv(data);
  const numeric = new Set(data.columns.filter((c) => c.type === "integer" || c.type === "number").map((c) => c.name));

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Table2 className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{data.name}</p>
          <p className="truncate text-[12px] text-ink-2">
            {data.rows.length} rows · {data.columns.length} columns · {data.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            navigator.clipboard.writeText(csv).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
          className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors hover:bg-hover ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy CSV"}
        </button>
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([csv], { type: "text/csv" }), `${slug(data.name)}.csv`)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> CSV
        </button>
        <button
          type="button"
          onClick={() => downloadBlob(new Blob([datasetToJson(data)], { type: "application/json" }), `${slug(data.name)}.json`)}
          className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-3 transition-colors hover:bg-hover hover:text-ink"
        >
          <Download className="h-3 w-3" /> JSON
        </button>
      </div>

      <div className="max-h-[440px] overflow-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead className="sticky top-0 bg-field/95 backdrop-blur">
            <tr>
              <th className="w-10 px-3 py-2 text-right font-mono text-[11px] font-normal text-ink-3">#</th>
              {data.columns.map((c) => (
                <th key={c.name} className="px-3 py-2 text-left align-bottom" title={c.description}>
                  <span className="font-mono font-semibold text-ink">{c.name}</span>
                  <span className="ml-1.5 text-[10.5px] font-normal text-ink-3 uppercase">{c.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-hover/60">
                <td className="px-3 py-1.5 text-right font-mono text-[11px] text-ink-3">{i + 1}</td>
                {data.columns.map((c, j) => (
                  <td
                    key={c.name}
                    className={`max-w-[280px] truncate px-3 py-1.5 text-ink-2 ${numeric.has(c.name) ? "text-right font-mono tabular-nums" : ""}`}
                    title={row[j]}
                  >
                    {row[j] === "" || row[j] === undefined ? <span className="text-ink-3">—</span> : row[j]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.notes && <p className="border-t border-line px-4 py-3 text-[12.5px] text-ink-2">{data.notes}</p>}
    </div>
  );
}
