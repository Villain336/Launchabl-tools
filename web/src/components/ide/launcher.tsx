"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Clock3, FilePlus2, FolderUp, Loader2, Trash2, Upload } from "lucide-react";
import { IconBrandGithub as Github } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { importBrowserFiles, importZip, type ImportReport } from "@/lib/ide/import";
import { deleteWorkspace, listWorkspaces, type WorkspaceSummary } from "@/lib/ide/store";
import { createWorkspace, makeFile, type Workspace } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

type Props = {
  githubToken: string;
  onOpen: (ws: Workspace) => void;
  onOpenExisting: (id: string) => void;
  onOpenSettings: () => void;
};

const STARTER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>New page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <main>
      <h1>Hello from Launchabl</h1>
      <p>Edit <code>index.html</code>, or ask the assistant to build the page for you.</p>
    </main>
  </body>
</html>
`;

const STARTER_CSS = `:root { font-family: system-ui, sans-serif; color: #111; }
body { margin: 0; display: grid; place-items: center; min-height: 100vh; background: #fafafa; }
main { max-width: 32rem; padding: 2rem; }
h1 { font-size: 2rem; letter-spacing: -0.02em; }
code { background: #eee; padding: 0.1em 0.3em; border-radius: 4px; }
`;

function sourceLabel(source: WorkspaceSummary["source"]): string {
  if (source.kind === "github") return `${source.owner}/${source.repo} · ${source.ref}`;
  if (source.kind === "upload") return source.name;
  return "Blank project";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function describeReport(report: ImportReport): string | null {
  if (report.skipped.length === 0) return null;
  const reasons = new Map<string, number>();
  for (const s of report.skipped) reasons.set(s.reason, (reasons.get(s.reason) ?? 0) + 1);
  return `Skipped ${report.skipped.length} file${report.skipped.length === 1 ? "" : "s"} (${[...reasons].map(([r, n]) => `${n} ${r}`).join(", ")}).`;
}

/**
 * The IDE's front door. Everything here produces a Workspace in the browser;
 * GitHub imports go through our proxy as one zipball request.
 */
export function Launcher({ githubToken, onOpen, onOpenExisting, onOpenSettings }: Props) {
  const [recent, setRecent] = useState<WorkspaceSummary[] | null>(null);
  const [repo, setRepo] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const zipInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void listWorkspaces().then((list) => {
      if (!cancelled) setRecent(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = (ws: Workspace, report?: ImportReport) => {
    setNotice(report ? describeReport(report) : null);
    onOpen(ws);
  };

  const importFromGitHub = async (event: FormEvent) => {
    event.preventDefault();
    if (!repo.trim() || busy) return;
    setBusy("github");
    setError(null);
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (githubToken) headers["x-github-token"] = githubToken;
      const res = await fetch("/api/ide/github", { method: "POST", headers, body: JSON.stringify({ action: "zip", repo: repo.trim() }) });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `GitHub import failed (${res.status}).`);
      }
      const bytes = await res.arrayBuffer();
      const report = await importZip(bytes);
      const owner = res.headers.get("x-repo-owner") ?? "";
      const name = res.headers.get("x-repo-name") ?? repo.trim();
      const ref = res.headers.get("x-repo-ref") ?? "main";
      const sha = res.headers.get("x-repo-sha") || null;
      const defaultBranch = res.headers.get("x-repo-default-branch") || null;
      const ws = createWorkspace(`${owner}/${name}`, { kind: "github", owner, repo: name, ref, sha, defaultBranch }, report.files);
      finish(ws, report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "GitHub import failed.");
    } finally {
      setBusy(null);
    }
  };

  const importFiles = async (files: File[]) => {
    if (files.length === 0 || busy) return;
    setBusy("upload");
    setError(null);
    try {
      const single = files.length === 1 && /\.zip$/i.test(files[0].name) ? files[0] : null;
      const report = single ? await importZip(single) : await importBrowserFiles(files);
      if (report.files.length === 0) throw new Error("Nothing importable in that upload (binary-only or over the size limits).");
      const name = single ? single.name.replace(/\.zip$/i, "") : ((files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || files[0].name).split("/")[0] || "Upload";
      finish(createWorkspace(name, { kind: "upload", name }, report.files), report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(null);
    }
  };

  const startBlank = () => {
    const ws = createWorkspace("Untitled project", { kind: "blank" }, [makeFile("index.html", STARTER_HTML, { original: null }), makeFile("styles.css", STARTER_CSS, { original: null })]);
    finish(ws);
  };

  const remove = async (id: string) => {
    await deleteWorkspace(id);
    setRecent((list) => list?.filter((w) => w.id !== id) ?? null);
  };

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 overflow-y-auto px-4 py-8 sm:px-6"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void importFiles(Array.from(e.dataTransfer.files));
      }}
      data-ide-launcher
    >
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Open a project</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] text-muted-foreground">
          Edit a site or codebase in the browser with an assistant that reads, searches and proposes diffs you accept file by file. Files stay in this browser until you commit them to GitHub.
        </p>
      </div>

      {(error || notice) && (
        <div className={cn("rounded-lg border px-3 py-2 text-[13px]", error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-border bg-muted/40 text-muted-foreground")} role={error ? "alert" : "status"}>
          {error ?? notice}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <form onSubmit={importFromGitHub} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:col-span-3 lg:col-span-1" data-ide-github>
          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
            <Github className="h-4 w-4" /> From GitHub
          </div>
          <Input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="owner/repo or github.com URL" aria-label="Repository" autoComplete="off" spellCheck={false} />
          <p className="text-[12px] text-muted-foreground">
            Public repos need no token. For private repos or to commit back,{" "}
            <button type="button" onClick={onOpenSettings} className="underline underline-offset-2 hover:text-foreground">
              add a GitHub token
            </button>
            . Add <code className="rounded bg-muted px-1">#branch</code> to pick a branch.
          </p>
          <Button type="submit" disabled={!repo.trim() || busy !== null} className="mt-auto">
            {busy === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />} Import repository
          </Button>
        </form>

        <div className={cn("flex flex-col gap-3 rounded-xl border border-dashed p-4 transition-colors", dragging ? "border-primary bg-primary/5" : "border-border bg-card")} data-ide-upload>
          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
            <Upload className="h-4 w-4" /> Upload
          </div>
          <p className="text-[12px] text-muted-foreground">Drop a ZIP or a folder anywhere on this screen. node_modules, .git and build output are skipped; up to 60 MB.</p>
          <div className="mt-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => zipInput.current?.click()} disabled={busy !== null}>
              {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} ZIP file
            </Button>
            <Button type="button" variant="outline" onClick={() => folderInput.current?.click()} disabled={busy !== null}>
              <FolderUp className="h-4 w-4" /> Folder
            </Button>
          </div>
          <input ref={zipInput} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => void importFiles(Array.from(e.target.files ?? []))} data-ide-zip-input />
          <input
            ref={folderInput}
            type="file"
            multiple
            className="hidden"
            // Non-standard but supported by every desktop browser that matters.
            {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
            onChange={(e) => void importFiles(Array.from(e.target.files ?? []))}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-[14px] font-medium text-foreground">
            <FilePlus2 className="h-4 w-4" /> Start blank
          </div>
          <p className="text-[12px] text-muted-foreground">A page and a stylesheet to begin with. Ask the assistant for a landing page, an email template, a script.</p>
          <Button type="button" variant="outline" onClick={startBlank} className="mt-auto" disabled={busy !== null} data-ide-blank>
            <FilePlus2 className="h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium uppercase tracking-wide text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> Recent
        </h2>
        {recent === null ? (
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        ) : recent.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">Projects you open show up here. They&apos;re stored in this browser only.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card" data-ide-recent>
            {recent.map((ws) => (
              <li key={ws.id} className="flex items-center gap-3 px-3 py-2.5">
                <button type="button" onClick={() => onOpenExisting(ws.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13.5px] font-medium text-foreground">{ws.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {sourceLabel(ws.source)} · {ws.files} files · {timeAgo(ws.updatedAt)}
                  </span>
                </button>
                <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove ${ws.name}`} onClick={() => void remove(ws.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11.5px] text-muted-foreground">
        Limits: 60 MB per project, 4,000 files, text files up to 1.5 MB. The assistant only sees the file list and the files it reads or you have open.
      </p>
    </div>
  );
}
