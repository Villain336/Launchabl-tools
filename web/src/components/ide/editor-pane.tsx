"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { AlertTriangle, CircleAlert, CircleCheck, Code2, Columns2, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Preview } from "@/components/ide/preview";
import type { Selection } from "@/components/ide/code-editor";
import type { Problem } from "@/lib/ide/checks";
import type { PreviewRuntimeError } from "@/lib/ide/preview";
import { formatBytes, isDirty, isNew, languageOf, previewKind, type WorkspaceFile } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

const CodeEditor = dynamic(() => import("@/components/ide/code-editor"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-[12.5px] text-muted-foreground">Loading editor…</div>,
});

type Props = {
  files: Record<string, WorkspaceFile>;
  tabs: string[];
  activePath: string | null;
  jumpToLine: number | null;
  wordWrap: boolean;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
  onChange: (path: string, content: string) => void;
  onSelectionChange: (selection: Selection | null) => void;
  /** Static + runtime problems for changed files and the active file. */
  problems: Problem[];
  onOpen: (path: string, line?: number) => void;
  onRuntimeError: (path: string, error: PreviewRuntimeError | null) => void;
};

type View = "code" | "preview" | "split";

export function EditorPane({ files, tabs, activePath, jumpToLine, wordWrap, onActivate, onClose, onChange, onSelectionChange, problems, onOpen, onRuntimeError }: Props) {
  const [view, setView] = useState<View>("code");
  const [showProblems, setShowProblems] = useState(false);
  const file = activePath ? files[activePath] : null;
  const previewable = file ? previewKind(file.path) !== null : false;
  const effectiveView: View = previewable ? view : "code";
  const errors = problems.filter((p) => p.severity === "error").length;
  const warnings = problems.length - errors;

  return (
    <div className="flex h-full min-h-0 flex-col" data-ide-editor-pane>
      <div className="flex items-stretch border-b border-border bg-muted/30">
        <div className="flex min-w-0 flex-1 overflow-x-auto" role="tablist" aria-label="Open files">
          {tabs.map((path) => {
            const f = files[path];
            const active = path === activePath;
            const dirty = f ? isDirty(f) || isNew(f) : false;
            return (
              <div
                key={path}
                role="tab"
                aria-selected={active}
                tabIndex={0}
                onClick={() => onActivate(path)}
                onKeyDown={(e) => e.key === "Enter" && onActivate(path)}
                onAuxClick={(e) => e.button === 1 && onClose(path)}
                className={cn(
                  "group/tab flex max-w-[220px] shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 text-[12.5px]",
                  active ? "bg-background text-foreground shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
                data-ide-tab={path}
                data-active={active || undefined}
              >
                <span className="truncate">{path.split("/").pop()}</span>
                {dirty && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Unsaved to source" />}
                <button
                  type="button"
                  aria-label={`Close ${path}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(path);
                  }}
                  className={cn("rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground", active ? "opacity-70" : "opacity-0 group-hover/tab:opacity-70")}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
        {previewable && (
          <div className="flex shrink-0 items-center gap-0.5 px-1.5" role="group" aria-label="View">
            {(
              [
                ["code", Code2, "Code"],
                ["split", Columns2, "Split"],
                ["preview", Eye, "Preview"],
              ] as const
            ).map(([id, Icon, label]) => (
              <Button key={id} type="button" variant={effectiveView === id ? "secondary" : "ghost"} size="icon-xs" aria-label={label} title={label} aria-pressed={effectiveView === id} onClick={() => setView(id)} data-ide-view={id}>
                <Icon className="size-3.5" />
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        {!file || !activePath ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-[13px] text-muted-foreground">
            <p>Pick a file on the left, or ask the assistant to make a change.</p>
            <p className="text-[12px]">Cmd/Ctrl+S is automatic — everything is kept in this browser as you type.</p>
          </div>
        ) : file.binary ? (
          previewKind(activePath) ? (
            <Preview path={activePath} files={files} onRuntimeError={onRuntimeError} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-[13px] text-muted-foreground">
              <p className="font-medium text-foreground">{activePath.split("/").pop()}</p>
              <p>Binary file · {formatBytes(file.size)}. It will be committed as-is.</p>
            </div>
          )
        ) : (
          <div className={cn("grid h-full min-h-0", effectiveView === "split" ? "grid-cols-2" : "grid-cols-1")}>
            {effectiveView !== "preview" && (
              <div className={cn("min-h-0 min-w-0 overflow-hidden", effectiveView === "split" && "border-r border-border")}>
                <CodeEditor key={activePath} path={activePath} value={file.content} onChange={(value) => onChange(activePath, value)} onSelectionChange={onSelectionChange} wordWrap={wordWrap} jumpToLine={jumpToLine} />
              </div>
            )}
            {effectiveView !== "code" && (
              <div className="min-h-0 min-w-0 overflow-hidden">
                <Preview path={activePath} files={files} onRuntimeError={onRuntimeError} />
              </div>
            )}
          </div>
        )}
      </div>

      {showProblems && (
        <div className="max-h-[40%] shrink-0 overflow-y-auto border-t border-border bg-background" data-ide-problems>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11.5px] text-muted-foreground">
            <span className="font-medium text-foreground">Problems</span>
            <span>
              {errors} error{errors === 1 ? "" : "s"}, {warnings} warning{warnings === 1 ? "" : "s"} · changed files and the open file
            </span>
            <button type="button" aria-label="Close problems" onClick={() => setShowProblems(false)} className="ml-auto rounded p-0.5 hover:bg-muted hover:text-foreground">
              <X className="size-3.5" />
            </button>
          </div>
          {problems.length === 0 ? (
            <p className="px-3 pb-3 text-[12px] text-muted-foreground">Nothing found. JSON and JavaScript syntax, HTML structure and broken local links, CSS braces, and errors thrown by the preview are checked here; TypeScript and JSX need the project&apos;s own build.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {problems.map((p, i) => (
                <li key={`${p.path}:${p.line}:${p.message}:${i}`}>
                  <button type="button" onClick={() => onOpen(p.path, p.line ?? undefined)} className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-muted/60" data-ide-problem={p.severity} data-source={p.source}>
                    {p.severity === "error" ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-red-600" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />}
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground">{p.message}</span>
                      <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                        {p.path}
                        {p.line !== null ? `:${p.line}` : ""}
                        {p.source === "runtime" ? " · preview" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {file && activePath && (
        <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-3 py-1 text-[11px] text-muted-foreground" data-ide-status>
          <button
            type="button"
            onClick={() => setShowProblems((s) => !s)}
            aria-pressed={showProblems}
            title="Problems in changed files and the open file"
            className={cn("flex shrink-0 items-center gap-1 rounded px-1 hover:bg-muted hover:text-foreground", errors > 0 ? "text-red-600" : warnings > 0 ? "text-amber-600" : "")}
            data-ide-problem-count={problems.length}
          >
            {errors > 0 ? <CircleAlert className="size-3" /> : warnings > 0 ? <AlertTriangle className="size-3" /> : <CircleCheck className="size-3" />}
            {problems.length === 0 ? "No problems" : `${problems.length} problem${problems.length === 1 ? "" : "s"}`}
          </button>
          <span className="truncate font-mono">{activePath}</span>
          <span className="ml-auto shrink-0">{languageOf(activePath)}</span>
          <span className="shrink-0">{formatBytes(file.size)}</span>
          {!file.binary && <span className="shrink-0">{file.content.split("\n").length} lines</span>}
          {isNew(file) ? <span className="shrink-0 text-emerald-600">new</span> : isDirty(file) ? <span className="shrink-0 text-amber-600">modified</span> : <span className="shrink-0">unchanged</span>}
        </div>
      )}
    </div>
  );
}
