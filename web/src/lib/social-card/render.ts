import type { SocialCardSpec } from "@/lib/ai/tools/image-gen";

/**
 * Social card → SVG. Pure: the same function draws the live preview and
 * the PNG export, so what you see is what downloads. Text is laid out
 * here (SVG has no wrapping) with a pluggable measurer — canvas in the
 * browser, a character-width estimate in tests.
 */

export type CardSizeKey = "og" | "x" | "square" | "story";
export type CardSize = { key: CardSizeKey; label: string; width: number; height: number; hint: string };

export const CARD_SIZES: CardSize[] = [
  { key: "og", label: "Link preview", width: 1200, height: 630, hint: "og:image · Facebook, LinkedIn, Slack, iMessage" },
  { key: "x", label: "X / Twitter", width: 1600, height: 900, hint: "twitter:image · 16:9 summary_large_image" },
  { key: "square", label: "Square", width: 1080, height: 1080, hint: "Instagram feed, LinkedIn post, Threads" },
  { key: "story", label: "Story", width: 1080, height: 1920, hint: "Instagram / Facebook story, TikTok, Reels cover" },
];

export type Measure = (text: string, fontSize: number, weight: number) => number;

export const FONT_STACK = `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

/** Estimate without a canvas (tests, SSR). Average Latin glyph ≈ 0.54em regular, 0.58em bold. */
export const estimateMeasure: Measure = (text, fontSize, weight) => text.length * fontSize * (weight >= 600 ? 0.58 : 0.54);

export function wrapText(text: string, maxWidth: number, fontSize: number, weight: number, measure: Measure, maxLines: number): { lines: string[]; truncated: boolean } {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate, fontSize, weight) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return { lines, truncated: false };
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && measure(`${last}…`, fontSize, weight) > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return { lines: kept, truncated: true };
}

/** Shrink the font until the text fits in `maxLines`, down to `minSize`. */
export function fitText(text: string, maxWidth: number, startSize: number, minSize: number, weight: number, measure: Measure, maxLines: number): { fontSize: number; lines: string[] } {
  let size = startSize;
  while (size > minSize) {
    const { lines, truncated } = wrapText(text, maxWidth, size, weight, measure, maxLines);
    if (!truncated) return { fontSize: size, lines };
    size = Math.round(size * 0.92);
  }
  return { fontSize: minSize, lines: wrapText(text, maxWidth, minSize, weight, measure, maxLines).lines };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

type Palette = { bg: string; text: string; muted: string; accent: string; onAccent: string; panel: string; from: string; to: string };

export function palette(spec: SocialCardSpec): Palette {
  const accent = spec.brand.accent;
  const onAccent = luminance(accent) > 0.45 ? "#111111" : "#FFFFFF";
  const { from, to } = spec.background;
  switch (spec.theme) {
    case "light":
      return { bg: "#FFFFFF", text: "#111111", muted: "#5B5B60", accent, onAccent, panel: mix("#FFFFFF", accent, 0.08), from: from ?? "#FFFFFF", to: to ?? mix("#FFFFFF", accent, 0.16) };
    case "accent":
      return { bg: accent, text: onAccent, muted: onAccent === "#FFFFFF" ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.65)", accent: onAccent, onAccent: accent, panel: mix(accent, onAccent, 0.12), from: from ?? accent, to: to ?? mix(accent, "#000000", 0.28) };
    default:
      return { bg: "#0B0B0D", text: "#FFFFFF", muted: "rgba(255,255,255,0.72)", accent, onAccent, panel: mix("#0B0B0D", accent, 0.14), from: from ?? "#0B0B0D", to: to ?? mix("#0B0B0D", accent, 0.38) };
  }
}

export type RenderOptions = {
  spec: SocialCardSpec;
  size: CardSize;
  measure?: Measure;
  /** data: URL of the generated backdrop, when there is one. */
  backgroundImage?: string | null;
};

export function renderSocialCardSvg({ spec, size, measure = estimateMeasure, backgroundImage }: RenderOptions): string {
  const { width: W, height: H } = size;
  const p = palette(spec);
  const tall = H > W;
  const pad = Math.round(Math.min(W, H) * (tall ? 0.09 : 0.085));
  const layout = spec.layout;
  const hasArt = Boolean(backgroundImage) && spec.background.kind === "generated";
  const split = layout === "split" && !tall;
  const textWidth = split ? Math.round(W * 0.56) - pad : W - pad * 2;
  const center = layout === "center" && !split;
  const x = center ? W / 2 : pad;
  const anchor = center ? "middle" : "start";
  const id = Math.random().toString(36).slice(2, 8);

  /* background */
  const defs: string[] = [];
  let bg = "";
  const kind = hasArt ? "generated" : spec.background.kind === "generated" ? "gradient" : spec.background.kind;
  if (kind === "solid") {
    bg = `<rect width="${W}" height="${H}" fill="${p.bg}"/>`;
  } else if (kind === "gradient") {
    defs.push(`<linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.from}"/><stop offset="1" stop-color="${p.to}"/></linearGradient>`);
    bg = `<rect width="${W}" height="${H}" fill="url(#g${id})"/>`;
  } else if (kind === "mesh") {
    defs.push(
      `<radialGradient id="m1${id}" cx="0.15" cy="0.1" r="0.7"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.55"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`,
      `<radialGradient id="m2${id}" cx="0.9" cy="0.9" r="0.7"><stop offset="0" stop-color="${mix(p.accent, spec.theme === "light" ? "#FFFFFF" : "#000000", 0.35)}" stop-opacity="0.7"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`,
      `<radialGradient id="m3${id}" cx="0.7" cy="0.2" r="0.5"><stop offset="0" stop-color="${mix(p.accent, "#FFFFFF", 0.5)}" stop-opacity="0.35"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`,
    );
    bg = `<rect width="${W}" height="${H}" fill="${p.bg}"/><rect width="${W}" height="${H}" fill="url(#m1${id})"/><rect width="${W}" height="${H}" fill="url(#m2${id})"/><rect width="${W}" height="${H}" fill="url(#m3${id})"/>`;
  } else {
    // generated art: full-bleed (or right panel when split) + scrim so text stays legible
    const scrim = spec.theme === "light" ? "#FFFFFF" : "#0B0B0D";
    if (split) {
      const artX = Math.round(W * 0.56);
      defs.push(`<clipPath id="c${id}"><rect x="${artX}" y="0" width="${W - artX}" height="${H}"/></clipPath>`);
      defs.push(`<linearGradient id="s${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.bg}"/><stop offset="1" stop-color="${p.bg}" stop-opacity="0"/></linearGradient>`);
      bg = `<rect width="${W}" height="${H}" fill="${p.bg}"/><image href="${backgroundImage}" x="${artX}" y="0" width="${W - artX}" height="${H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#c${id})"/><rect x="${artX}" y="0" width="${Math.round(W * 0.12)}" height="${H}" fill="url(#s${id})"/>`;
    } else {
      defs.push(`<linearGradient id="s${id}" x1="0" y1="0" x2="${center ? 0 : 1}" y2="${center ? 1 : 0}"><stop offset="0" stop-color="${scrim}" stop-opacity="${center ? 0.15 : 0.92}"/><stop offset="${center ? 0.55 : 0.6}" stop-color="${scrim}" stop-opacity="${center ? 0.7 : 0.55}"/><stop offset="1" stop-color="${scrim}" stop-opacity="${center ? 0.92 : 0.1}"/></linearGradient>`);
      bg = `<image href="${backgroundImage}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/><rect width="${W}" height="${H}" fill="url(#s${id})"/>`;
    }
  }

  /* type scale */
  const base = Math.min(W, H);
  const titleStart = Math.round(base * (tall ? 0.085 : center ? 0.105 : 0.1));
  const titleMin = Math.round(base * 0.052);
  const subSize = Math.round(base * (tall ? 0.036 : 0.038));
  const metaSize = Math.round(base * 0.03);
  const badgeSize = Math.round(base * 0.026);
  const maxTitleLines = tall ? 5 : 3;

  const title = fitText(spec.title, textWidth, titleStart, titleMin, 800, measure, maxTitleLines);
  const titleLH = Math.round(title.fontSize * 1.08);
  const subtitle = spec.subtitle ? wrapText(spec.subtitle, textWidth, subSize, 400, measure, tall ? 4 : 2).lines : [];
  const subLH = Math.round(subSize * 1.35);

  /* vertical rhythm: badge → title → subtitle, footer pinned to the bottom */
  const badgeH = spec.badge ? Math.round(badgeSize * 2.1) : 0;
  const blockH = badgeH + (spec.badge ? Math.round(base * 0.035) : 0) + title.lines.length * titleLH + (subtitle.length ? Math.round(base * 0.03) + subtitle.length * subLH : 0);
  const footerH = Math.round(base * 0.075);
  const contentTop = pad;
  const contentBottom = H - pad - footerH - Math.round(base * 0.03);
  let y = center ? Math.round((contentTop + contentBottom) / 2 - blockH / 2) : Math.max(contentTop, contentBottom - blockH);
  if (tall && !center) y = Math.round(H * 0.5 - blockH / 2);

  const parts: string[] = [];
  if (spec.badge) {
    const bw = Math.round(measure(spec.badge.toUpperCase(), badgeSize, 700) + badgeSize * 1.6);
    const bx = center ? Math.round(W / 2 - bw / 2) : pad;
    parts.push(
      `<rect x="${bx}" y="${y}" width="${bw}" height="${badgeH}" rx="${Math.round(badgeH / 2)}" fill="${p.accent}"/>`,
      `<text x="${bx + bw / 2}" y="${y + badgeH / 2}" dominant-baseline="central" text-anchor="middle" font-family='${FONT_STACK}' font-size="${badgeSize}" font-weight="700" letter-spacing="${(badgeSize * 0.08).toFixed(1)}" fill="${p.onAccent}">${esc(spec.badge.toUpperCase())}</text>`,
    );
    y += badgeH + Math.round(base * 0.035);
  }
  y += title.fontSize; // baseline of first title line
  for (const line of title.lines) {
    parts.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family='${FONT_STACK}' font-size="${title.fontSize}" font-weight="800" letter-spacing="${(-title.fontSize * 0.025).toFixed(1)}" fill="${p.text}">${esc(line)}</text>`);
    y += titleLH;
  }
  if (subtitle.length) {
    y += Math.round(base * 0.03) + subSize - titleLH + title.fontSize * 0.1;
    for (const line of subtitle) {
      parts.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" font-family='${FONT_STACK}' font-size="${subSize}" font-weight="400" fill="${p.muted}">${esc(line)}</text>`);
      y += subLH;
    }
  }

  /* footer: brand mark + name + domain, author on the right */
  const fy = H - pad - footerH / 2;
  const markR = Math.round(footerH * 0.5);
  const markText = (spec.brand.mark ?? spec.brand.name.slice(0, 1)).toUpperCase();
  const footer: string[] = [];
  const brandLine = spec.brand.domain ? `${spec.brand.name}  ·  ${spec.brand.domain}` : spec.brand.name;
  if (center) {
    const nameW = measure(brandLine, metaSize, 600);
    const total = markR * 2 + metaSize * 0.7 + nameW;
    const startX = Math.round(W / 2 - total / 2);
    footer.push(
      `<circle cx="${startX + markR}" cy="${fy}" r="${markR}" fill="${p.accent}"/>`,
      `<text x="${startX + markR}" y="${fy}" dominant-baseline="central" text-anchor="middle" font-family='${FONT_STACK}' font-size="${Math.round(markR * (markText.length > 1 ? 0.8 : 1.05))}" font-weight="800" fill="${p.onAccent}">${esc(markText)}</text>`,
      `<text x="${startX + markR * 2 + metaSize * 0.7}" y="${fy}" dominant-baseline="central" font-family='${FONT_STACK}' font-size="${metaSize}" font-weight="600" fill="${p.text}">${esc(brandLine)}</text>`,
    );
  } else {
    footer.push(
      `<circle cx="${pad + markR}" cy="${fy}" r="${markR}" fill="${p.accent}"/>`,
      `<text x="${pad + markR}" y="${fy}" dominant-baseline="central" text-anchor="middle" font-family='${FONT_STACK}' font-size="${Math.round(markR * (markText.length > 1 ? 0.8 : 1.05))}" font-weight="800" fill="${p.onAccent}">${esc(markText)}</text>`,
      `<text x="${pad + markR * 2 + metaSize * 0.7}" y="${fy}" dominant-baseline="central" font-family='${FONT_STACK}' font-size="${metaSize}" font-weight="600" fill="${p.text}">${esc(brandLine)}</text>`,
    );
    if (spec.author && !split) {
      const authorLine = spec.author.role ? `${spec.author.name} · ${spec.author.role}` : spec.author.name;
      footer.push(`<text x="${W - pad}" y="${fy}" dominant-baseline="central" text-anchor="end" font-family='${FONT_STACK}' font-size="${metaSize}" font-weight="500" fill="${p.muted}">${esc(authorLine)}</text>`);
    }
  }

  /* split layout without art: decorative accent panel */
  let panel = "";
  if (split && !hasArt) {
    const artX = Math.round(W * 0.6);
    defs.push(`<linearGradient id="pg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent}"/><stop offset="1" stop-color="${mix(p.accent, spec.theme === "light" ? "#FFFFFF" : "#000000", 0.45)}"/></linearGradient>`);
    panel = `<rect x="${artX}" y="${pad}" width="${W - artX - pad}" height="${H - pad * 2}" rx="${Math.round(base * 0.04)}" fill="url(#pg${id})"/><circle cx="${artX + (W - artX - pad) * 0.7}" cy="${H * 0.35}" r="${Math.round(base * 0.16)}" fill="${mix(p.accent, "#FFFFFF", 0.35)}" fill-opacity="0.55"/><circle cx="${artX + (W - artX - pad) * 0.35}" cy="${H * 0.7}" r="${Math.round(base * 0.11)}" fill="${p.onAccent}" fill-opacity="0.18"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join("")}</defs>${bg}${panel}${parts.join("")}${footer.join("")}</svg>`;
}
