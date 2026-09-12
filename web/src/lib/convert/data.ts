/**
 * Text/data conversions that run entirely in the browser (and in tests):
 * CSV, TSV, JSON, NDJSON, Markdown tables, YAML (flat/simple) and
 * Markdown → HTML. Everything here is pure; the File Converter UI wires
 * it to uploads and downloads.
 */

export type Table = { headers: string[]; rows: string[][] };
export type DataFormat = "csv" | "tsv" | "json" | "ndjson" | "markdown" | "yaml" | "html";

export const DATA_FORMATS: { id: DataFormat; label: string; ext: string; mime: string }[] = [
  { id: "csv", label: "CSV", ext: "csv", mime: "text/csv" },
  { id: "tsv", label: "TSV", ext: "tsv", mime: "text/tab-separated-values" },
  { id: "json", label: "JSON", ext: "json", mime: "application/json" },
  { id: "ndjson", label: "NDJSON", ext: "ndjson", mime: "application/x-ndjson" },
  { id: "markdown", label: "Markdown table", ext: "md", mime: "text/markdown" },
  { id: "yaml", label: "YAML", ext: "yaml", mime: "application/yaml" },
  { id: "html", label: "HTML table", ext: "html", mime: "text/html" },
];

/** RFC 4180-ish parser: quoted fields, escaped quotes, embedded newlines, CRLF. */
export function parseDelimited(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Pick `,`, `\t` or `;` by which one appears most on the first line. */
export function sniffDelimiter(text: string): string {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [",", "\t", ";", "|"].map((d) => [d, first.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

export function tableFromDelimited(text: string, delimiter?: string): Table {
  const grid = parseDelimited(text, delimiter ?? sniffDelimiter(text));
  if (grid.length === 0) return { headers: [], rows: [] };
  const [headers, ...rows] = grid;
  const width = headers.length;
  return { headers: headers.map((h) => h.trim()), rows: rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? "")) };
}

const cellString = (value: unknown): string => (value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value));

/** Array of objects (or a single object) → table with the union of keys in first-seen order. */
export function tableFromRecords(records: unknown): Table {
  const list = Array.isArray(records) ? records : records && typeof records === "object" ? [records] : [];
  const headers: string[] = [];
  const seen = new Set<string>();
  for (const record of list) {
    if (!record || typeof record !== "object") continue;
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }
  const rows = list.map((record) => headers.map((h) => cellString(record && typeof record === "object" ? (record as Record<string, unknown>)[h] : "")));
  return { headers, rows };
}

/** Numbers, booleans and null come back typed; everything else stays a string. */
export function coerce(value: string): unknown {
  const v = value.trim();
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(v) && v.length < 16 && !/^0\d/.test(v)) return Number(v);
  return value;
}

export function recordsFromTable(table: Table, typed = true): Record<string, unknown>[] {
  return table.rows.map((row) => Object.fromEntries(table.headers.map((h, i) => [h, typed ? coerce(row[i] ?? "") : (row[i] ?? "")])));
}

function quoteCell(value: string, delimiter: string): string {
  return /["\r\n]/.test(value) || value.includes(delimiter) || /^\s|\s$/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function tableToDelimited(table: Table, delimiter = ","): string {
  return [table.headers, ...table.rows].map((row) => row.map((c) => quoteCell(c, delimiter)).join(delimiter)).join("\n");
}

export function tableToMarkdown(table: Table): string {
  const esc = (c: string) => c.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const line = (cells: string[]) => `| ${cells.map(esc).join(" | ")} |`;
  return [line(table.headers), `| ${table.headers.map(() => "---").join(" | ")} |`, ...table.rows.map(line)].join("\n");
}

export function tableFromMarkdown(text: string): Table {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("|"));
  const split = (l: string) => l.replace(/^\|/, "").replace(/\|$/, "").split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = split(lines[0]);
  const body = lines.slice(1).filter((l) => !/^\|?\s*:?-{3,}/.test(l));
  return { headers, rows: body.map((l) => split(l)).map((r) => headers.map((_, i) => r[i] ?? "")) };
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function tableToHtml(table: Table): string {
  const th = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
  const trs = table.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("\n");
  return `<table>\n<thead><tr>${th}</tr></thead>\n<tbody>\n${trs}\n</tbody>\n</table>`;
}

function yamlScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const s = String(value);
  return /^[A-Za-z0-9 _./@-]+$/.test(s) && !/^(true|false|null|yes|no|on|off)$/i.test(s) && !/^\d/.test(s) ? s : JSON.stringify(s);
}

/** Records → a YAML list of flat mappings (the common case for exports). */
export function recordsToYaml(records: Record<string, unknown>[]): string {
  return records
    .map((record) =>
      Object.entries(record)
        .map(([k, v], i) => `${i === 0 ? "- " : "  "}${yamlScalar(k)}: ${yamlScalar(v)}`)
        .join("\n"),
    )
    .join("\n");
}

/** Minimal YAML reader for the shape `recordsToYaml` writes (a list of flat mappings). */
export function recordsFromYaml(text: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  let current: Record<string, unknown> | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "");
    const match = /^(-\s+)?([^:]+):\s*(.*)$/.exec(line.trim());
    if (!match) continue;
    if (match[1] || !current) {
      current = {};
      out.push(current);
    }
    const value = match[3].trim();
    const unquoted = /^".*"$/.test(value) ? (JSON.parse(value) as string) : value;
    current[match[2].trim()] = typeof unquoted === "string" && unquoted === value ? coerce(value) : unquoted;
  }
  return out;
}

export function detectFormat(text: string, filename = ""): DataFormat {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "json") return "json";
  if (ext === "ndjson" || ext === "jsonl") return "ndjson";
  if (ext === "tsv") return "tsv";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "yaml" || ext === "yml") return "yaml";
  if (ext === "csv") return "csv";
  const t = text.trim();
  if (/^[[{]/.test(t)) {
    const lines = t.split(/\r?\n/).filter(Boolean);
    return lines.length > 1 && lines.every((l) => /^\{.*\}$/.test(l.trim())) ? "ndjson" : "json";
  }
  if (t.startsWith("|")) return "markdown";
  if (/^-\s+\w+:/m.test(t)) return "yaml";
  return sniffDelimiter(t) === "\t" ? "tsv" : "csv";
}

/** Any supported input → a table; throws with a readable message. */
export function toTable(text: string, format: DataFormat): Table {
  switch (format) {
    case "csv":
      return tableFromDelimited(text, ",");
    case "tsv":
      return tableFromDelimited(text, "\t");
    case "json":
      return tableFromRecords(JSON.parse(text));
    case "ndjson":
      return tableFromRecords(
        text
          .split(/\r?\n/)
          .filter((l) => l.trim())
          .map((l) => JSON.parse(l)),
      );
    case "markdown":
      return tableFromMarkdown(text);
    case "yaml":
      return tableFromRecords(recordsFromYaml(text));
    case "html":
      throw new Error("HTML is an output format only.");
  }
}

export function fromTable(table: Table, format: DataFormat): string {
  switch (format) {
    case "csv":
      return tableToDelimited(table, ",");
    case "tsv":
      return tableToDelimited(table, "\t");
    case "json":
      return JSON.stringify(recordsFromTable(table), null, 2);
    case "ndjson":
      return recordsFromTable(table)
        .map((r) => JSON.stringify(r))
        .join("\n");
    case "markdown":
      return tableToMarkdown(table);
    case "yaml":
      return recordsToYaml(recordsFromTable(table));
    case "html":
      return tableToHtml(table);
  }
}

export function convertData(text: string, from: DataFormat, to: DataFormat): { output: string; table: Table } {
  const table = toTable(text, from);
  if (table.headers.length === 0) throw new Error("No rows found — check the input format.");
  return { output: fromTable(table, to), table };
}
