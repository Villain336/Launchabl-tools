"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { FileCode2, FileImage, FileJson, FileText, FilePlus2, FolderPlus, Pencil, Search, Trash2, X } from "lucide-react";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/components/ai-elements/file-tree";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ancestorsOf, buildTree, languageOf, previewKind, searchWorkspace, type SearchHit, type TreeNode, type WorkspaceFile } from "@/lib/ide/workspace";
import { cn } from "@/lib/utils";

type Props = {
  files: Record<string, WorkspaceFile>;
  activePath: string | null;
  onOpen: (path: string, line?: number) => void;
  onCreate: (path: string) => string | null;
  onRename: (from: string, to: string) => string | null;
  onDelete: (path: string) => void;
};

function iconFor(path: string, binary: boolean) {
  const kind = previewKind(path);
  if (kind === "image" || kind === "svg") return <FileImage className="size-4 text-violet-500" />;
  if (binary) return <FileText className="size-4 text-muted-foreground/70" />;
  const lang = languageOf(path);
  if (lang === "json" || lang === "yaml" || lang === "toml") return <FileJson className="size-4 text-amber-500" />;
  if (lang === "markdown" || lang === "text") return <FileText className="size-4 text-muted-foreground" />;
  return <FileCode2 className="size-4 text-sky-600" />;
}

/**
 * Folder tree over the workspace, plus content search. Rename and delete act
 * on the selected file; new files go into the selected file's folder.
 */
export function Explorer({ files, activePath, onOpen, onCreate, onRename, onDelete }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<{ mode: "create" | "rename"; base: string; value: string; error: string | null } | null>(null);

  const tree = useMemo(() => buildTree(files), [files]);
  const hits = useMemo(() => (query.trim().length >= 2 ? searchWorkspace(files, query, { limit: 80 }) : []), [files, query]);
  const pathMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return Object.keys(files)
      .filter((p) => p.toLowerCase().includes(q))
      .sort()
      .slice(0, 40);
  }, [files, query]);

  // Folders on the way to the active file are always open, on top of what the user toggled.
  const effectiveExpanded = useMemo(() => {
    if (!activePath) return expanded;
    const next = new Set(expanded);
    for (const dir of ancestorsOf(activePath)) next.add(dir);
    return next;
  }, [expanded, activePath]);

  const folderOf = (path: string | null) => (path && path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");

  const startCreate = () => setEditing({ mode: "create", base: folderOf(activePath), value: "", error: null });
  const startRename = () => {
    if (!activePath) return;
    setEditing({ mode: "rename", base: "", value: activePath, error: null });
  };

  const commitEdit = () => {
    if (!editing) return;
    const value = editing.value.trim();
    if (!value) return setEditing(null);
    if (editing.mode === "create") {
      const path = editing.base ? `${editing.base}/${value}` : value;
      const created = onCreate(path);
      if (!created) return setEditing({ ...editing, error: files[path] ? "A file with that name exists." : "That path isn't valid." });
      onOpen(created);
    } else {
      if (value === activePath) return setEditing(null);
      const renamed = onRename(activePath!, value);
      if (!renamed) return setEditing({ ...editing, error: files[value] ? "A file with that name exists." : "That path isn't valid." });
      onOpen(renamed);
    }
    setEditing(null);
  };

  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") setEditing(null);
  };

  const renderNode = (node: TreeNode) =>
    node.kind === "dir" ? (
      <FileTreeFolder key={node.path} path={node.path} name={node.name}>
        {node.children.map(renderNode)}
      </FileTreeFolder>
    ) : (
      <FileTreeFile key={node.path} path={node.path} name={node.name} className={cn("group/file", node.dirty && "text-amber-700 dark:text-amber-400")} data-path={node.path} data-dirty={node.dirty || undefined}>
        <span className="size-4 shrink-0" />
        <span className="shrink-0">{iconFor(node.path, node.binary)}</span>
        <span className="truncate">{node.name}</span>
        {node.dirty && <span className="ml-1 size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Modified" />}
      </FileTreeFile>
    );

  const searching = query.trim().length >= 2;

  return (
    <div className="flex h-full min-h-0 flex-col" data-ide-explorer>
      <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
        <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Files</span>
        <span className="ml-auto" />
        <Button type="button" variant="ghost" size="icon-xs" aria-label="New file" title="New file" onClick={startCreate} data-ide-new-file>
          <FilePlus2 className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="New folder (type folder/name.ext)" title="New file in a folder" onClick={() => setEditing({ mode: "create", base: folderOf(activePath), value: "folder/", error: null })}>
          <FolderPlus className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Rename" title="Rename selected" onClick={startRename} disabled={!activePath}>
          <Pencil className="size-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Delete" title="Delete selected" disabled={!activePath} onClick={() => activePath && window.confirm(`Delete ${activePath}?`) && onDelete(activePath)} data-ide-delete-file>
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="relative border-b border-border px-2 py-1.5">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files and contents" aria-label="Search workspace" className="h-7 pl-7 pr-7 text-[12.5px]" data-ide-search />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {editing && (
        <div className="border-b border-border bg-muted/40 px-2 py-2" data-ide-path-editor>
          <div className="flex items-center gap-1">
            {editing.mode === "create" && editing.base && <span className="max-w-[40%] truncate font-mono text-[11.5px] text-muted-foreground">{editing.base}/</span>}
            <Input
              autoFocus
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value, error: null })}
              onKeyDown={onEditKey}
              onBlur={() => {
                // Give the click on the tick a chance; otherwise cancel on blur so a stray tab doesn't leave the box open.
                setTimeout(() => setEditing((state) => (state && state.value === editing.value && !state.error ? null : state)), 150);
              }}
              placeholder={editing.mode === "create" ? "name.ext or folder/name.ext" : "new/path.ext"}
              aria-label={editing.mode === "create" ? "New file path" : "New name"}
              className="h-7 font-mono text-[12px]"
              spellCheck={false}
            />
          </div>
          {editing.error && <p className="mt-1 text-[11.5px] text-destructive">{editing.error}</p>}
          <p className="mt-1 text-[11px] text-muted-foreground">Enter to {editing.mode === "create" ? "create" : "rename"} · Esc to cancel</p>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {searching ? (
          <SearchResults query={query} pathMatches={pathMatches} hits={hits} onOpen={onOpen} />
        ) : tree.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">No files yet. Create one, or ask the assistant.</p>
        ) : (
          <FileTree expanded={effectiveExpanded} onExpandedChange={setExpanded} selectedPath={activePath ?? undefined} onSelect={(path) => files[path] && onOpen(path)} className="rounded-none border-0 bg-transparent text-[12.5px] [&>div]:p-1">
            {tree.map(renderNode)}
          </FileTree>
        )}
      </div>
    </div>
  );
}

function SearchResults({ query, pathMatches, hits, onOpen }: { query: string; pathMatches: string[]; hits: SearchHit[]; onOpen: (path: string, line?: number) => void }) {
  if (pathMatches.length === 0 && hits.length === 0) return <p className="px-3 py-6 text-center text-[12.5px] text-muted-foreground">Nothing matches “{query}”.</p>;
  return (
    <div className="py-1 text-[12.5px]" data-ide-search-results>
      {pathMatches.length > 0 && (
        <div className="mb-2">
          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Files</p>
          {pathMatches.map((path) => (
            <button key={path} type="button" onClick={() => onOpen(path)} className="block w-full truncate px-3 py-1 text-left font-mono text-[12px] hover:bg-muted">
              {path}
            </button>
          ))}
        </div>
      )}
      {hits.length > 0 && (
        <div>
          <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">In files</p>
          {hits.map((hit, i) => (
            <button key={`${hit.path}:${hit.line}:${i}`} type="button" onClick={() => onOpen(hit.path, hit.line)} className="block w-full px-3 py-1 text-left hover:bg-muted">
              <span className="block truncate font-mono text-[11.5px] text-muted-foreground">
                {hit.path}:{hit.line}
              </span>
              <span className="block truncate font-mono text-[12px] text-foreground">{hit.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
