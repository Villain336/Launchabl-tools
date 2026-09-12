"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ImageOff, Package } from "lucide-react";
import type { SocialCardDeliverable, SocialCardSpec } from "@/lib/ai/tools/image-gen";
import { CARD_SIZES, cardSize, estimateMeasure, FONT_STACK, renderSocialCardSvg, SIZE_PACKS, type CardSize, type CardSizeKey, type Measure } from "@/lib/social-card/render";
import { downloadBlob } from "@/lib/download";

let measureCtx: CanvasRenderingContext2D | null | undefined;

/** Browser text measurement with the same font stack the SVG uses, so line breaks match the export. */
const canvasMeasure: Measure = (text, fontSize, weight) => {
  if (typeof document === "undefined") return estimateMeasure(text, fontSize, weight);
  if (measureCtx === undefined) measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return estimateMeasure(text, fontSize, weight);
  measureCtx.font = `${weight} ${fontSize}px ${FONT_STACK}`;
  return measureCtx.measureText(text).width;
};

async function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("svg decode failed"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png encode failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const fileSlug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "card";

function Field({ label, value, onChange, max }: { label: string; value: string; onChange: (v: string) => void; max: number }) {
  return (
    <label className="flex flex-col gap-1 text-[11.5px] text-ink-3">
      <span className="flex justify-between">
        {label}
        <span className={value.length > max * 0.9 ? "text-orange" : ""}>
          {value.length}/{max}
        </span>
      </span>
      <input value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-control border border-line bg-field px-2.5 text-[13px] text-ink outline-none focus:border-line-strong" />
    </label>
  );
}

export function SocialCardArtifact({ data }: { data: SocialCardDeliverable }) {
  const measure = canvasMeasure;
  const [size, setSize] = useState<CardSize>(CARD_SIZES[0]);
  const [title, setTitle] = useState(data.title);
  const [subtitle, setSubtitle] = useState(data.subtitle ?? "");
  const [theme, setTheme] = useState<SocialCardSpec["theme"]>(data.theme);
  const [layout, setLayout] = useState<SocialCardSpec["layout"]>(data.layout);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [picked, setPicked] = useState<CardSizeKey[]>(CARD_SIZES.map((s) => s.key));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Canvas text measurement is only available after mount; re-render once so line breaks are exact.
    queueMicrotask(() => setMounted(true));
  }, []);

  const spec = useMemo<SocialCardSpec>(() => ({ ...data, title: title || data.title, subtitle: subtitle || undefined, theme, layout }), [data, title, subtitle, theme, layout]);
  const artExpired = data.background.kind === "generated" && (data.expired || !data.backgroundImage);
  const backgroundImage = artExpired ? null : data.backgroundImage?.dataUrl ?? null;

  const svg = useMemo(() => renderSocialCardSvg({ spec, size, measure: mounted ? measure : estimateMeasure, backgroundImage }), [spec, size, measure, mounted, backgroundImage]);

  const download = async (target: CardSize) => {
    setBusy(target.key);
    try {
      const markup = renderSocialCardSvg({ spec, size: target, measure, backgroundImage });
      downloadBlob(await svgToPng(markup, target.width, target.height), `${fileSlug(spec.title)}-${target.width}x${target.height}.png`);
    } finally {
      setBusy(null);
    }
  };
  const metaTags = () =>
    `<meta property="og:image" content="https://${spec.brand.domain ?? "example.com"}/og/${fileSlug(spec.title)}-1200x630.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="https://${spec.brand.domain ?? "example.com"}/og/${fileSlug(spec.title)}-1600x900.png" />`;
  /** One ZIP with every picked size as PNG (and the SVG source), plus the og tags — one download instead of seven. */
  const downloadBatch = async () => {
    if (picked.length === 0) return;
    setBusy("batch");
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const slug = fileSlug(spec.title);
      const manifest: string[] = [`# ${spec.title}`, "", "| File | Size | Use |", "| --- | --- | --- |"];
      for (const key of picked) {
        const target = cardSize(key);
        const markup = renderSocialCardSvg({ spec, size: target, measure, backgroundImage });
        const name = `${slug}-${target.width}x${target.height}`;
        zip.file(`${name}.png`, await svgToPng(markup, target.width, target.height));
        zip.file(`svg/${name}.svg`, markup);
        manifest.push(`| ${name}.png | ${target.width}×${target.height} | ${target.hint} |`);
      }
      manifest.push("", "## og:image tags", "", "```html", metaTags(), "```", "");
      zip.file("README.md", manifest.join("\n"));
      downloadBlob(await zip.generateAsync({ type: "blob" }), `${slug}-social-cards.zip`);
    } finally {
      setBusy(null);
    }
  };
  const togglePick = (key: CardSizeKey) => setPicked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  const copyMeta = async () => {
    await navigator.clipboard.writeText(metaTags());
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const chip = (active: boolean) => `rounded-[6px] px-2 py-[3px] text-[12px] transition-colors duration-100 ${active ? "bg-field text-ink" : "text-ink-3 hover:bg-hover hover:text-ink"}`;

  return (
    <div className="not-prose overflow-hidden rounded-card bg-surface shadow-card" data-social-card={data.id}>
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-2 py-1.5">
        {CARD_SIZES.map((s) => (
          <button key={s.key} type="button" aria-pressed={s.key === size.key} title={s.hint} onClick={() => setSize(s)} className={chip(s.key === size.key)}>
            {s.label} <span className="text-ink-3">{s.width}×{s.height}</span>
          </button>
        ))}
      </div>

      <div className="bg-field/60 p-3 sm:p-4">
        <div
          className="mx-auto overflow-hidden rounded-[8px] shadow-card"
          style={{ aspectRatio: `${size.width} / ${size.height}`, maxHeight: size.height > size.width ? 520 : undefined, maxWidth: "100%" }}
          dangerouslySetInnerHTML={{ __html: svg.replace(/^<svg /, '<svg style="display:block;width:100%;height:100%" ') }}
        />
        {artExpired && (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <ImageOff className="h-3.5 w-3.5" /> The generated backdrop isn&apos;t stored anymore; showing a gradient. Ask for the card again to regenerate it.
          </p>
        )}
      </div>

      <div className="grid gap-3 border-t border-line px-3 py-3 sm:grid-cols-2">
        <Field label="Title" value={title} onChange={setTitle} max={110} />
        <Field label="Subtitle" value={subtitle} onChange={setSubtitle} max={160} />
        <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-ink-3 sm:col-span-2">
          <span className="flex items-center gap-1">
            Theme
            {(["dark", "light", "accent"] as const).map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)} className={chip(theme === t)}>
                {t}
              </button>
            ))}
          </span>
          <span className="flex items-center gap-1">
            Layout
            {(["left", "center", "split"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={layout === l} onClick={() => setLayout(l)} className={chip(layout === l)}>
                {l}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" disabled={busy !== null} onClick={() => download(size)} className="inline-flex h-8 items-center gap-1.5 rounded-control bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> PNG {size.width}×{size.height}
          </button>
          <button type="button" aria-pressed={batchOpen} onClick={() => setBatchOpen((v) => !v)} className={`inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] font-medium hover:bg-hover hover:text-ink ${batchOpen ? "bg-field text-ink" : "text-ink-2"}`} data-card-batch-toggle>
            <Package className="h-3.5 w-3.5" /> Batch
          </button>
          <button type="button" onClick={copyMeta} className="inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
            {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />} og:image tags
          </button>
        </div>
        <span className="text-[11.5px] text-ink-3">{size.hint}</span>
      </div>

      {batchOpen && (
        <div className="border-t border-line bg-field/40 px-3 py-3" data-card-batch>
          <div className="flex flex-wrap items-center gap-1 text-[11.5px] text-ink-3">
            Pack
            {SIZE_PACKS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPicked(p.sizes)} className={chip(p.sizes.length === picked.length && p.sizes.every((k) => picked.includes(k)))}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {CARD_SIZES.map((s) => (
              <label key={s.key} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 text-[12.5px] text-ink hover:bg-hover">
                <input type="checkbox" checked={picked.includes(s.key)} onChange={() => togglePick(s.key)} className="accent-primary" />
                <span className="font-medium">{s.label}</span>
                <span className="font-mono text-[11px] text-ink-3">
                  {s.width}×{s.height}
                </span>
                <span className="ml-auto hidden truncate text-[11px] text-ink-3 sm:inline">{s.hint.split(" · ")[0]}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] text-ink-3">PNG for each size, SVG sources and a README with the og:image tags, in one ZIP.</p>
            <button
              type="button"
              disabled={busy !== null || picked.length === 0}
              onClick={downloadBatch}
              className="inline-flex h-8 items-center gap-1.5 rounded-control bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              data-card-batch-download
            >
              <Download className="h-3.5 w-3.5" /> {busy === "batch" ? "Rendering…" : `ZIP · ${picked.length} size${picked.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
