"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, Eraser, RotateCcw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { applyMethod, maskFromRects, type Method, type Rect } from "@/lib/convert/inpaint";
import { downloadBlob } from "@/lib/download";
import { formatBytes } from "@/lib/convert/media";

/**
 * Watermark Remover v1 — fully client-side. The user drags rectangles over
 * the marks they own, picks a fill method, and the pixels are repainted in
 * a canvas: a multi-scale diffusion inpaint (best on flat or gradient
 * backgrounds), a blur, or a pixelate. Nothing is uploaded.
 */

const methods: { id: Method; label: string; hint: string }[] = [
  { id: "smooth", label: "Smooth fill", hint: "Blends surrounding colour into the area. Best for text or logos over flat backgrounds, skies, gradients." },
  { id: "blur", label: "Blur", hint: "Softens the area so the mark is unreadable but the texture stays." },
  { id: "pixelate", label: "Pixelate", hint: "Classic censor blocks — clear signal that something was removed." },
];

const MAX_EDGE = 2200;

export function WatermarkRemover() {
  const [attested, setAttested] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [drag, setDrag] = useState<Rect | null>(null);
  const [method, setMethod] = useState<Method>("smooth");
  const [feather, setFeather] = useState(2);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLCanvasElement>(null);

  const load = async (f: File) => {
    setError(null);
    setResult(null);
    setRects([]);
    try {
      const bmp = await createImageBitmap(f);
      const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
      let use = bmp;
      if (scale < 1) {
        use = await createImageBitmap(bmp, { resizeWidth: Math.round(bmp.width * scale), resizeHeight: Math.round(bmp.height * scale), resizeQuality: "high" });
        bmp.close();
      }
      setImage(use);
      setFile(f);
    } catch {
      setError("That file couldn't be decoded as an image.");
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    const all = drag ? [...rects, drag] : rects;
    for (const r of all) {
      ctx.fillStyle = "rgba(255,102,0,0.28)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = "#FF6600";
      ctx.lineWidth = Math.max(1, image.width / 500);
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.setLineDash([]);
    }
  }, [image, rects, drag]);

  const toImagePoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(canvas.width, ((e.clientX - bounds.left) / bounds.width) * canvas.width)),
      y: Math.max(0, Math.min(canvas.height, ((e.clientY - bounds.top) / bounds.height) * canvas.height)),
    };
  };

  const startRef = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = toImagePoint(e);
    startRef.current = p;
    setDrag({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = startRef.current;
    if (!s) return;
    const p = toImagePoint(e);
    setDrag({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const onUp = () => {
    startRef.current = null;
    if (drag && drag.w >= 3 && drag.h >= 3) {
      setRects((prev) => [...prev, { x: Math.round(drag.x), y: Math.round(drag.y), w: Math.round(drag.w), h: Math.round(drag.h) }]);
      setResult(null);
    }
    setDrag(null);
  };

  const run = async () => {
    if (!image || rects.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 20));
      const canvas = resultRef.current ?? document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const mask = maskFromRects(canvas.width, canvas.height, rects, feather);
      applyMethod(method, data.data, canvas.width, canvas.height, mask);
      ctx.putImageData(data, 0, 0);
      const type = file?.type === "image/jpeg" ? "image/jpeg" : file?.type === "image/webp" ? "image/webp" : "image/png";
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
      if (!blob) throw new Error("encode");
      if (result) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
      setShowOriginal(false);
    } catch {
      setError("Something went wrong while repainting. Try a smaller image or fewer regions.");
    } finally {
      setBusy(false);
    }
  };

  const ext = file?.type === "image/jpeg" ? "jpg" : file?.type === "image/webp" ? "webp" : "png";

  return (
    <div data-watermark-remover>
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Ownership required before use</p>
          <p className="mt-1">
            This tool is only for content you own or have explicit rights to edit — for example, removing a watermark you added yourself with our Watermark Generator. It must never be used on stock photography or third-party copyrighted content. See our{" "}
            <a href="/legal/acceptable-use" className="underline">
              Acceptable Use Policy
            </a>
            .
          </p>
        </div>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-foreground">
        <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border" data-wr-attest />
        I own this image or have explicit, documented rights to edit it, and I am not removing a watermark from stock, licensed, or third-party content.
      </label>

      {!image && (
        <div className="mt-6">
          <label className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${attested ? "cursor-pointer border-border hover:border-primary" : "cursor-not-allowed border-border opacity-50"}`}>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Drop an image, or click to choose one</span>
            <span className="text-xs text-muted-foreground">{attested ? "PNG, JPG or WebP · processed in your browser, never uploaded" : "Requires the attestation above"}</span>
            <input type="file" accept="image/*" disabled={!attested} className="hidden" data-wr-file onChange={(e) => e.target.files?.[0] && void load(e.target.files[0])} />
          </label>
        </div>
      )}

      {image && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Drag a box over each watermark.</span> {image.width}×{image.height}
              {file && ` · ${formatBytes(file.size)}`}
              {rects.length > 0 && ` · ${rects.length} region${rects.length === 1 ? "" : "s"}`}
            </p>
            <div className="flex gap-2">
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => (setRects((r) => r.slice(0, -1)), setResult(null))} disabled={rects.length === 0}>
                <RotateCcw className="h-3.5 w-3.5" /> Undo box
              </button>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => (setRects([]), setResult(null))} disabled={rects.length === 0}>
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  image.close();
                  setImage(null);
                  setFile(null);
                  setRects([]);
                  setResult(null);
                }}
              >
                <Upload className="h-3.5 w-3.5" /> New image
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-[repeating-conic-gradient(#f3f4f6_0_25%,#fff_0_50%)] bg-[length:20px_20px]">
            <div className="relative">
              <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className={`block w-full touch-none select-none cursor-crosshair ${result && !showOriginal ? "invisible" : ""}`} data-wr-canvas />
              {result && !showOriginal && (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={result.url} alt="Result" className="absolute inset-0 h-full w-full" data-wr-result />
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-medium text-foreground">Fill method</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {methods.map((m) => (
                  <button key={m.id} type="button" onClick={() => (setMethod(m.id), setResult(null))} className={`rounded-full px-3 py-1 text-xs font-medium ${method === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"}`} data-wr-method={m.id}>
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{methods.find((m) => m.id === method)?.hint}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="wr-feather">
                Edge padding · {feather}px
              </label>
              <input id="wr-feather" type="range" min={0} max={12} step={1} value={feather} onChange={(e) => (setFeather(Number(e.target.value)), setResult(null))} className="mt-2 w-40 accent-primary" />
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => void run()} disabled={rects.length === 0 || busy || !attested} data-wr-run>
              <Eraser className="mr-1.5 h-4 w-4" /> {busy ? "Repainting…" : result ? "Repaint" : "Remove watermark"}
            </Button>
            {result && (
              <>
                <Button variant="secondary" onClick={() => downloadBlob(result.blob, `${(file?.name ?? "image").replace(/\.[^.]+$/, "")}-clean.${ext}`)} data-wr-download>
                  <Download className="mr-1.5 h-4 w-4" /> Download · {formatBytes(result.blob.size)}
                </Button>
                <button type="button" className="text-xs font-medium text-primary" onPointerDown={() => setShowOriginal(true)} onPointerUp={() => setShowOriginal(false)} onPointerLeave={() => setShowOriginal(false)}>
                  Hold to compare with original
                </button>
              </>
            )}
          </div>
          <canvas ref={resultRef} className="hidden" />
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">Smooth fill works best when the background behind the mark is simple (sky, wall, gradient, solid colour). For marks over detailed textures, blur or pixelate is more honest than a smeared fill. For complex scenes, agency members can send the original source files for a clean re-export.</p>
    </div>
  );
}
