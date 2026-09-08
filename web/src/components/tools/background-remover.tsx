"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, Download, ImageIcon, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";

const CHECKERBOARD_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
};

export function BackgroundRemover() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<"idle" | "loading-model" | "processing" | "done">("idle");
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setResultUrl(null);
    setResultBlob(null);
    setSourceUrl(URL.createObjectURL(file));
    setStatus("loading-model");
    setProgressLabel("Loading on-device model…");

    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(file, {
        progress: (key, current, total) => {
          setStatus("processing");
          setProgressLabel(`${key.replace(/[:.]/g, " ")} — ${Math.round((current / Math.max(total, 1)) * 100)}%`);
        },
      });
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
      setProgressLabel(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Could not process this image: ${err.message}`
          : "Could not process this image. Try a smaller file or a different browser.",
      );
      setStatus("idle");
      setProgressLabel(null);
    }
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const busy = status === "loading-model" || status === "processing";

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40"
      >
        <Upload className="h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-700">Drop an image here, or click to upload</p>
        <p className="text-xs text-slate-500">PNG, JPG, or WebP. Processed entirely on your device — nothing is uploaded.</p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {busy && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          {progressLabel ?? "Working…"}
        </div>
      )}

      {sourceUrl && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Original</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sourceUrl} alt="Original upload" className="w-full rounded-xl border border-slate-200" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Background removed</p>
            <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-slate-200" style={CHECKERBOARD_STYLE}>
              {resultUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resultUrl} alt="Background removed" className="w-full rounded-xl" />
              ) : (
                <ImageIcon className="h-8 w-8 text-slate-300" />
              )}
            </div>
            {resultBlob && (
              <Button
                className="mt-3 w-full"
                variant="secondary"
                onClick={() => downloadBlob(resultBlob, "background-removed.png")}
              >
                <Download className="h-4 w-4" /> Download PNG
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
