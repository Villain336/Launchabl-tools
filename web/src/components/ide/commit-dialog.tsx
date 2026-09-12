"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, GitBranch, GitCommitHorizontal, GitPullRequest, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isValidBranchName } from "@/lib/ide/github";
import { pendingChanges, type Workspace } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

type Props = {
  workspace: Workspace & { source: { kind: "github" } };
  githubToken: string;
  onOpenChange: (open: boolean) => void;
  onCommitted: (result: { sha: string; branch: string; paths: string[] }) => void;
  onOpenSettings: () => void;
};

type Outcome = { commit: { sha: string; branch: string; url: string; created: boolean; files: number }; pullRequest: { number: number; url: string } | null };

const suggestBranch = () => `launchabl/edit-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;

export function CommitDialog({ workspace, githubToken, onOpenChange, onCommitted, onOpenSettings }: Props) {
  const changes = useMemo(() => pendingChanges(workspace), [workspace]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(changes.map((c) => c.path)));
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"same" | "new">(workspace.source.ref === workspace.source.defaultBranch ? "new" : "same");
  const [branch, setBranch] = useState(suggestBranch);
  const [openPr, setOpenPr] = useState(true);
  const [prBody, setPrBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const { owner, repo, ref } = workspace.source;
  const targetBranch = target === "same" ? ref : branch.trim();
  const branchOk = target === "same" || isValidBranchName(targetBranch);
  const canCommit = !busy && message.trim().length > 0 && selected.size > 0 && branchOk && Boolean(githubToken);

  const toggle = (path: string) =>
    setSelected((set) => {
      const next = new Set(set);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const commit = async () => {
    if (!canCommit) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ide/github", {
        method: "POST",
        headers: { "content-type": "application/json", "x-github-token": githubToken },
        body: JSON.stringify({
          action: "commit",
          owner,
          repo,
          baseBranch: ref,
          branch: targetBranch,
          message: message.trim(),
          changes: changes.filter((c) => selected.has(c.path)).map((c) => ({ path: c.path, content: c.content, binary: c.binary })),
          pullRequest: target === "new" && openPr ? { title: message.trim().split("\n")[0].slice(0, 200), body: prBody.trim() || `Edited in Launchabl's browser editor.\n\n${[...selected].map((p) => `- ${p}`).join("\n")}` } : null,
        }),
      });
      const body = (await res.json().catch(() => null)) as (Outcome & { error?: string }) | null;
      if (!res.ok || !body?.commit) throw new Error(body?.error ?? `Commit failed (${res.status}).`);
      setOutcome(body);
      // Only what was committed becomes the new baseline; files left out stay pending.
      onCommitted({ sha: body.commit.sha, branch: body.commit.branch, paths: [...selected] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" data-ide-commit>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCommitHorizontal className="size-4" /> Commit to {owner}/{repo}
          </DialogTitle>
          <DialogDescription>
            One commit with the files below, built on <code className="rounded bg-muted px-1 font-mono text-[12px]">{ref}</code>
            {workspace.source.sha ? ` (imported at ${workspace.source.sha.slice(0, 7)})` : ""}. Files not selected stay pending here.
          </DialogDescription>
        </DialogHeader>

        {outcome ? (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-[13px] dark:border-emerald-900 dark:bg-emerald-950/30" data-ide-commit-done>
            <p className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" /> Committed {outcome.commit.files} file{outcome.commit.files === 1 ? "" : "s"} to <code className="font-mono">{outcome.commit.branch}</code>
              {outcome.commit.created ? " (new branch)" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" render={<a href={outcome.commit.url} target="_blank" rel="noreferrer" />}>
                <ExternalLink className="size-3.5" /> View commit {outcome.commit.sha.slice(0, 7)}
              </Button>
              {outcome.pullRequest && (
                <Button size="sm" render={<a href={outcome.pullRequest.url} target="_blank" rel="noreferrer" />}>
                  <GitPullRequest className="size-3.5" /> Pull request #{outcome.pullRequest.number}
                </Button>
              )}
            </div>
            {selected.size !== changes.length && <p className="text-muted-foreground">The files you left out are still pending; commit them any time.</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {!githubToken && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-[12.5px] text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Committing needs a GitHub token with Contents: write.{" "}
                <button type="button" onClick={onOpenSettings} className="underline underline-offset-2">
                  Add one in Settings
                </button>
                .
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12.5px]">
                  Changes · {selected.size}/{changes.length}
                </Label>
                <button type="button" onClick={() => setSelected(selected.size === changes.length ? new Set() : new Set(changes.map((c) => c.path)))} className="text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {selected.size === changes.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <ul className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border text-[12.5px]" data-ide-commit-files>
                {changes.length === 0 && <li className="px-3 py-3 text-muted-foreground">Nothing to commit — everything matches the source.</li>}
                {changes.map((c) => (
                  <li key={c.path} className="flex items-center gap-2 px-3 py-1.5">
                    <input type="checkbox" checked={selected.has(c.path)} onChange={() => toggle(c.path)} className="accent-primary" aria-label={`Include ${c.path}`} />
                    <span className={cn("w-4 shrink-0 text-center font-mono text-[11px] font-semibold", c.kind === "added" ? "text-emerald-600" : c.kind === "deleted" ? "text-red-600" : "text-amber-600")}>{c.kind[0].toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate font-mono">{c.path}</span>
                    {!c.binary && c.kind !== "deleted" && (
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        <span className="text-emerald-600">+{c.added}</span> <span className="text-red-600">−{c.removed}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ide-commit-message" className="text-[12.5px]">
                Commit message
              </Label>
              <Textarea id="ide-commit-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Update hero copy and add pricing FAQ" rows={2} className="text-[13px]" data-ide-commit-message />
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-[12.5px] font-medium">Where</legend>
              <label className="flex items-start gap-2 text-[12.5px]">
                <input type="radio" name="ide-target" checked={target === "same"} onChange={() => setTarget("same")} className="mt-0.5 accent-primary" />
                <span>
                  Commit to <code className="rounded bg-muted px-1 font-mono text-[12px]">{ref}</code> directly
                </span>
              </label>
              <label className="flex items-start gap-2 text-[12.5px]">
                <input type="radio" name="ide-target" checked={target === "new"} onChange={() => setTarget("new")} className="mt-0.5 accent-primary" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span>New branch from {ref}</span>
                  {target === "new" && (
                    <>
                      <span className="relative block">
                        <GitBranch className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input value={branch} onChange={(e) => setBranch(e.target.value)} className="h-8 pl-7 font-mono text-[12px]" aria-label="Branch name" aria-invalid={!branchOk} spellCheck={false} data-ide-branch />
                      </span>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={openPr} onChange={(e) => setOpenPr(e.target.checked)} className="accent-primary" /> Open a pull request into {workspace.source.defaultBranch ?? ref}
                      </label>
                      {openPr && <Textarea value={prBody} onChange={(e) => setPrBody(e.target.value)} placeholder="PR description (optional) — defaults to the file list" rows={2} className="text-[12.5px]" />}
                    </>
                  )}
                </span>
              </label>
            </fieldset>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive" role="alert" data-ide-commit-error>
                {error}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {outcome ? "Done" : "Cancel"}
          </Button>
          {!outcome && (
            <Button type="button" onClick={() => void commit()} disabled={!canCommit} data-ide-commit-submit>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <GitCommitHorizontal className="size-4" />}
              {target === "new" && openPr ? "Commit & open PR" : "Commit"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
