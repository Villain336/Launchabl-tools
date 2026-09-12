"use client";

import { useMemo } from "react";
import { Markdown } from "@/components/tools/chat/markdown";
import { WebPreview, WebPreviewBody } from "@/components/ai-elements/web-preview";
import { inlineAssets, toDataUrl } from "@/lib/ide/preview";
import { previewKind, type WorkspaceFile } from "@/lib/ide/workspace";

type Props = { path: string; files: Record<string, WorkspaceFile> };

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
