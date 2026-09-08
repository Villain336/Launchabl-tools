"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";

type Position = "center" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "tile";

export function WatermarkGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [text, setText] = useState("© YOUR BRAND");
  const [opacity, setOpacity] = useState(0.35);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<Position>("tile");
  const [rotation, setRotation] = useState(-30);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const handleFile = useCallback(async (selected: File) => {
    setFile(selected);
    const bmp = await createImageBitmap(selected);
    setBitmap(bmp);
  }, []);

  const render = useCallback(() => {
    if (!bitmap || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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

    canvas.toBlob((blob) => blob && setResultBlob(blob), "image/png");
  }, [bitmap, text, opacity, fontSize, color, position, rotation]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {!bitmap ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition-colors hover:border-indigo-400">
            <Upload className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Drop an image, or click to choose one</span>
            <span className="text-xs text-slate-500">Watermarked entirely in your browser</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <canvas ref={canvasRef} className="h-auto w-full" />
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">Watermark text</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
            <label className="text-sm font-medium text-slate-700">Color</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Opacity — {Math.round(opacity * 100)}%</label>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Font size — {fontSize}px</label>
            <input
              type="range"
              min={16}
              max={120}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Rotation — {rotation}°</label>
            <input
              type="range"
              min={-90}
              max={90}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="mt-3 w-full"
            />
          </div>
        </div>

        <Button
          className="w-full"
          disabled={!resultBlob}
          onClick={() =>
            resultBlob &&
            downloadBlob(resultBlob, `watermarked-${file?.name?.replace(/\.[^.]+$/, "") ?? "image"}.png`)
          }
        >
          Download watermarked image
        </Button>
      </div>
    </div>
  );
}
