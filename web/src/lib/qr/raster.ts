"use client";

import jsQR from "jsqr";

/** Rasterise an SVG string onto a canvas. Browser-only. */
export async function svgToCanvas(svg: string, size: number, backdrop?: string): Promise<HTMLCanvasElement> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not rasterise the SVG."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");
    if (backdrop) {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.drawImage(img, 0, 0, size, size);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function svgToPngDataUrl(svg: string, size: number): Promise<string> {
  const canvas = await svgToCanvas(svg, size);
  return canvas.toDataURL("image/png");
}

export type ScanResult = { ok: true; decoded: string } | { ok: false };

/**
 * Decode the rendered code the way a phone would. Rendered small on purpose:
 * if it reads at 240px on a white backdrop, it will read printed.
 */
export async function scanCheck(svg: string, expected: string): Promise<ScanResult> {
  const canvas = await svgToCanvas(svg, 240, "#ffffff");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: false };
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
  if (!result) return { ok: false };
  return result.data === expected ? { ok: true, decoded: result.data } : { ok: false };
}
