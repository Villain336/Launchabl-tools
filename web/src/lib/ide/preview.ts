import { mimeOf, normalisePath, previewKind, type WorkspaceFile } from "@/lib/ide/workspace";

const RELATIVE_ATTR = /(\s(?:src|href)=)(["'])([^"']+)\2/gi;

export function toDataUrl(file: WorkspaceFile): string {
  const mime = mimeOf(file.path);
  if (file.binary) return `data:${mime};base64,${file.content}`;
  // encodeURIComponent leaves ' ( ) alone; they'd break a single-quoted attribute.
  return `data:${mime};charset=utf-8,${encodeURIComponent(file.content).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`;
}

export const PREVIEW_MESSAGE = "launchabl-preview-error";

export type PreviewRuntimeError = { message: string; line: number | null; source: string | null };

/**
 * Script injected at the top of a previewed page: forwards uncaught errors,
 * unhandled rejections and console.error calls to the editor. Runs inside
 * the sandboxed iframe, so it can only postMessage back.
 */
export const PREVIEW_BRIDGE = `<script>(function(){var send=function(m,l,s){try{parent.postMessage({type:${JSON.stringify(PREVIEW_MESSAGE)},message:String(m),line:l==null?null:Number(l),source:s?String(s):null},"*")}catch(e){}};window.addEventListener("error",function(e){send(e.message||"Script error",e.lineno,e.filename)});window.addEventListener("unhandledrejection",function(e){var r=e.reason;send("Unhandled promise rejection: "+(r&&r.message?r.message:String(r)),null,null)});var ce=console.error;console.error=function(){try{send(Array.prototype.map.call(arguments,function(a){return a&&a.message?a.message:typeof a==="object"?JSON.stringify(a):String(a)}).join(" "),null,"console.error")}catch(e){}return ce.apply(console,arguments)};})()</script>`;

export function withBridge(html: string): string {
  const head = /<head[^>]*>/i.exec(html);
  if (head) return html.slice(0, head.index + head[0].length) + PREVIEW_BRIDGE + html.slice(head.index + head[0].length);
  const htmlTag = /<html[^>]*>/i.exec(html);
  if (htmlTag) return html.slice(0, htmlTag.index + htmlTag[0].length) + PREVIEW_BRIDGE + html.slice(htmlTag.index + htmlTag[0].length);
  return PREVIEW_BRIDGE + html;
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
