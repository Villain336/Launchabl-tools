"use client";

import { useCallback, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";

type Preset = { id: string; label: string; width: number; height: number; group: string };

const presets: Preset[] = [
  { id: "ig-feed", label: "Instagram Feed (1:1)", width: 1080, height: 1080, group: "Instagram" },
  { id: "ig-story", label: "Instagram Story (9:16)", width: 1080, height: 1920, group: "Instagram" },
  { id: "ig-portrait", label: "Instagram Portrait (4:5)", width: 1080, height: 1350, group: "Instagram" },
  { id: "fb-feed", label: "Facebook Feed (1.91:1)", width: 1200, height: 628, group: "Facebook" },
  { id: "fb-square", label: "Facebook Square", width: 1080, height: 1080, group: "Facebook" },
  { id: "li-feed", label: "LinkedIn Feed", width: 1200, height: 627, group: "LinkedIn" },
  { id: "google-display-lb", label: "Google Display Leaderboard", width: 728, height: 90, group: "Google Display" },
  { id: "google-display-mrec", label: "Google Display Medium Rectangle", width: 300, height: 250, group: "Google Display" },
  { id: "google-display-skyscraper", label: "Google Display Skyscraper", width: 160, height: 600, group: "Google Display" },
  { id: "twitter-post", label: "X / Twitter Post", width: 1600, height: 900, group: "X (Twitter)" },
];

async function resizeToFit(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const scale = Math.max(width / bitmap.width, height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, offsetX, offsetY, drawWidth, drawHeight);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92));
}

export function AdCreativeResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(presets.map((p) => p.id)));
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<{ preset: Preset; url: string; blob: Blob }[] | null>(null);

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const bmp = await createImageBitmap(selectedFile);
    setBitmap(bmp);
    setPreviews(null);
  }, []);

  const generate = async () => {
    if (!bitmap) return;
    setBusy(true);
    const chosen = presets.filter((p) => selected.has(p.id));
    const results = await Promise.all(
      chosen.map(async (preset) => {
        const blob = await resizeToFit(bitmap, preset.width, preset.height);
        return { preset, blob, url: URL.createObjectURL(blob) };
      }),
    );
    setPreviews(results);
    setBusy(false);
  };

  const downloadZip = async () => {
    if (!previews) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    for (const { preset, blob } of previews) {
      zip.file(`${preset.id}-${preset.width}x${preset.height}.jpg`, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    downloadBlob(content, `ad-creative-kit-${file?.name?.replace(/\.[^.]+$/, "") ?? "export"}.zip`);
  };

  const groups = Array.from(new Set(presets.map((p) => p.group)));

  return (
    <div>
      {!bitmap ? (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center transition-colors hover:border-indigo-400">
          <Upload className="h-8 w-8 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Drop your master creative, or click to choose one</span>
          <span className="text-xs text-slate-500">Resized entirely in your browser — nothing is uploaded</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {groups.map((group) => (
              <div key={group}>
                <p className="text-sm font-semibold text-slate-900">{group}</p>
                <div className="mt-2 space-y-2">
                  {presets
                    .filter((p) => p.group === group)
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            setSelected(next);
                          }}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        {p.label}{" "}
                        <span className="text-xs text-slate-400">
                          {p.width}×{p.height}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={generate} disabled={busy || selected.size === 0}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Generate ${selected.size} size(s)`}
            </Button>
            {previews && (
              <Button variant="secondary" onClick={downloadZip}>
                <Download className="h-4 w-4" /> Download all as .zip
              </Button>
            )}
          </div>

          {previews && (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {previews.map(({ preset, url }) => (
                <div key={preset.id} className="overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={preset.label} className="h-24 w-full object-cover" />
                  <p className="p-2 text-xs text-slate-600">{preset.label}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
