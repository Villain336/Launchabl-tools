"use client";

import { useMemo } from "react";
import { Markdown } from "@/components/tools/chat/markdown";
import { WebPreview, WebPreviewBody } from "@/components/ai-elements/web-preview";
import { mimeOf, normalisePath, previewKind, type WorkspaceFile } from "@/lib/ide/workspace";

type Props = { path: string; files: Record<string, WorkspaceFile> };

const RELATIVE_ATTR = /(\s(?:src|href)=)(["'])([^"']+)\2/gi;

function toDataUrl(file: WorkspaceFile): string {
  const mime = mimeOf(file.path);
  if (file.binary) return `data:${mime};base64,${file.content}`;
  return `data:${mime};charset=utf-8,${encodeURIComponent(file.content)}`;
}

/**
 * Resolve relative `src`/`href` values against the workspace so a page can
 * load its own stylesheet, script and images inside the sandboxed iframe.
 * Absolute URLs and anchors are left alone.
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

export function Preview({ path, files }: Props) {
  const file = files[path];
  const kind = file ? previewKind(path) : null;
  const doc = useMemo(() => (file && kind === "html" ? inlineAssets(file.content, path, files) : ""), [file, kind, path, files]);

  if (!file) return null;
  if (kind === "html") {
    return (
      <WebPreview className="h-full rounded-none border-0" data-ide-preview="html">
        <WebPreviewBody srcDoc={doc} sandbox="allow-scripts allow-forms allow-popups allow-modals" className="bg-white" />
      </WebPreview>
    );
  }
  if (kind === "markdown") {
    return (
      <div className="h-full overflow-y-auto bg-background px-6 py-5" data-ide-preview="markdown">
        <div className="mx-auto max-w-3xl">
          <Markdown text={file.content} />
        </div>
      </div>
    );
  }
  if (kind === "svg" || kind === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] p-6" data-ide-preview={kind}>
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL from the workspace */}
        <img src={toDataUrl(file)} alt={path} className="max-h-full max-w-full rounded shadow-sm" />
      </div>
    );
  }
  return (
    <div className="flex h-full items-center justify-center p-6 text-[13px] text-muted-foreground" data-ide-preview="none">
      No preview for this file type.
    </div>
  );
}
