"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror, { EditorView, type ReactCodeMirrorRef, type ViewUpdate } from "@uiw/react-codemirror";
import { LanguageDescription, type LanguageSupport } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import type { Extension } from "@codemirror/state";

export type Selection = { from: number; to: number; text: string; startLine: number; endLine: number };

type Props = {
  path: string;
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (selection: Selection | null) => void;
  wordWrap?: boolean;
  readOnly?: boolean;
  /** 1-based line to scroll to and highlight when the file opens (from search results). */
  jumpToLine?: number | null;
};

const languageCache = new Map<string, Promise<LanguageSupport | null>>();

function loadLanguage(path: string): Promise<LanguageSupport | null> {
  const name = path.split("/").pop() ?? path;
  const key = name.includes(".") ? name.slice(name.lastIndexOf(".")) : name;
  const cached = languageCache.get(key);
  if (cached) return cached;
  const description = LanguageDescription.matchFilename(languages, name);
  const promise = description ? description.load().catch(() => null) : Promise.resolve(null);
  languageCache.set(key, promise);
  return promise;
}

const baseTheme = EditorView.theme({
  "&": { fontSize: "12.5px", height: "100%", backgroundColor: "transparent" },
  ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", lineHeight: "1.55" },
  ".cm-gutters": { backgroundColor: "transparent", borderRight: "1px solid var(--border)", color: "var(--muted-foreground)" },
  ".cm-activeLineGutter": { backgroundColor: "color-mix(in oklch, var(--muted), transparent 40%)" },
  ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--muted), transparent 60%)" },
  "&.cm-focused": { outline: "none" },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": { backgroundColor: "color-mix(in oklch, var(--primary), transparent 80%) !important" },
});

/**
 * CodeMirror 6 with lazily loaded language modes. Uncontrolled edits flow up
 * through `onChange`; the parent owns the text so the assistant and the
 * commit dialog always see the same content.
 */
export default function CodeEditor({ path, value, onChange, onSelectionChange, wordWrap = false, readOnly = false, jumpToLine = null }: Props) {
  const [language, setLanguage] = useState<{ path: string; support: LanguageSupport | null } | null>(null);
  const ref = useRef<ReactCodeMirrorRef>(null);

  useEffect(() => {
    let cancelled = false;
    void loadLanguage(path).then((support) => {
      if (!cancelled) setLanguage({ path, support });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    if (!jumpToLine) return;
    const view = ref.current?.view;
    if (!view) return;
    const line = view.state.doc.line(Math.min(Math.max(1, jumpToLine), view.state.doc.lines));
    view.dispatch({ selection: { anchor: line.from, head: line.to }, effects: EditorView.scrollIntoView(line.from, { y: "center" }) });
    view.focus();
  }, [jumpToLine, path]);

  const extensions = useMemo<Extension[]>(() => {
    const list: Extension[] = [baseTheme];
    if (language && language.path === path && language.support) list.push(language.support);
    if (wordWrap) list.push(EditorView.lineWrapping);
    return list;
  }, [language, path, wordWrap]);

  // Selections are reported a beat after the pointer settles, and only when they change, so a drag doesn't re-render the shell per pixel.
  const selectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReported = useRef<string>("");
  const onUpdate = (update: ViewUpdate) => {
    if (!onSelectionChange || !update.selectionSet) return;
    if (selectionTimer.current) clearTimeout(selectionTimer.current);
    selectionTimer.current = setTimeout(() => {
      const range = update.view.state.selection.main;
      const key = range.empty ? "" : `${range.from}:${range.to}`;
      if (key === lastReported.current) return;
      lastReported.current = key;
      if (range.empty) return onSelectionChange(null);
      const state = update.view.state;
      onSelectionChange({ from: range.from, to: range.to, text: state.sliceDoc(range.from, range.to), startLine: state.doc.lineAt(range.from).number, endLine: state.doc.lineAt(range.to).number });
    }, 250);
  };
  useEffect(
    () => () => {
      if (selectionTimer.current) clearTimeout(selectionTimer.current);
    },
    [],
  );

  return (
    <CodeMirror
      ref={ref}
      value={value}
      onChange={onChange}
      onUpdate={onUpdate}
      extensions={extensions}
      readOnly={readOnly}
      editable={!readOnly}
      height="100%"
      theme="light"
      basicSetup={{ foldGutter: true, highlightActiveLine: true, bracketMatching: true, autocompletion: true, indentOnInput: true, tabSize: 2 }}
      className="h-full min-h-0 [&_.cm-editor]:h-full"
      data-ide-editor
      data-path={path}
    />
  );
}
