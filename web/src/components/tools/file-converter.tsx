"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";

type Direction = "csv-to-json" | "json-to-csv";

function csvToJson(csv: string): string {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",");
    return headers.reduce<Record<string, string>>((acc, header, i) => {
      acc[header] = (cells[i] ?? "").trim();
      return acc;
    }, {});
  });
  return JSON.stringify(rows, null, 2);
}

function jsonToCsv(json: string): string {
  const data = JSON.parse(json);
  const rows = Array.isArray(data) ? data : [data];
  if (rows.length === 0) return "";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => String(row[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

const roadmap = [
  { pair: "DOCX ↔ PDF", status: "Planned — requires headless document rendering on the server" },
  { pair: "MP4 ↔ MP3 / audio extraction", status: "Planned — requires server-side transcoding (ffmpeg workers)" },
  { pair: "PPTX ↔ PDF", status: "Planned — requires headless document rendering on the server" },
  { pair: "CSV ↔ JSON", status: "Live below — runs entirely in your browser" },
];

export function FileConverter() {
  const [direction, setDirection] = useState<Direction>("csv-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setError(null);
    try {
      setOutput(direction === "csv-to-json" ? csvToJson(input) : jsonToCsv(input));
    } catch {
      setError("Could not convert this input — check the format and try again.");
      setOutput("");
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setInput(text);
  };

  return (
    <div>
      <div className="flex gap-2">
        {(["csv-to-json", "json-to-csv"] as Direction[]).map((d) => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              direction === d ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            {d === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Input</label>
            <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary">
              <Upload className="h-3.5 w-3.5" /> Upload file
              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            placeholder={direction === "csv-to-json" ? "name,email\nJane,jane@example.com" : '[{"name":"Jane","email":"jane@example.com"}]'}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Output</label>
          <textarea
            readOnly
            value={output}
            rows={10}
            className="mt-2 w-full rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Button onClick={convert}>Convert</Button>
        <Button
          variant="secondary"
          disabled={!output}
          onClick={() =>
            downloadBlob(
              new Blob([output], { type: "text/plain" }),
              direction === "csv-to-json" ? "converted.json" : "converted.csv",
            )
          }
        >
          Download
        </Button>
      </div>

      <div className="mt-8 rounded-xl bg-muted p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Format roadmap</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {roadmap.map((r) => (
            <li key={r.pair} className="flex justify-between gap-4">
              <span className="font-medium text-foreground">{r.pair}</span>
              <span className="text-right text-xs text-muted-foreground">{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
