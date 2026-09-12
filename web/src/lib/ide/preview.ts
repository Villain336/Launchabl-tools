import { mimeOf, normalisePath, previewKind, type WorkspaceFile } from "@/lib/ide/workspace";

const RELATIVE_ATTR = /(\s(?:src|href)=)(["'])([^"']+)\2/gi;

export function toDataUrl(file: WorkspaceFile): string {
  const mime = mimeOf(file.path);
  if (file.binary) return `data:${mime};base64,${file.content}`;
  // encodeURIComponent leaves ' ( ) alone; they'd break a single-quoted attribute.
  return `data:${mime};charset=utf-8,${encodeURIComponent(file.content).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

/**
 * Resolve relative `src`/`href` values against the workspace so a page can
 * load its own stylesheet, script and images inside the sandboxed iframe.
 * Absolute URLs, anchors and links to other pages are left alone.
 */
export function inlineAssets(html: string, path: string, files: Record<string, WorkspaceFile>): string {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  return html.replace(RELATIVE_ATTR, (whole, attr: string, quote: string, value: string) => {
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(value)) return whole;
    const clean = value.split(/[?#]/)[0];
    const resolved = normalisePath(clean.startsWith("/") ? clean.slice(1) : dir ? `${dir}/${clean}` : clean);
    const file = files[resolved];
    if (!file) return whole;
    if (previewKind(file.path) === "html") return whole;
    return `${attr}${quote}${toDataUrl(file)}${quote}`;
  });
}
