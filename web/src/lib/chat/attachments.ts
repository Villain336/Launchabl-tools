import type { FileUIPart } from "ai";

/**
 * Composer attachments: images the model can look at, and text-like files
 * (CSV, Markdown, JSON, HTML…) that the server inlines into the message.
 * Everything travels as a data URL inside the normal message parts, so no
 * upload endpoint or storage is involved.
 */

export const ATTACHMENT_LIMITS = {
  maxFiles: 4,
  imageBytes: 6 * 1024 * 1024,
  textBytes: 1 * 1024 * 1024,
  /** Longest edge for images before they're sent; keeps payloads small and well under model limits. */
  imageMaxEdge: 1600,
  /** Characters of a text file the model gets to see. */
  textChars: 60_000,
} as const;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

const TEXT_EXT = /\.(csv|tsv|txt|md|mdx|markdown|json|jsonl|html?|xml|ya?ml|toml|log|srt|vtt|ics)$/i;
const TEXT_MIME = /^(text\/|application\/(json|xml|x-yaml|yaml|toml|csv|ld\+json|x-ndjson))/i;

export const ACCEPT = [...IMAGE_TYPES, ".csv", ".tsv", ".txt", ".md", ".json", ".html", ".xml", ".yaml", ".yml", ".toml", ".log"].join(",");

export function isImageType(type: string): boolean {
  return (IMAGE_TYPES as readonly string[]).includes(type.toLowerCase());
}

export function isTextLike(name: string, type: string): boolean {
  return TEXT_MIME.test(type) || TEXT_EXT.test(name);
}

/** Normalised media type for a text-like file whose browser-reported type is empty or vague. */
export function textMediaType(name: string, type: string): string {
  if (type && TEXT_MIME.test(type)) return type.split(";")[0].toLowerCase();
  const ext = name.match(TEXT_EXT)?.[1]?.toLowerCase();
  switch (ext) {
    case "csv":
      return "text/csv";
    case "tsv":
      return "text/tab-separated-values";
    case "json":
    case "jsonl":
      return "application/json";
    case "html":
    case "htm":
      return "text/html";
    case "xml":
      return "application/xml";
    case "yaml":
    case "yml":
      return "application/yaml";
    case "toml":
      return "application/toml";
    case "md":
    case "mdx":
    case "markdown":
      return "text/markdown";
    default:
      return "text/plain";
  }
}

export class AttachmentError extends Error {}

const readAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

async function downscaleImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return readAsDataUrl(file);
  const scale = Math.min(1, ATTACHMENT_LIMITS.imageMaxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) {
    bitmap.close();
    return readAsDataUrl(file);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return readAsDataUrl(file);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // PNG keeps transparency (logos); everything else compresses far better as JPEG.
  return file.type === "image/png" || file.type === "image/gif" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.86);
}

/** Turn a File into a message part, enforcing type and size limits. */
export async function fileToPart(file: File): Promise<FileUIPart> {
  if (isImageType(file.type)) {
    if (file.size > ATTACHMENT_LIMITS.imageBytes) throw new AttachmentError(`${file.name} is over ${Math.round(ATTACHMENT_LIMITS.imageBytes / 1024 / 1024)} MB.`);
    const url = await downscaleImage(file);
    return { type: "file", mediaType: url.slice(5, url.indexOf(";")), filename: file.name, url };
  }
  if (isTextLike(file.name, file.type)) {
    if (file.size > ATTACHMENT_LIMITS.textBytes) throw new AttachmentError(`${file.name} is over ${Math.round(ATTACHMENT_LIMITS.textBytes / 1024)} KB — trim it or paste the relevant part.`);
    const mediaType = textMediaType(file.name, file.type);
    const url = await readAsDataUrl(file);
    // FileReader may report the browser's guess; make the media type explicit so the server can inline it.
    return { type: "file", mediaType, filename: file.name, url: url.replace(/^data:[^;,]*/, `data:${mediaType}`) };
  }
  throw new AttachmentError(`${file.name}: only images (PNG, JPG, WebP, GIF) and text files (CSV, TXT, Markdown, JSON, HTML, XML, YAML) are supported.`);
}

export const formatBytes = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Approximate decoded size of a data URL's payload. */
export function dataUrlBytes(url: string): number {
  const comma = url.indexOf(",");
  if (comma < 0) return 0;
  const payload = url.length - comma - 1;
  if (!/;base64,/.test(url.slice(0, comma + 1))) return payload;
  const padding = url.endsWith("==") ? 2 : url.endsWith("=") ? 1 : 0;
  return Math.floor((payload * 3) / 4) - padding;
}

/** Decode a data URL's payload as UTF-8 text (server or browser). */
export function dataUrlText(url: string): string {
  const comma = url.indexOf(",");
  if (comma < 0) return "";
  const header = url.slice(0, comma);
  const payload = url.slice(comma + 1);
  if (/;base64/i.test(header)) {
    if (typeof Buffer !== "undefined") return Buffer.from(payload, "base64").toString("utf8");
    const bin = atob(payload);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(payload);
}
