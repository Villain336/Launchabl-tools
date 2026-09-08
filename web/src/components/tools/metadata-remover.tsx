"use client";

import { useState, useCallback } from "react";
import { FileImage, Loader2, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";

type Detected = Record<string, unknown> | null;

export function MetadataRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [detected, setDetected] = useState<Detected>(null);
  const [cleanedUrl, setCleanedUrl] = useState<string | null>(null);
  const [cleanedBlob, setCleanedBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (selected: File) => {
    setError(null);
    setFile(selected);
    setDetected(null);
    setCleanedUrl(null);
    setCleanedBlob(null);
    setBusy(true);

    try {
      const exifr = await import("exifr");
      const parsed = await exifr.parse(selected, true).catch(() => null);
      setDetected(parsed && Object.keys(parsed).length > 0 ? parsed : {});

      const bitmap = await createImageBitmap(selected);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported in this browser.");
      ctx.drawImage(bitmap, 0, 0);

      const mime = selected.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Could not process this image.");
            setBusy(false);
            return;
          }
          setCleanedBlob(blob);
          setCleanedUrl(URL.createObjectURL(blob));
          setBusy(false);
        },
        mime,
        0.95,
      );
    } catch {
      setError("Could not read this file. Try a JPEG or PNG image.");
      setBusy(false);
    }
  }, []);

  const notableKeys = ["Make", "Model", "GPSLatitude", "GPSLongitude", "DateTimeOriginal", "Software"];

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition-colors hover:border-indigo-400">
        <Upload className="h-8 w-8 text-slate-400" />
        <span className="text-sm font-medium text-slate-700">
          {file ? file.name : "Drop an image, or click to choose one"}
        </span>
        <span className="text-xs text-slate-500">JPEG or PNG · processed entirely in your browser</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {busy && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading and cleaning your file…
        </div>
      )}

      {!busy && detected && (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileImage className="h-4 w-4" /> What we found in your file
            </h3>
            {Object.keys(detected).length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No EXIF/metadata found — this file was already clean.</p>
            ) : (
              <dl className="mt-3 space-y-2 text-sm">
                {notableKeys
                  .filter((key) => key in detected)
                  .map((key) => (
                    <div key={key} className="flex justify-between gap-4">
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="text-right font-medium text-slate-800">{String(detected[key])}</dd>
                    </div>
                  ))}
                <div className="flex justify-between gap-4 pt-1 text-xs text-slate-400">
                  <span>{Object.keys(detected).length} field(s) total detected</span>
                </div>
              </dl>
            )}
          </div>

          <div className="rounded-xl bg-emerald-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <ShieldCheck className="h-4 w-4" /> Cleaned file ready
            </h3>
            <p className="mt-3 text-sm text-emerald-800">
              We rebuilt your image without any EXIF, GPS, or camera metadata attached.
            </p>
            {cleanedUrl && cleanedBlob && (
              <Button
                className="mt-4"
                size="sm"
                onClick={() => downloadBlob(cleanedBlob, `cleaned-${file?.name ?? "image"}.jpg`)}
              >
                Download cleaned file
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
