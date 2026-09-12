import QRCode from "qrcode";
import type { QrStyle } from "@/lib/qr/style";

/**
 * Styled QR renderer → SVG string.
 *
 * Pure TypeScript so the same output comes from the browser preview, the
 * downloads, and the hosted `/api/qr` endpoint. Coordinates are in module
 * units (one module = 1 unit) and scaled with the SVG viewBox.
 */

export type RenderOptions = {
  /** Pixel size written to width/height. The viewBox is always in modules. */
  size?: number;
  /** Data URL or absolute URL of the centre logo. Ignored unless `style.logo` is set. */
  logoHref?: string;
  /** Omit the xmlns attribute for inline embedding. */
  inline?: boolean;
};

export type RenderResult = {
  svg: string;
  /** Modules per side, excluding the quiet zone. */
  modules: number;
  version: number;
  /** Pixel dimensions written to the SVG; height exceeds width when a label band is present. */
  width: number;
  height: number;
};

const LABEL_FONTS = { sans: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", serif: "Georgia, 'Times New Roman', serif", mono: "ui-monospace, Menlo, Consolas, monospace" } as const;

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Corners = [tl: number, tr: number, br: number, bl: number];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, ""));

/** Path for a rectangle with independent corner radii. */
function roundedRect(x: number, y: number, w: number, h: number, [tl, tr, br, bl]: Corners): string {
  const cap = Math.min(w, h) / 2;
  const r = (v: number) => Math.min(Math.max(v, 0), cap);
  const [a, b, c, d] = [r(tl), r(tr), r(br), r(bl)];
  return (
    `M${fmt(x + a)} ${fmt(y)}` +
    `H${fmt(x + w - b)}` +
    (b ? `A${fmt(b)} ${fmt(b)} 0 0 1 ${fmt(x + w)} ${fmt(y + b)}` : "") +
    `V${fmt(y + h - c)}` +
    (c ? `A${fmt(c)} ${fmt(c)} 0 0 1 ${fmt(x + w - c)} ${fmt(y + h)}` : "") +
    `H${fmt(x + d)}` +
    (d ? `A${fmt(d)} ${fmt(d)} 0 0 1 ${fmt(x)} ${fmt(y + h - d)}` : "") +
    `V${fmt(y + a)}` +
    (a ? `A${fmt(a)} ${fmt(a)} 0 0 1 ${fmt(x + a)} ${fmt(y)}` : "") +
    "Z"
  );
}

function circle(cx: number, cy: number, r: number): string {
  return `M${fmt(cx - r)} ${fmt(cy)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0Z`;
}

function diamond(x: number, y: number, s: number): string {
  const c = s / 2;
  return `M${fmt(x + c)} ${fmt(y)}L${fmt(x + s)} ${fmt(y + c)}L${fmt(x + c)} ${fmt(y + s)}L${fmt(x)} ${fmt(y + c)}Z`;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function gradientDef(style: QrStyle, total: number): string {
  const g = style.gradient;
  if (!g) return "";
  if (g.type === "radial") {
    return `<radialGradient id="qrg" gradientUnits="userSpaceOnUse" cx="${fmt(total / 2)}" cy="${fmt(total / 2)}" r="${fmt(total * 0.7)}"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></radialGradient>`;
  }
  const rad = ((g.angle ?? 45) * Math.PI) / 180;
  const half = total / 2;
  const dx = Math.cos(rad) * half;
  const dy = Math.sin(rad) * half;
  return `<linearGradient id="qrg" gradientUnits="userSpaceOnUse" x1="${fmt(half - dx)}" y1="${fmt(half - dy)}" x2="${fmt(half + dx)}" y2="${fmt(half + dy)}"><stop offset="0" stop-color="${g.from}"/><stop offset="1" stop-color="${g.to}"/></linearGradient>`;
}

export function renderQrSvg(data: string, style: QrStyle, options: RenderOptions = {}): RenderResult {
  const qr = QRCode.create(data, { errorCorrectionLevel: style.errorCorrection });
  const n = qr.modules.size;
  const m = style.margin;
  const total = n + 2 * m;
  const size = options.size ?? total * 10;
  const dark = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n && qr.modules.get(r, c) === 1;

  const isEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  // Logo knockout region, in module coordinates relative to the data area.
  let knock: { x: number; y: number; s: number } | null = null;
  if (style.logo && options.logoHref) {
    const s = n * style.logo.sizeRatio;
    knock = { x: (n - s) / 2, y: (n - s) / 2, s };
  }
  const knockPad = 0.6;
  const inKnockout = (r: number, c: number) => {
    if (!knock || !style.logo?.knockout) return false;
    const cx = c + 0.5;
    const cy = r + 0.5;
    return (
      cx > knock.x - knockPad && cx < knock.x + knock.s + knockPad && cy > knock.y - knockPad && cy < knock.y + knock.s + knockPad
    );
  };

  const fill = style.gradient ? "url(#qrg)" : style.foreground;
  const eyeFill = style.eyeColor ?? fill;

  /* ── data modules ── */
  const parts: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!dark(r, c) || isEye(r, c) || inKnockout(r, c)) continue;
      const x = c + m;
      const y = r + m;
      switch (style.moduleShape) {
        case "dots":
          parts.push(circle(x + 0.5, y + 0.5, 0.42));
          break;
        case "rounded":
          parts.push(roundedRect(x + 0.06, y + 0.06, 0.88, 0.88, [0.28, 0.28, 0.28, 0.28]));
          break;
        case "diamond":
          parts.push(diamond(x + 0.04, y + 0.04, 0.92));
          break;
        case "leaf":
          parts.push(roundedRect(x + 0.04, y + 0.04, 0.92, 0.92, [0.46, 0, 0.46, 0]));
          break;
        case "fluid": {
          // Round only the corners that face empty space so runs of modules merge into pills.
          const up = dark(r - 1, c) && !isEye(r - 1, c) && !inKnockout(r - 1, c);
          const down = dark(r + 1, c) && !isEye(r + 1, c) && !inKnockout(r + 1, c);
          const left = dark(r, c - 1) && !isEye(r, c - 1) && !inKnockout(r, c - 1);
          const right = dark(r, c + 1) && !isEye(r, c + 1) && !inKnockout(r, c + 1);
          const rad = 0.5;
          parts.push(
            roundedRect(x, y, 1, 1, [
              up || left ? 0 : rad,
              up || right ? 0 : rad,
              down || right ? 0 : rad,
              down || left ? 0 : rad,
            ]),
          );
          break;
        }
        default:
          parts.push(`M${fmt(x)} ${fmt(y)}h1v1h-1Z`);
      }
    }
  }

  /* ── finder patterns ── */
  const eyes: string[] = [];
  const eyeOrigins: [number, number][] = [
    [m, m],
    [m + n - 7, m],
    [m, m + n - 7],
  ];
  for (const [ex, ey] of eyeOrigins) {
    // Frame: 7×7 ring one module thick, drawn as a stroked outline centred on the ring.
    let frame: string;
    switch (style.eyeFrameShape) {
      case "circle":
        frame = `<circle cx="${fmt(ex + 3.5)}" cy="${fmt(ey + 3.5)}" r="3" fill="none" stroke="${eyeFill}" stroke-width="1"/>`;
        break;
      case "rounded":
        frame = `<path d="${roundedRect(ex + 0.5, ey + 0.5, 6, 6, [2, 2, 2, 2])}" fill="none" stroke="${eyeFill}" stroke-width="1"/>`;
        break;
      case "leaf":
        frame = `<path d="${roundedRect(ex + 0.5, ey + 0.5, 6, 6, [3, 0, 3, 0])}" fill="none" stroke="${eyeFill}" stroke-width="1"/>`;
        break;
      default:
        frame = `<path d="${roundedRect(ex + 0.5, ey + 0.5, 6, 6, [0, 0, 0, 0])}" fill="none" stroke="${eyeFill}" stroke-width="1"/>`;
    }
    let pupil: string;
    switch (style.eyePupilShape) {
      case "circle":
        pupil = circle(ex + 3.5, ey + 3.5, 1.5);
        break;
      case "rounded":
        pupil = roundedRect(ex + 2, ey + 2, 3, 3, [0.9, 0.9, 0.9, 0.9]);
        break;
      case "leaf":
        pupil = roundedRect(ex + 2, ey + 2, 3, 3, [1.5, 0, 1.5, 0]);
        break;
      default:
        pupil = roundedRect(ex + 2, ey + 2, 3, 3, [0, 0, 0, 0]);
    }
    eyes.push(frame, `<path d="${pupil}" fill="${eyeFill}"/>`);
  }

  /* ── background, logo ── */
  const bg =
    style.background === "transparent"
      ? ""
      : `<rect width="${total}" height="${total}" rx="${fmt(style.cornerRadius * total)}" fill="${style.background}"/>`;

  let logo = "";
  if (knock && style.logo && options.logoHref) {
    const lx = knock.x + m;
    const ly = knock.y + m;
    const pad = style.logo.knockout ? knockPad : 0;
    const bgFill = style.background === "transparent" ? "#ffffff" : style.background;
    const plate = style.logo.knockout
      ? `<rect x="${fmt(lx - pad)}" y="${fmt(ly - pad)}" width="${fmt(knock.s + pad * 2)}" height="${fmt(knock.s + pad * 2)}" rx="${fmt(style.logo.radius * (knock.s + pad * 2))}" fill="${bgFill}"/>`
      : "";
    logo = `${plate}<image href="${escapeAttr(options.logoHref)}" x="${fmt(lx)}" y="${fmt(ly)}" width="${fmt(knock.s)}" height="${fmt(knock.s)}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const defs = style.gradient ? `<defs>${gradientDef(style, total)}</defs>` : "";
  const xmlns = options.inline ? "" : ' xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"';

  /* ── label band ── */
  const label = style.label;
  // Band height in modules; the font shrinks for long captions so they fit the code's width.
  const fontSize = label ? Math.min(2.4, Math.max(1.1, (total * 0.86) / (label.text.length * 0.58))) : 0;
  const bandH = label ? fontSize * 1.9 : 0;
  const totalH = total + bandH;
  const codeY = label?.position === "above" ? bandH : 0;
  const bandY = label?.position === "above" ? 0 : total;
  const labelSvg = label
    ? `<text x="${fmt(total / 2)}" y="${fmt(bandY + bandH / 2)}" text-anchor="middle" dominant-baseline="central" font-family="${LABEL_FONTS[label.font]}" font-size="${fmt(fontSize)}" font-weight="${label.weight === "bold" ? 700 : 400}" fill="${label.color ?? (style.gradient ? style.gradient.from : style.foreground)}">${escapeText(label.text)}</text>`
    : "";
  const bgFull =
    style.background === "transparent"
      ? ""
      : `<rect width="${total}" height="${fmt(totalH)}" rx="${fmt(style.cornerRadius * total)}" fill="${style.background}"/>`;

  const code = `<path d="${parts.join("")}" fill="${fill}"/>` + eyes.join("") + logo;
  const body = label ? bgFull + `<g transform="translate(0 ${fmt(codeY)})">${code}</g>` + labelSvg : bg + code;
  const height = Math.round((size * totalH) / total);

  const svg =
    `<svg${xmlns} width="${size}" height="${height}" viewBox="0 0 ${total} ${fmt(totalH)}" shape-rendering="geometricPrecision" role="img" aria-label="QR code${label ? `: ${escapeAttr(label.text)}` : ""}">` +
    defs +
    body +
    "</svg>";

  return { svg, modules: n, version: qr.version, width: size, height };
}

/** Upper bound on payload length the encoder will accept before we show a friendlier error. */
export function canEncode(data: string, level: QrStyle["errorCorrection"]): boolean {
  try {
    QRCode.create(data, { errorCorrectionLevel: level });
    return true;
  } catch {
    return false;
  }
}
