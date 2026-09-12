"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bot, Download, FolderClosed, GitCommitHorizontal, PanelLeft, Settings2, X } from "lucide-react";
import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Assistant } from "@/components/ide/assistant";
import type { Selection } from "@/components/ide/code-editor";
import { CommitDialog } from "@/components/ide/commit-dialog";
import { EditorPane } from "@/components/ide/editor-pane";
import { Explorer } from "@/components/ide/explorer";
import { Launcher } from "@/components/ide/launcher";
import { SettingsDialog } from "@/components/ide/settings-dialog";
import { useWorkspace } from "@/components/ide/use-workspace";
import { runChecks, type Problem } from "@/lib/ide/checks";
import { exportZip } from "@/lib/ide/import";
import type { PreviewRuntimeError } from "@/lib/ide/preview";
import { loadSettings, saveSettings, type IdeSettings } from "@/lib/ide/store";
import { pendingChanges, type AppliedEdit, type Workspace } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

/**
 * The editor shell: explorer | editor + preview | assistant. The workspace is
 * the single source of truth; every pane reads from it and writes through the
 * hook so autosave, the assistant's tools and the commit dialog agree.
 */
export function Ide() {
  const ws = useWorkspace();
  const { workspace } = ws;
  const [settings, setSettings] = useState<IdeSettings>(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commitOpen, setCommitOpen] = useState(false);
  const [rawTabs, setTabs] = useState<string[]>([]);
  const [rawActive, setActivePath] = useState<string | null>(null);
  // Tabs pointing at files that no longer exist (deleted, renamed, accepted delete) drop out.
  const tabs = useMemo(() => (workspace ? rawTabs.filter((p) => workspace.files[p]) : rawTabs), [rawTabs, workspace]);
  const activePath = workspace && rawActive && !workspace.files[rawActive] ? null : rawActive;
  const [jumpToLine, setJumpToLine] = useState<number | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [showAssistant, setShowAssistant] = useState(true);
  const [mobileView, setMobileView] = useState<"files" | "editor" | "chat">("editor");
  const [selection, setSelection] = useState<Selection | null>(null);

  const open = useCallback((path: string, line?: number) => {
    setTabs((current) => (current.includes(path) ? current : [...current, path]));
    setActivePath(path);
    setJumpToLine(line ?? null);
  }, []);

  const close = useCallback(
    (path: string) => {
      setTabs((current) => {
        const index = current.indexOf(path);
        const next = current.filter((p) => p !== path);
        setActivePath((active) => (active === path ? next[Math.min(index, next.length - 1)] ?? null : active));
        return next;
      });
    },
    [],
  );

  const onOpenWorkspace = useCallback(
    (next: Workspace) => {
      ws.setWorkspace(next);
      setTabs([]);
      setActivePath(null);
      // Land on the obvious entry file when there is one.
      const entry = ["index.html", "README.md", "readme.md", "src/app/page.tsx", "app/page.tsx", "src/index.ts", "index.js", "package.json"].find((p) => next.files[p]);
      if (entry) {
        setTabs([entry]);
        setActivePath(entry);
      }
    },
    [ws],
  );

  const onOpenExisting = useCallback(
    async (id: string) => {
      const loaded = await ws.openWorkspace(id);
      if (loaded) onOpenWorkspace(loaded);
    },
    [ws, onOpenWorkspace],
  );

  const onAcceptEdits = useCallback(
    (edits: AppliedEdit[]) => {
      ws.acceptEdits(edits);
      const first = edits.find((e) => e.ok && e.after !== null);
      if (first) open(first.path);
    },
    [ws, open],
  );

  const updateSettings = (next: IdeSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const download = async () => {
    if (!workspace) return;
    const blob = await exportZip(workspace.files);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspace.name.replace(/[^\w.-]+/g, "-")}.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2_000);
  };

  const pending = useMemo(() => (workspace ? pendingChanges(workspace).length : 0), [workspace]);
  const github = workspace?.source.kind === "github" ? workspace.source : null;

  // Problems: static checks on changed files plus the open file (debounced so
  // typing stays smooth), and whatever the preview iframe threw.
  const [staticProblems, setStaticProblems] = useState<Problem[]>([]);
  const [runtime, setRuntime] = useState<Record<string, PreviewRuntimeError[]>>({});
  const files = workspace?.files;
  useEffect(() => {
    if (!workspace || !files) return;
    const timer = setTimeout(() => {
      const paths = new Set(pendingChanges(workspace).map((c) => c.path));
      if (activePath) paths.add(activePath);
      setStaticProblems(runChecks(files, [...paths]));
    }, 300);
    return () => clearTimeout(timer);
  }, [workspace, files, activePath]);
  const onRuntimeError = useCallback((path: string, error: PreviewRuntimeError | null) => {
    setRuntime((current) => {
      if (error === null) return current[path]?.length ? { ...current, [path]: [] } : current;
      const list = current[path] ?? [];
      if (list.length >= 20 || list.some((e) => e.message === error.message && e.line === error.line)) return current;
      return { ...current, [path]: [...list, error] };
    });
  }, []);
  const problems = useMemo<Problem[]>(() => {
    const runtimeProblems: Problem[] = [];
    for (const [path, errors] of Object.entries(runtime)) {
      if (!files?.[path]) continue;
      for (const e of errors) runtimeProblems.push({ path, line: e.line, severity: "error", message: e.source === "console.error" ? `console.error: ${e.message}` : e.message, source: "runtime" });
    }
    return [...staticProblems.filter((p) => files?.[p.path]), ...runtimeProblems];
  }, [staticProblems, runtime, files]);

  if (ws.loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground" data-ide-loading>
        Opening your workspace…
      </div>
    );
  }

  if (!workspace) {
    return (
      <>
        <div className="flex items-center gap-3 border-b border-border px-3 py-2 sm:px-6">
          <Link href="/tools" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> All tools
          </Link>
          <span className="text-muted-foreground/40">·</span>
          <h1 className="text-[15px] font-semibold text-foreground">Code editor</h1>
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="size-3.5" /> Settings
          </Button>
        </div>
        <Launcher githubToken={settings.githubToken} onOpen={onOpenWorkspace} onOpenExisting={(id) => void onOpenExisting(id)} onOpenSettings={() => setSettingsOpen(true)} />
        {settingsOpen && <SettingsDialog open settings={settings} onOpenChange={setSettingsOpen} onSave={updateSettings} />}
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-0 flex-1 flex-col" data-ide data-workspace={workspace.id}>
        <div className="flex items-center gap-2 border-b border-border px-2 py-1.5 sm:px-3">
          <Button type="button" variant="ghost" size="icon-xs" className="hidden md:inline-flex" aria-label={showExplorer ? "Hide files" : "Show files"} aria-pressed={showExplorer} onClick={() => setShowExplorer((s) => !s)} data-ide-toggle-explorer>
            <PanelLeft className="size-3.5" />
          </Button>
          <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
            {github ? <IconBrandGithub className="size-3.5 shrink-0 text-muted-foreground" /> : <FolderClosed className="size-3.5 shrink-0 text-muted-foreground" />}
            <span className="truncate font-medium text-foreground" data-ide-name>
              {workspace.name}
            </span>
            {github && <span className="hidden truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:inline">{github.ref}</span>}
            {pending > 0 && (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400" data-ide-pending>
                {pending} change{pending === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <span className="ml-auto" />
          {github && (
            <Button type="button" size="sm" onClick={() => setCommitOpen(true)} disabled={pending === 0} data-ide-open-commit>
              <GitCommitHorizontal className="size-3.5" /> Commit
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => void download()} title="Download as ZIP" data-ide-download>
            <Download className="size-3.5" /> <span className="hidden sm:inline">ZIP</span>
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" className="hidden md:inline-flex" aria-label={showAssistant ? "Hide assistant" : "Show assistant"} aria-pressed={showAssistant} onClick={() => setShowAssistant((s) => !s)} data-ide-toggle-assistant>
            <Bot className="size-3.5" />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label="Close project" title="Close project" onClick={() => void ws.closeWorkspace()} data-ide-close>
            <X className="size-3.5" />
          </Button>
        </div>

        <div
          className={cn(
            "grid min-h-0 flex-1 grid-cols-1",
            showExplorer && showAssistant ? "md:grid-cols-[220px_minmax(0,1fr)_minmax(320px,30%)]" : showExplorer ? "md:grid-cols-[220px_minmax(0,1fr)]" : showAssistant ? "md:grid-cols-[minmax(0,1fr)_minmax(320px,30%)]" : "md:grid-cols-1",
          )}
        >
          <aside className={cn("min-h-0 border-r border-border bg-muted/20", mobileView === "files" ? "block" : "hidden", showExplorer ? "md:block" : "md:hidden")}>
            <Explorer
              files={workspace.files}
              activePath={activePath}
              onOpen={(path, line) => {
                open(path, line);
                setMobileView("editor");
              }}
              onCreate={ws.createFile}
              onRename={ws.renameFile}
              onDelete={(path) => ws.deleteFile(path)}
            />
          </aside>
          <section className={cn("min-h-0 min-w-0", mobileView === "editor" ? "block" : "hidden", "md:block")}>
            <EditorPane
              files={workspace.files}
              tabs={tabs}
              activePath={activePath}
              jumpToLine={jumpToLine}
              wordWrap={settings.wordWrap}
              onActivate={(path) => open(path)}
              onClose={close}
              onChange={ws.updateFile}
              onSelectionChange={setSelection}
              problems={problems}
              onOpen={open}
              onRuntimeError={onRuntimeError}
            />
          </section>
          <aside className={cn("min-h-0 border-l border-border", mobileView === "chat" ? "block" : "hidden", showAssistant ? "md:block" : "md:hidden")}>
            <Assistant
              workspace={workspace}
              activePath={activePath}
              selection={selection}
              settings={settings}
              runtimeProblems={problems.filter((p) => p.source === "runtime")}
              onAcceptEdits={onAcceptEdits}
              onOpenFile={(path) => {
                open(path);
                setMobileView("editor");
              }}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          </aside>
        </div>

        <div className="flex border-t border-border md:hidden" role="tablist" aria-label="Panels">
          {(
            [
              ["files", "Files"],
              ["editor", "Editor"],
              ["chat", "Assistant"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={mobileView === id} onClick={() => setMobileView(id)} className={cn("flex-1 py-2 text-[12.5px]", mobileView === id ? "font-medium text-primary" : "text-muted-foreground")}>
              {label}
            </button>
          ))}
        </div>

        {settingsOpen && <SettingsDialog open settings={settings} onOpenChange={setSettingsOpen} onSave={updateSettings} />}
        {commitOpen && github && (
          <CommitDialog
            workspace={workspace as Workspace & { source: { kind: "github" } }}
            githubToken={settings.githubToken}
            onOpenChange={setCommitOpen}
            onCommitted={({ sha, branch, paths }) => ws.markClean(sha, branch, paths)}
            onOpenSettings={() => {
              setCommitOpen(false);
              setSettingsOpen(true);
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

