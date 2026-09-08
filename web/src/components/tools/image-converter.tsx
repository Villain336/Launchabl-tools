"use client";

import { useState, useCallback } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";

const formats = [
  { label: "PNG", mime: "image/png", ext: "png" },
  { label: "JPG", mime: "image/jpeg", ext: "jpg" },
  { label: "WebP", mime: "image/webp", ext: "webp" },
];

export function ImageConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(formats[2]);
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizeInfo, setSizeInfo] = useState<{ before: number; after: number } | null>(null);

  const convert = useCallback(
    async (selected: File, fmt: typeof target, q: number) => {
      setBusy(true);
      setError(null);
      setResultUrl(null);
      setResultBlob(null);
      try {
        const bitmap = await createImageBitmap(selected);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no-canvas");
        if (fmt.mime === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(bitmap, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              setError("Your browser could not convert to this format.");
              setBusy(false);
              return;
            }
            setResultBlob(blob);
            setResultUrl(URL.createObjectURL(blob));
            setSizeInfo({ before: selected.size, after: blob.size });
            setBusy(false);
          },
          fmt.mime,
          fmt.mime === "image/png" ? undefined : q,
        );
      } catch {
        setError("Could not read this image.");
        setBusy(false);
      }
    },
    [],
  );

  const handleFile = (selected: File) => {
    setFile(selected);
    convert(selected, target, quality);
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition-colors hover:border-indigo-400">
        <Upload className="h-8 w-8 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">
          {file ? file.name : "Drop an image, or click to choose one"}
        </span>
        <span className="text-xs text-slate-500">PNG, JPG, or WebP · converted entirely in your browser</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Convert to</p>
          <div className="mt-2 flex gap-2">
            {formats.map((fmt) => (
              <button
                key={fmt.ext}
                onClick={() => {
                  setTarget(fmt);
                  if (file) convert(file, fmt, quality);
                }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  target.ext === fmt.ext ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {target.mime !== "image/png" && (
          <div className="w-full sm:w-56">
            <p className="text-sm font-medium text-slate-700">Quality — {Math.round(quality * 100)}%</p>
            <input
              type="range"
              min={0.4}
              max={1}
              step={0.05}
              value={quality}
              onChange={(e) => {
                const q = Number(e.target.value);
                setQuality(q);
                if (file) convert(file, target, q);
              }}
              className="mt-2 w-full"
            />
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {busy && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Converting…
        </div>
      )}

      {!busy && resultUrl && resultBlob && (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-xl bg-slate-50 p-5 sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultUrl} alt="Converted preview" className="h-24 w-24 rounded-lg object-cover" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Ready to download</p>
            {sizeInfo && (
              <p className="mt-1 text-xs text-slate-500">
                {Math.round(sizeInfo.before / 1024)} KB → {Math.round(sizeInfo.after / 1024)} KB
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() =>
              downloadBlob(resultBlob, `${file?.name?.replace(/\.[^.]+$/, "") ?? "converted"}.${target.ext}`)
            }
          >
            Download .{target.ext}
          </Button>
        </div>
      )}
    </div>
  );
}
