"use client";

import { useEffect, useMemo } from "react";
import { Markdown } from "@/components/tools/chat/markdown";
import { WebPreview, WebPreviewBody } from "@/components/ai-elements/web-preview";
import { inlineAssets, PREVIEW_MESSAGE, toDataUrl, withBridge, type PreviewRuntimeError } from "@/lib/ide/preview";
import { previewKind, type WorkspaceFile } from "@/lib/ide/workspace";

type Props = {
  path: string;
  files: Record<string, WorkspaceFile>;
  /** Called with each error the previewed page throws; `null` when a fresh document starts rendering. */
  onRuntimeError?: (path: string, error: PreviewRuntimeError | null) => void;
};

export function Preview({ path, files, onRuntimeError }: Props) {
  const file = files[path];
  const kind = file ? previewKind(path) : null;
  const doc = useMemo(() => (file && kind === "html" ? withBridge(inlineAssets(file.content, path, files)) : ""), [file, kind, path, files]);

  useEffect(() => {
    if (kind !== "html" || !onRuntimeError) return;
    onRuntimeError(path, null);
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; message?: string; line?: number | null; source?: string | null } | null;
      if (!data || data.type !== PREVIEW_MESSAGE) return;
      onRuntimeError(path, { message: String(data.message ?? "Error"), line: typeof data.line === "number" && data.line > 0 ? data.line : null, source: data.source ?? null });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [doc, kind, path, onRuntimeError]);

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
