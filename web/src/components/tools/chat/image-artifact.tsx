"use client";

import { useState } from "react";
import { Check, Copy, Download, ImageOff, Maximize2, X } from "lucide-react";
import type { ImageDeliverable } from "@/lib/ai/tools/image-gen";
import type { GeneratedImage } from "@/lib/ai/image";
import { downloadBlob, downloadDataUrl } from "@/lib/download";

/** Re-encode a WebP data URL as PNG in the browser for apps that still choke on WebP. */
export async function dataUrlToPngBlob(dataUrl: string): Promise<Blob> {
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("decode failed"));
    image.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")?.drawImage(image, 0, 0);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode failed"))), "image/png"));
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";

function Tile({ image, name, wide }: { image: GeneratedImage; name: string; wide: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const png = async () => {
    setBusy(true);
    try {
      downloadBlob(await dataUrlToPngBlob(image.dataUrl), `${name}.png`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <figure className={`group relative overflow-hidden rounded-[10px] border border-line bg-field ${wide ? "col-span-full" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.dataUrl} alt="" width={image.width} height={image.height} className="block h-auto w-full" />
      <figcaption className="flex items-center justify-between gap-2 border-t border-line bg-surface px-2.5 py-1.5 text-[11.5px] text-ink-3">
        <span>
          {image.width}×{image.height} · {Math.round(image.bytes / 1024)} KB
        </span>
        <span className="flex items-center gap-0.5">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink" title="View full size">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => downloadDataUrl(image.dataUrl, `${name}.webp`)} className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
            <Download className="h-3.5 w-3.5" /> WebP
          </button>
          <button type="button" disabled={busy} onClick={png} className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> PNG
          </button>
        </span>
      </figcaption>
      {open && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.dataUrl} alt="" className="max-h-full max-w-full rounded-[8px] shadow-2xl" />
          <button type="button" aria-label="Close" className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </figure>
  );
}

export function ImageArtifact({ data }: { data: ImageDeliverable }) {
  const [copied, setCopied] = useState(false);
  const name = slug(data.prompt);
  const wide = data.aspect === "16:9" || data.aspect === "1.91:1" || data.aspect === "3:2" || data.aspect === "4:3";
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(data.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (data.expired || data.images.length === 0) {
    return (
      <div className="not-prose flex items-start gap-3 rounded-card border border-line bg-field/60 p-4 text-[13px] text-ink-2">
        <ImageOff className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
        <div>
          <p className="font-semibold text-ink">Image no longer stored</p>
          <p className="mt-0.5">Generated images are kept in this browser only and this one was trimmed to save space. Ask for it again to regenerate it — the prompt is saved below.</p>
          <p className="mt-2 rounded-[8px] bg-surface px-3 py-2 font-mono text-[12px] text-ink-2">{data.prompt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="not-prose rounded-card bg-surface shadow-card" data-image-artifact={data.id}>
      <div className={`grid gap-2 p-2 ${data.images.length > 1 && !wide ? "sm:grid-cols-2" : ""}`}>
        {data.images.map((image, index) => (
          <Tile key={index} image={image} name={data.images.length > 1 ? `${name}-${index + 1}` : name} wide={wide || data.images.length === 1} />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 text-[11.5px] text-ink-3">
        <span className="truncate" title={data.prompt}>
          {data.model.split("/")[1]} · {data.aspect}
        </span>
        <button type="button" onClick={copyPrompt} className="inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink">
          {copied ? <Check className="h-3.5 w-3.5 text-green" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy prompt"}
        </button>
      </div>
    </div>
  );
}
