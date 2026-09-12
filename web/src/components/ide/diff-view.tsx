"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { unifiedMergeView } from "@codemirror/merge";
import { LanguageDescription, type LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";

type Props = { path: string; before: string | null; after: string | null; maxHeight?: string };

const theme = EditorView.theme({
  "&": { fontSize: "12px", backgroundColor: "transparent" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.5" },
  ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid var(--border)", color: "var(--muted-foreground)" },
  ".cm-changedLine": { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  ".cm-deletedChunk": { backgroundColor: "rgba(239, 68, 68, 0.10)" },
  ".cm-changedText": { background: "rgba(16, 185, 129, 0.28)" },
  ".cm-deletedText": { background: "rgba(239, 68, 68, 0.25)" },
  ".cm-deletedChunk .cm-chunkButtons": { display: "none" },
});

/** Read-only unified diff of one proposed edit (original in red, proposal in green). */
export default function DiffView({ path, before, after, maxHeight = "360px" }: Props) {
  const [loaded, setLoaded] = useState<{ path: string; support: LanguageSupport | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const description = LanguageDescription.matchFilename(languages, path.split("/").pop() ?? path);
    const promise = description ? description.load().catch(() => null) : Promise.resolve(null);
    void promise.then((support) => {
      if (!cancelled) setLoaded({ path, support });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);
  const support = loaded && loaded.path === path ? loaded.support : null;

  const extensions = useMemo<Extension[]>(() => {
    const list: Extension[] = [theme, unifiedMergeView({ original: before ?? "", mergeControls: false, highlightChanges: true, syntaxHighlightDeletions: true, gutter: true, collapseUnchanged: { margin: 3, minSize: 6 } }), EditorView.editable.of(false), EditorView.lineWrapping];
    if (support) list.push(support);
    return list;
  }, [before, support]);

  return (
    <CodeMirror
      value={after ?? ""}
      extensions={extensions}
      readOnly
      editable={false}
      theme="light"
      maxHeight={maxHeight}
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false, highlightSelectionMatches: false, searchKeymap: false }}
      className="text-[12px] [&_.cm-editor]:rounded-b-md"
      data-ide-diff={path}
    />
  );
}
