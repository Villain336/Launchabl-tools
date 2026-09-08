"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { downloadDataUrl } from "@/lib/download";

export function QrCodeGenerator() {
  const [value, setValue] = useState("https://example.com");
  const [fgColor, setFgColor] = useState("#1e1b4b");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(320);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedValue = value.trim();

  useEffect(() => {
    if (!trimmedValue) return;
    let cancelled = false;
    QRCode.toDataURL(trimmedValue, {
      width: size,
      margin: 2,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        if (cancelled) return;
        setDataUrl(url);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate a QR code for that input.");
      });
    return () => {
      cancelled = true;
    };
  }, [trimmedValue, fgColor, bgColor, size]);

  const showPreview = trimmedValue.length > 0 && dataUrl;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">Link or text to encode</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://yourbrand.com"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Foreground color</label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Background color</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Size — {size}px</label>
          <input
            type="range"
            min={160}
            max={1024}
            step={16}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6">
        {showPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Generated QR code" className="h-40 w-40 rounded-lg bg-white p-2 shadow-sm" />
        ) : (
          <div className="flex h-40 w-40 items-center justify-center rounded-lg bg-white text-xs text-slate-400">
            Enter a link
          </div>
        )}
        <Button
          size="sm"
          className="w-full"
          disabled={!showPreview}
          onClick={() => dataUrl && downloadDataUrl(dataUrl, "qr-code.png")}
        >
          Download PNG
        </Button>
      </div>
    </div>
  );
}
