"use client";

import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Download, FileAudio, FileImage, FileText, Table2, Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { convertData, DATA_FORMATS, detectFormat, type DataFormat } from "@/lib/convert/data";
import { convertImage, extractAudioToWav, formatBytes, IMAGE_TARGETS, type ImageTarget } from "@/lib/convert/media";
import { downloadBlob } from "@/lib/download";

/**
 * File Converter — four converters, all in the browser:
 *  - Data: CSV, TSV, JSON, NDJSON, Markdown table, YAML, HTML table (any → any)
 *  - Image: PNG / JPG / WebP with quality and max-width
 *  - Audio: pull the soundtrack out of any audio/video the browser plays → WAV
 *  - Text: Markdown → standalone HTML
 */

type Mode = "data" | "image" | "audio" | "text";

const modes: { id: Mode; label: string; icon: typeof Table2; hint: string }[] = [
  { id: "data", label: "Data", icon: Table2, hint: "CSV · TSV · JSON · NDJSON · Markdown · YAML · HTML" },
  { id: "image", label: "Image", icon: FileImage, hint: "PNG · JPG · WebP, resize on the way" },
  { id: "audio", label: "Audio", icon: FileAudio, hint: "MP4 / MOV / WebM / MP3 / M4A → WAV" },
  { id: "text", label: "Text", icon: FileText, hint: "Markdown → HTML" },
];

const stem = (name: string) => name.replace(/\.[^.]+$/, "") || "converted";

function CopyOut({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function DataConverter() {
  const [input, setInput] = useState("");
  const [filename, setFilename] = useState("data");
  const [from, setFrom] = useState<DataFormat>("csv");
  const [to, setTo] = useState<DataFormat>("json");
  const [output, setOutput] = useState("");
  const [rows, setRows] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    try {
      const result = convertData(input, from, to);
      setOutput(result.output);
      setRows(result.table.rows.length);
    } catch (cause) {
      setOutput("");
      setRows(null);
      setError(cause instanceof Error ? cause.message : "Could not convert this input — check the format.");
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setInput(text);
    setFilename(stem(file.name));
    setFrom(detectFormat(text, file.name));
  };

  const target = DATA_FORMATS.find((f) => f.id === to)!;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <select value={from} onChange={(e) => setFrom(e.target.value as DataFormat)} className="h-9 rounded-md border border-border bg-white px-2 text-sm" aria-label="From format" data-fc-from>
          {DATA_FORMATS.filter((f) => f.id !== "html").map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground">→</span>
        <select value={to} onChange={(e) => setTo(e.target.value as DataFormat)} className="h-9 rounded-md border border-border bg-white px-2 text-sm" aria-label="To format" data-fc-to>
          {DATA_FORMATS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="ml-auto flex cursor-pointer items-center gap-1 text-xs font-medium text-primary">
          <Upload className="h-3.5 w-3.5" /> Upload file
          <input type="file" accept=".csv,.tsv,.json,.ndjson,.jsonl,.md,.yaml,.yml,text/*,application/json" className="hidden" onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])} />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="fc-input">
            Input
          </label>
          <textarea
            id="fc-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (!e.target.value.trim()) return;
              setFrom(detectFormat(e.target.value));
            }}
            rows={12}
            placeholder={"name,email\nJane,jane@example.com"}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="fc-output">
              Output {rows !== null && <span className="text-xs font-normal text-muted-foreground">· {rows} rows</span>}
            </label>
            {output && <CopyOut text={output} />}
          </div>
          <textarea id="fc-output" readOnly value={output} rows={12} className="mt-2 w-full rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs outline-none" data-fc-output />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-3">
        <Button onClick={run} disabled={!input.trim()} data-fc-convert>
          Convert
        </Button>
        <Button variant="secondary" disabled={!output} onClick={() => downloadBlob(new Blob([output], { type: target.mime }), `${filename}.${target.ext}`)}>
          <Download className="mr-1.5 h-4 w-4" /> Download .{target.ext}
        </Button>
      </div>
    </div>
  );
}

function ImageMode() {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<ImageTarget>("image/webp");
  const [quality, setQuality] = useState(0.86);
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [result, setResult] = useState<{ url: string; blob: Blob; width: number; height: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = IMAGE_TARGETS.find((t) => t.id === type)!;

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const out = await convertImage(file, { type, quality, maxWidth: maxWidth || undefined });
      if (result) URL.revokeObjectURL(result.url);
      setResult({ ...out, url: URL.createObjectURL(out.blob) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Conversion failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary">
        <Upload className="h-7 w-7 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{file ? `${file.name} · ${formatBytes(file.size)}` : "Drop an image, or click to choose one"}</span>
        <span className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF, BMP, AVIF, HEIC where the browser supports it</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && (setFile(e.target.files[0]), setResult(null))} />
      </label>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground">Format</label>
          <div className="mt-1.5 flex gap-1.5">
            {IMAGE_TARGETS.map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)} className={`rounded-full px-3 py-1 text-xs font-medium ${type === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="fc-quality">
            Quality {target.lossy ? `· ${Math.round(quality * 100)}%` : "· lossless"}
          </label>
          <input id="fc-quality" type="range" min={0.4} max={1} step={0.02} value={quality} disabled={!target.lossy} onChange={(e) => setQuality(Number(e.target.value))} className="mt-2 w-full accent-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground" htmlFor="fc-maxw">
            Max width (px)
          </label>
          <input id="fc-maxw" type="number" min={0} step={10} value={maxWidth || ""} placeholder="Keep original" onChange={(e) => setMaxWidth(Number(e.target.value) || 0)} className="mt-1.5 h-9 w-full rounded-md border border-border px-2 text-sm" />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={!file || busy}>
          {busy ? "Converting…" : `Convert to ${target.label}`}
        </Button>
        {result && (
          <>
            <Button variant="secondary" onClick={() => downloadBlob(result.blob, `${stem(file!.name)}.${target.ext}`)}>
              <Download className="mr-1.5 h-4 w-4" /> Download · {formatBytes(result.blob.size)}
            </Button>
            <span className="text-xs text-muted-foreground">
              {result.width}×{result.height} · {file && result.blob.size < file.size ? `${Math.round((1 - result.blob.size / file.size) * 100)}% smaller` : "larger than the original"}
            </span>
          </>
        )}
      </div>
      {result && (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img src={result.url} alt="Converted preview" className="mt-4 max-h-72 rounded-lg border border-border" />
      )}
    </div>
  );
}

function AudioMode() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ url: string; blob: Blob; seconds: number; sampleRate: number; channels: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const out = await extractAudioToWav(file);
      if (result) URL.revokeObjectURL(result.url);
      setResult({ ...out, url: URL.createObjectURL(out.blob) });
    } catch {
      setError("This browser couldn't decode that file. MP4/MOV with AAC audio, WebM, MP3, M4A and WAV usually work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary">
        <Upload className="h-7 w-7 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{file ? `${file.name} · ${formatBytes(file.size)}` : "Drop a video or audio file"}</span>
        <span className="text-xs text-muted-foreground">The soundtrack is decoded in your browser and saved as 16-bit WAV — ready for the Transcriber or an editor.</span>
        <input type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && (setFile(e.target.files[0]), setResult(null))} />
      </label>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => void run()} disabled={!file || busy}>
          {busy ? "Decoding…" : "Extract audio → WAV"}
        </Button>
        {result && (
          <>
            <Button variant="secondary" onClick={() => downloadBlob(result.blob, `${stem(file!.name)}.wav`)}>
              <Download className="mr-1.5 h-4 w-4" /> Download · {formatBytes(result.blob.size)}
            </Button>
            <span className="text-xs text-muted-foreground">
              {Math.round(result.seconds)}s · {result.sampleRate} Hz · {result.channels === 1 ? "mono" : "stereo"}
            </span>
          </>
        )}
      </div>
      {result && <audio controls src={result.url} className="mt-4 w-full" />}
    </div>
  );
}

function TextMode() {
  const [input, setInput] = useState("");
  const [html, setHtml] = useState("");
  const [title, setTitle] = useState("Document");

  const run = () => {
    const body = renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>{input}</ReactMarkdown>);
    const heading = /^#\s+(.+)$/m.exec(input)?.[1]?.trim();
    const docTitle = heading ?? title;
    setTitle(docTitle);
    setHtml(
      `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${docTitle.replace(/</g, "&lt;")}</title>\n<style>body{max-width:720px;margin:3rem auto;padding:0 1.25rem;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif;color:#111}pre{background:#f5f5f5;padding:1rem;border-radius:8px;overflow:auto}code{font-family:ui-monospace,Menlo,monospace;font-size:.9em}table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:.4rem .6rem}img{max-width:100%}</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`,
    );
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="fc-md">
              Markdown
            </label>
            <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-primary">
              <Upload className="h-3.5 w-3.5" /> Upload .md
              <input type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={(e) => e.target.files?.[0] && void e.target.files[0].text().then(setInput)} />
            </label>
          </div>
          <textarea id="fc-md" value={input} onChange={(e) => setInput(e.target.value)} rows={12} placeholder={"# Release notes\n\n- Faster exports\n- **Bold** claims"} className="mt-2 w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground" htmlFor="fc-html">
              HTML
            </label>
            {html && <CopyOut text={html} />}
          </div>
          <textarea id="fc-html" readOnly value={html} rows={12} className="mt-2 w-full rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs outline-none" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={run} disabled={!input.trim()}>
          Convert to HTML
        </Button>
        <Button variant="secondary" disabled={!html} onClick={() => downloadBlob(new Blob([html], { type: "text/html" }), `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document"}.html`)}>
          <Download className="mr-1.5 h-4 w-4" /> Download .html
        </Button>
      </div>
    </div>
  );
}

export function FileConverter() {
  const [mode, setMode] = useState<Mode>("data");
  return (
    <div data-file-converter>
      <div className="grid gap-2 sm:grid-cols-4">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-colors ${mode === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            data-fc-mode={m.id}
            aria-pressed={mode === m.id}
          >
            <m.icon className={`mt-0.5 h-4 w-4 shrink-0 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
            <span>
              <span className="block text-sm font-medium text-foreground">{m.label}</span>
              <span className="block text-[11.5px] leading-snug text-muted-foreground">{m.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {mode === "data" && <DataConverter />}
        {mode === "image" && <ImageMode />}
        {mode === "audio" && <AudioMode />}
        {mode === "text" && <TextMode />}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Everything runs in your browser; no file is uploaded. Document formats (DOCX, PDF, PPTX) need a server-side renderer and are on the roadmap.</p>
    </div>
  );
}
