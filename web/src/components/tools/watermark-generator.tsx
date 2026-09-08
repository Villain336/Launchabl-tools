"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";
import { operatorSource, sourcesFromLog } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";

type Position = "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "tile";

export function WatermarkGenerator() {
  const run = useDeliveryRunOrThrow();
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [text, setText] = useState("© YOUR BRAND");
  const [opacity, setOpacity] = useState(0.35);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<Position>("tile");
  const [rotation, setRotation] = useState(-30);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const result = (run.output as Blob | null) ?? null;
  const previewUrl = useMemo(() => (result ? URL.createObjectURL(result) : null), [result]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(async (selected: File) => {
    setFile(selected);
    setBitmap(await createImageBitmap(selected));
  }, []);

  const composite = () => {
    if (!bitmap) throw new Error("No image loaded.");
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not draw the watermark.");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";
    if (position === "tile") {
      const stepX = fontSize * (text.length * 0.55 + 4);
      const stepY = fontSize * 3;
      for (let y = -stepY; y < canvas.height + stepY; y += stepY) {
        for (let x = -stepX; x < canvas.width + stepX; x += stepX) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    } else {
      const metrics = ctx.measureText(text);
      const padding = fontSize;
      let x = canvas.width / 2;
      let y = canvas.height / 2;
      if (position === "bottom-right") {
        x = canvas.width - metrics.width / 2 - padding;
        y = canvas.height - padding;
      } else if (position === "bottom-left") {
        x = metrics.width / 2 + padding;
        y = canvas.height - padding;
      } else if (position === "top-right") {
        x = canvas.width - metrics.width / 2 - padding;
        y = padding;
      } else if (position === "top-left") {
        x = metrics.width / 2 + padding;
        y = padding;
      }
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 0);
    }
    ctx.restore();
    return canvas;
  };

  const start = async () => {
    if (!bitmap || !file) return;
    let blob: Blob | null = null;
    await run.runScan(
      async (skill) => {
        const source = operatorSource(`Local file: ${file.name}`);
        if (skill.id === "decode-image") {
          return { payload: { width: bitmap.width, height: bitmap.height }, sources: [source], detail: file.name };
        }
        if (skill.id === "composite-mark") {
          composite();
          return { sources: [source], detail: text };
        }
        if (skill.id === "encode-png") {
          const canvas = composite();
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("Could not encode PNG."))), "image/png");
          });
          return { sources: [source], detail: "image/png" };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Processed in this browser" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: blob,
        deliverable: {
          kind: "kit",
          title: `Watermarked ${file.name}`,
          artifacts: [{ name: "watermarked.png", mime: "image/png" }],
          sources: sourcesFromLog(log),
          warnings: [],
          gates: { download: "locked" },
        },
      }),
    );
  };

  const controls = (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-foreground">Watermark text</label>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Position</label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value as Position)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        >
          <option value="tile">Tiled (repeat across image)</option>
          <option value="center">Center</option>
          <option value="bottom-right">Bottom right</option>
          <option value="bottom-left">Bottom left</option>
          <option value="top-right">Top right</option>
          <option value="top-left">Top left</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-2 h-10 w-full rounded-lg border border-border" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Opacity — {Math.round(opacity * 100)}%</label>
          <input type="range" min={0.05} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="mt-3 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">Font size — {fontSize}px</label>
          <input type="range" min={16} max={120} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="mt-3 w-full" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Rotation — {rotation}°</label>
          <input type="range" min={-90} max={90} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="mt-3 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <AgentDock
        intake={
          <div className="space-y-6">
            {!bitmap ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Drop an image, or click to choose one</span>
                <span className="text-xs text-muted-foreground">Watermarked entirely in your browser</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
            ) : (
              <p className="text-sm text-foreground">Ready: {file?.name}</p>
            )}
            {controls}
            <Button onClick={start} disabled={!bitmap || run.scanning}>
              Place watermark
            </Button>
          </div>
        }
        review={
          previewUrl ? (
            <div className="overflow-hidden rounded-2xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Watermark preview" className="h-auto w-full" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No preview yet.</p>
          )
        }
        exportPanel={
          result ? (
            <Button
              className="w-full"
              onClick={() =>
                downloadBlob(result, `watermarked-${file?.name?.replace(/\.[^.]+$/, "") ?? "image"}.png`)
              }
            >
              Download watermarked image
            </Button>
          ) : null
        }
      />
    </>
  );
}
