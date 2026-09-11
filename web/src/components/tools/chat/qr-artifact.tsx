"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Check, Code2, Copy, Download, ImagePlus, Link2, ScanLine, SlidersHorizontal, X } from "lucide-react";
import type { QrDesignOutput } from "@/lib/ai/tools/qr-designer";
import { renderQrSvg } from "@/lib/qr/render";
import { scanCheck, svgToPngDataUrl } from "@/lib/qr/raster";
import { hostedQrUrl } from "@/lib/qr/share";
import {
  eyeFrameShapes,
  eyePupilShapes,
  errorCorrectionLevels,
  moduleShapes,
  styleWarnings,
  type QrStyle,
} from "@/lib/qr/style";
import { downloadBlob, downloadDataUrl } from "@/lib/download";
import { useArtifactSession } from "@/components/tools/chat/artifact-session";

const LOGO_KEY = "qr.logo";
const PNG_SIZES = [512, 1024, 2048] as const;

const shapeLabels: Record<string, string> = {
  square: "Square",
  rounded: "Rounded",
  dots: "Dots",
  diamond: "Diamond",
  leaf: "Leaf",
  fluid: "Fluid",
  circle: "Circle",
};

function SmallButton({
  onClick,
  children,
  active,
  title,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium transition-colors duration-100 disabled:opacity-40 ${
        active ? "bg-ink text-surface" : "text-ink-2 hover:bg-hover hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: readonly T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`rounded-[6px] px-2 py-[3px] text-[12px] transition-colors duration-100 ${
            value === option ? "bg-field text-ink" : "text-ink-3 hover:bg-hover hover:text-ink"
          }`}
        >
          {shapeLabels[option] ?? option}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">{label}</span>
      {children}
    </label>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface px-1.5 py-1">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-5 cursor-pointer rounded border-0 bg-transparent p-0" />
      <span className="font-mono text-[12px] text-ink-2">{value}</span>
    </span>
  );
}

function CopyChip({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <SmallButton
      title={`Copy ${label}`}
      active={copied}
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : label}
    </SmallButton>
  );
}

async function fileToLogoHref(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
  if (file.type === "image/svg+xml") return raw;
  // Downscale rasters so the SVG stays small enough to embed and copy.
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Not an image."));
    el.src = raw;
  });
  const max = 320;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

export function QrArtifact({ design, compact = false }: { design: QrDesignOutput; compact?: boolean }) {
  const session = useArtifactSession();
  const [data, setData] = useState(design.data);
  const [style, setStyle] = useState<QrStyle>(design.style);
  const [logoHref, setLogoHref] = useState<string | undefined>(() => session.get<string>(LOGO_KEY));
  const [showControls, setShowControls] = useState(compact);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>(1024);
  const [scan, setScan] = useState<{ key: string; ok: boolean } | null>(null);

  const trimmed = data.trim();
  const rendered = useMemo(() => {
    if (!trimmed) return { error: "Enter a link or text to encode." as string | null, svg: "", modules: 0 };
    try {
      const { svg, modules } = renderQrSvg(trimmed, style, { logoHref: style.logo ? logoHref : undefined, inline: false });
      return { error: null, svg, modules };
    } catch {
      return { error: "That's too long for a QR code. Shorten the text or lower the error correction level.", svg: "", modules: 0 };
    }
  }, [trimmed, style, logoHref]);

  const scanKey = rendered.svg;
  useEffect(() => {
    if (!scanKey) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      scanCheck(scanKey, trimmed)
        .then((result) => {
          if (!cancelled) setScan({ key: scanKey, ok: result.ok });
        })
        .catch(() => {
          if (!cancelled) setScan({ key: scanKey, ok: false });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [scanKey, trimmed]);

  const scanStatus: "checking" | "ok" | "fail" = !scan || scan.key !== scanKey ? "checking" : scan.ok ? "ok" : "fail";
  const warnings = useMemo(() => styleWarnings(style), [style]);
  const patch = (next: Partial<QrStyle>) => setStyle((s) => ({ ...s, ...next }));

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const hosted = trimmed ? hostedQrUrl(origin, trimmed, style) : "";
  const svgDataUrl = rendered.svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rendered.svg)}` : "";

  const setLogo = async (file: File | null) => {
    if (!file) {
      setLogoHref(undefined);
      session.set(LOGO_KEY, undefined);
      return;
    }
    const href = await fileToLogoHref(file);
    setLogoHref(href);
    session.set(LOGO_KEY, href);
    if (!style.logo) patch({ logo: { sizeRatio: 0.22, knockout: true, radius: 0.2 }, errorCorrection: "H" });
  };

  const downloadSvg = () => downloadBlob(new Blob([rendered.svg], { type: "image/svg+xml" }), "qr-code.svg");
  const downloadPng = async () => downloadDataUrl(await svgToPngDataUrl(rendered.svg, pngSize), `qr-code-${pngSize}.png`);

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <ScanLine className="h-4 w-4 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{design.name}</p>
          <p className="truncate text-[12px] text-ink-2">
            {rendered.modules ? `${rendered.modules}×${rendered.modules} modules · EC ${style.errorCorrection}` : "Waiting for content"}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-[2px] text-[11.5px] font-medium ${
            scanStatus === "ok" ? "bg-green-tint text-green" : scanStatus === "fail" ? "bg-red-tint text-red" : "bg-field text-ink-3"
          }`}
        >
          {scanStatus === "ok" ? <Check className="h-3 w-3" /> : scanStatus === "fail" ? <AlertTriangle className="h-3 w-3" /> : null}
          {scanStatus === "ok" ? "Scan check passed" : scanStatus === "fail" ? "Did not scan" : "Checking scan…"}
        </span>
        <SmallButton onClick={() => setShowControls((v) => !v)} active={showControls} title="Customise by hand">
          <SlidersHorizontal className="h-3 w-3" /> Customise
        </SmallButton>
      </div>

      <div className={`grid gap-5 p-4 ${showControls ? "lg:grid-cols-[260px_1fr]" : "sm:grid-cols-[260px_1fr]"}`}>
        {/* preview */}
        <div className="flex flex-col gap-3">
          <div
            className="qr-preview aspect-square w-full max-w-[260px] overflow-hidden rounded-[10px] [&>svg]:h-full [&>svg]:w-full"
            style={{
              backgroundImage:
                style.background === "transparent"
                  ? "repeating-conic-gradient(var(--field) 0 25%, transparent 0 50%)"
                  : undefined,
              backgroundSize: "16px 16px",
            }}
            dangerouslySetInnerHTML={{ __html: rendered.svg }}
          />
          {rendered.error && <p className="text-[12.5px] text-red">{rendered.error}</p>}
          <div className="flex flex-wrap items-center gap-1">
            <SmallButton onClick={downloadSvg} disabled={!rendered.svg} title="Vector — best for print">
              <Download className="h-3 w-3" /> SVG
            </SmallButton>
            <SmallButton onClick={downloadPng} disabled={!rendered.svg} title="Raster">
              <Download className="h-3 w-3" /> PNG
            </SmallButton>
            <select
              value={pngSize}
              onChange={(e) => setPngSize(Number(e.target.value) as (typeof PNG_SIZES)[number])}
              className="h-7 rounded-[6px] border border-line bg-surface px-1.5 text-[12px] text-ink-2"
              aria-label="PNG size"
            >
              {PNG_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
            <SmallButton onClick={() => setEmbedOpen((v) => !v)} active={embedOpen} disabled={!rendered.svg} title="Embed anywhere">
              <Code2 className="h-3 w-3" /> Embed
            </SmallButton>
          </div>
        </div>

        {/* right column: notes/warnings, controls, embed */}
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Opens">
            <input
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="https://yourbrand.com"
              className="h-9 w-full rounded-[8px] border border-line bg-field px-3 text-[13px] text-ink outline-none focus:border-line-strong"
            />
          </Field>

          {(design.notes || warnings.length > 0) && (
            <div className="flex flex-col gap-1.5 text-[12.5px]">
              {design.notes && <p className="text-ink-2">{design.notes}</p>}
              {warnings.map((w) => (
                <p key={w} className="flex gap-1.5 text-ink-2">
                  <AlertTriangle className="mt-[2px] h-3.5 w-3.5 shrink-0 text-orange" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}

          {showControls && (
            <div className="grid gap-4 rounded-[10px] border border-line bg-field/40 p-3 sm:grid-cols-2" style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
              <Field label="Modules">
                <Chips value={style.moduleShape} options={moduleShapes} onChange={(v) => patch({ moduleShape: v })} />
              </Field>
              <Field label="Eye frame">
                <Chips value={style.eyeFrameShape} options={eyeFrameShapes} onChange={(v) => patch({ eyeFrameShape: v })} />
              </Field>
              <Field label="Eye pupil">
                <Chips value={style.eyePupilShape} options={eyePupilShapes} onChange={(v) => patch({ eyePupilShape: v })} />
              </Field>
              <Field label="Error correction">
                <Chips value={style.errorCorrection} options={errorCorrectionLevels} onChange={(v) => patch({ errorCorrection: v })} />
              </Field>

              <Field label="Colour">
                <div className="flex flex-wrap items-center gap-2">
                  {style.gradient ? (
                    <>
                      <ColorInput value={style.gradient.from} onChange={(v) => patch({ gradient: { ...style.gradient!, from: v } })} />
                      <ColorInput value={style.gradient.to} onChange={(v) => patch({ gradient: { ...style.gradient!, to: v } })} />
                      <Chips
                        value={style.gradient.type}
                        options={["linear", "radial"] as const}
                        onChange={(v) => patch({ gradient: { ...style.gradient!, type: v } })}
                      />
                      <SmallButton onClick={() => patch({ gradient: undefined })}>Solid</SmallButton>
                    </>
                  ) : (
                    <>
                      <ColorInput value={style.foreground} onChange={(v) => patch({ foreground: v })} />
                      <SmallButton onClick={() => patch({ gradient: { type: "linear", from: style.foreground, to: "#FF6600", angle: 45 } })}>
                        Gradient
                      </SmallButton>
                    </>
                  )}
                </div>
              </Field>
              <Field label="Background">
                <div className="flex flex-wrap items-center gap-2">
                  {style.background !== "transparent" && <ColorInput value={style.background} onChange={(v) => patch({ background: v })} />}
                  <SmallButton
                    active={style.background === "transparent"}
                    onClick={() => patch({ background: style.background === "transparent" ? "#ffffff" : "transparent" })}
                  >
                    Transparent
                  </SmallButton>
                </div>
              </Field>
              <Field label="Eyes colour">
                <div className="flex flex-wrap items-center gap-2">
                  {style.eyeColor ? (
                    <>
                      <ColorInput value={style.eyeColor} onChange={(v) => patch({ eyeColor: v })} />
                      <SmallButton onClick={() => patch({ eyeColor: undefined })}>Match</SmallButton>
                    </>
                  ) : (
                    <SmallButton onClick={() => patch({ eyeColor: "#FF6600" })}>Different colour</SmallButton>
                  )}
                </div>
              </Field>
              <Field label={`Quiet zone · ${style.margin}`}>
                <input type="range" min={0} max={8} value={style.margin} onChange={(e) => patch({ margin: Number(e.target.value) })} className="accent-[var(--ink)]" />
              </Field>
              <Field label={`Tile corners · ${Math.round(style.cornerRadius * 100)}%`}>
                <input
                  type="range"
                  min={0}
                  max={50}
                  value={Math.round(style.cornerRadius * 100)}
                  onChange={(e) => patch({ cornerRadius: Number(e.target.value) / 100 })}
                  className="accent-[var(--ink)]"
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Logo">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-[6px] bg-surface px-2 text-[12px] font-medium text-ink shadow-card hover:bg-hover">
                      <ImagePlus className="h-3 w-3" /> {logoHref ? "Replace" : "Upload"}
                      <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
                    </label>
                    {logoHref && (
                      <>
                        <span className="text-[12px] text-ink-3">Size</span>
                        <input
                          type="range"
                          min={12}
                          max={30}
                          value={Math.round((style.logo?.sizeRatio ?? 0.22) * 100)}
                          onChange={(e) => patch({ logo: { sizeRatio: Number(e.target.value) / 100, knockout: style.logo?.knockout ?? true, radius: style.logo?.radius ?? 0.2 } })}
                          className="accent-[var(--ink)]"
                        />
                        <SmallButton
                          active={style.logo?.knockout ?? true}
                          onClick={() => patch({ logo: { sizeRatio: style.logo?.sizeRatio ?? 0.22, knockout: !(style.logo?.knockout ?? true), radius: style.logo?.radius ?? 0.2 } })}
                        >
                          Clear behind
                        </SmallButton>
                        <SmallButton onClick={() => setLogo(null)} title="Remove logo">
                          <X className="h-3 w-3" /> Remove
                        </SmallButton>
                      </>
                    )}
                    {!logoHref && style.logo && <span className="text-[12px] text-ink-3">Space reserved — upload your mark to fill it.</span>}
                  </div>
                </Field>
              </div>
            </div>
          )}

          {embedOpen && rendered.svg && (
            <div className="flex flex-col gap-3 rounded-[10px] border border-line bg-field/40 p-3 text-[12.5px]" style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
              <div className="flex flex-wrap items-center gap-1">
                <Link2 className="h-3.5 w-3.5 text-ink-3" />
                <span className="mr-1 font-medium text-ink">Hosted image</span>
                <CopyChip text={hosted} label="URL" />
                <CopyChip text={`<img src="${hosted}" alt="QR code" width="256" height="256" />`} label="<img> tag" />
                <CopyChip text={`![QR code](${hosted})`} label="Markdown" />
              </div>
              <p className="text-ink-3">
                Rendered by Launchabl on request — works in emails, docs, CMS blocks and anywhere an image URL works.
                {logoHref && " Logos aren't included in the hosted version; use the inline SVG or a download for that."}
              </p>
              <div className="flex flex-wrap items-center gap-1">
                <Code2 className="h-3.5 w-3.5 text-ink-3" />
                <span className="mr-1 font-medium text-ink">Self-contained</span>
                <CopyChip text={rendered.svg} label="Inline SVG" />
                <CopyChip text={svgDataUrl} label="Data URL" />
                <CopyChip text={`<img src="${svgDataUrl}" alt="QR code" width="256" height="256" />`} label="<img> with data URL" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
