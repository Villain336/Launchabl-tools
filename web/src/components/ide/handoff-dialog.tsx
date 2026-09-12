"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditReview } from "@/components/ide/edit-review";
import { annotateEdits } from "@/lib/ide/checks";
import type { Handoff } from "@/lib/ide/handoff";
import { previewEdits, type AppliedEdit, type ProposedEdit, type Review, type Workspace } from "@/lib/ide/workspace";

type Props = {
  handoff: Handoff;
  workspace: Workspace;
  onAccept: (edits: AppliedEdit[]) => void;
  /** Called once every file is decided or the user dismisses; the caller clears the staged entry. */
  onDone: () => void;
};

function buildReview(handoff: Handoff, workspace: Workspace): Review {
  const proposed: ProposedEdit[] = handoff.files.map((f) => (workspace.files[f.path] ? { path: f.path, kind: "replace", content: f.content } : { path: f.path, kind: "create", content: f.content }));
  const edits = annotateEdits(workspace.files, previewEdits(workspace.files, proposed));
  const decisions: Review["decisions"] = {};
  for (const e of edits) if (e.ok) decisions[e.path] = "pending";
  return { summary: `${handoff.title} · from ${handoff.from}`, edits, decisions };
}

/**
 * Files handed over from another Launchabl tool, reviewed like an assistant
 * proposal: a diff per file against the open project, accept or reject each.
 */
export function HandoffDialog({ handoff, workspace, onAccept, onDone }: Props) {
  const [review, setReview] = useState<Review>(() => buildReview(handoff, workspace));
  const pending = review.edits.filter((e) => e.ok && review.decisions[e.path] === "pending").length;

  const decide = (paths: string[], decision: "accepted" | "rejected") => {
    if (decision === "accepted") onAccept(review.edits.filter((e) => e.ok && paths.includes(e.path)));
    const decisions = { ...review.decisions };
    for (const p of paths) decisions[p] = decision;
    setReview({ ...review, decisions });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="sm:max-w-3xl" data-ide-handoff>
        <DialogHeader>
          <DialogTitle>Add to {workspace.name}?</DialogTitle>
          <DialogDescription>
            {handoff.from} produced {handoff.files.length} file{handoff.files.length === 1 ? "" : "s"}. Files that already exist show as a diff; nothing changes until you accept. To merge into an existing page instead, accept the file and ask the assistant.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <EditReview review={review} onDecide={decide} />
        </div>
        <DialogFooter>
          <Button type="button" variant={pending === 0 ? "default" : "outline"} onClick={onDone} data-ide-handoff-done>
            {pending === 0 ? "Done" : "Skip the rest"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
