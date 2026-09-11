import { normalizeQrStyle, type QrStyle } from "@/lib/qr/style";

/**
 * Compact, URL-safe encoding of a design so the hosted `/api/qr` endpoint can
 * render it anywhere an <img> tag works.
 */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Only the fields that differ from defaults, so URLs stay short. */
export function encodeStyle(style: QrStyle): string {
  const defaults = normalizeQrStyle({});
  const diff: Record<string, unknown> = {};
  for (const key of Object.keys(style) as (keyof QrStyle)[]) {
    if (JSON.stringify(style[key]) !== JSON.stringify(defaults[key])) diff[key] = style[key];
  }
  return toBase64Url(JSON.stringify(diff));
}

export function decodeStyle(encoded: string | null | undefined): QrStyle {
  if (!encoded) return normalizeQrStyle({});
  try {
    return normalizeQrStyle(JSON.parse(fromBase64Url(encoded)));
  } catch {
    return normalizeQrStyle({});
  }
}

export function hostedQrUrl(origin: string, data: string, style: QrStyle, size = 512): string {
  const params = new URLSearchParams({ data, s: encodeStyle(style), size: String(size) });
  return `${origin}/api/qr?${params.toString()}`;
}
