/**
 * IDE workspace model. A workspace is a flat map of path → file that lives
 * in the browser (IndexedDB); nothing is uploaded unless the user commits to
 * a repo. Pure helpers here so they're unit-testable; persistence and the
 * GitHub client are separate modules.
 */

export type WorkspaceSource =
  | { kind: "blank" }
  | { kind: "upload"; name: string }
  | { kind: "github"; owner: string; repo: string; ref: string; sha: string | null; defaultBranch: string | null };

export type WorkspaceFile = {
  path: string;
  /** UTF-8 text. Binary files are kept as base64 with `binary: true`. */
  content: string;
  binary: boolean;
  size: number;
  /** Content as imported, for dirty tracking and diffs against the source. */
  original: string | null;
};

export type Workspace = {
  id: string;
  name: string;
  source: WorkspaceSource;
  files: Record<string, WorkspaceFile>;
  /** Paths that existed in the source and were deleted or renamed away; committed as deletions. */
  tombstones?: string[];
  createdAt: string;
  updatedAt: string;
};

export type TreeNode =
  | { kind: "dir"; name: string; path: string; children: TreeNode[] }
  | { kind: "file"; name: string; path: string; size: number; dirty: boolean; binary: boolean };

export const WORKSPACE_LIMITS = {
  files: 4_000,
  /** Per text file, in bytes; bigger files are kept binary (read-only). */
  textBytes: 1_500_000,
  totalBytes: 60_000_000,
} as const;

/** Paths we never import: dependency trees, build output, VCS internals. */
export const IGNORED_SEGMENTS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  ".cache",
  ".parcel-cache",
  "dist",
  "build",
  "out",
  "coverage",
  "__pycache__",
  ".venv",
  "venv",
  ".DS_Store",
  "Thumbs.db",
]);

export function isIgnoredPath(path: string): boolean {
  return path.split("/").some((segment) => IGNORED_SEGMENTS.has(segment));
}

export const workspaceId = () => `ws_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export function normalisePath(raw: string): string {
  const parts: string[] = [];
  for (const segment of raw.replace(/\\/g, "/").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join("/");
}

export function isValidPath(path: string): boolean {
  return path.length > 0 && path.length <= 400 && !path.startsWith("/") && !/[\u0000-\u001f]/.test(path) && normalisePath(path) === path;
}

export function extensionOf(path: string): string {
  const name = path.split("/").pop() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : name.toLowerCase();
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  md: "markdown",
  mdx: "markdown",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  py: "python",
  rb: "ruby",
  php: "php",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  xml: "xml",
  svg: "xml",
  sql: "sql",
  vue: "vue",
  svelte: "svelte",
  astro: "astro",
  graphql: "graphql",
  gql: "graphql",
  env: "shell",
  dockerfile: "dockerfile",
  txt: "text",
  csv: "text",
  lock: "text",
};

/** Language id for syntax highlighting and for the model's context. */
export function languageOf(path: string): string {
  const name = (path.split("/").pop() ?? "").toLowerCase();
  if (name === "dockerfile") return "dockerfile";
  if (name.startsWith(".env")) return "shell";
  if (name === "makefile") return "makefile";
  return LANGUAGE_BY_EXT[extensionOf(path)] ?? "text";
}

const BINARY_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "avif", "ico", "bmp", "tiff", "pdf", "zip", "gz", "tar", "woff", "woff2", "ttf", "otf", "eot", "mp3", "mp4", "mov", "webm", "wav", "ogg", "psd", "ai", "sketch", "fig", "exe", "dll", "so", "dylib", "wasm", "jar", "class", "pyc"]);

export function looksBinaryByName(path: string): boolean {
  return BINARY_EXT.has(extensionOf(path));
}

/** Sniff the first bytes: NUL bytes or a high share of control characters → binary. */
export function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.subarray(0, Math.min(bytes.length, 8_000));
  let suspicious = 0;
  for (const b of sample) {
    if (b === 0) return true;
    if (b < 7 || (b > 14 && b < 32 && b !== 27)) suspicious++;
  }
  return sample.length > 0 && suspicious / sample.length > 0.1;
}

export function previewKind(path: string): "html" | "markdown" | "svg" | "image" | null {
  const ext = extensionOf(path);
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "md" || ext === "mdx") return "markdown";
  if (ext === "svg") return "svg";
  if (["png", "jpg", "jpeg", "gif", "webp", "avif", "ico", "bmp"].includes(ext)) return "image";
  return null;
}

export function mimeOf(path: string): string {
  const ext = extensionOf(path);
  const map: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", avif: "image/avif", ico: "image/x-icon", bmp: "image/bmp", svg: "image/svg+xml", pdf: "application/pdf", html: "text/html", css: "text/css", js: "text/javascript", json: "application/json", md: "text/markdown" };
  return map[ext] ?? "application/octet-stream";
}

export function makeFile(path: string, content: string, options: { binary?: boolean; original?: string | null; size?: number } = {}): WorkspaceFile {
  const binary = options.binary ?? false;
  return {
    path,
    content,
    binary,
    size: options.size ?? (binary ? Math.floor((content.length * 3) / 4) : new TextEncoder().encode(content).length),
    original: options.original === undefined ? content : options.original,
  };
}

export function createWorkspace(name: string, source: WorkspaceSource, files: WorkspaceFile[] = []): Workspace {
  const now = new Date().toISOString();
  const map: Record<string, WorkspaceFile> = {};
  for (const file of files) map[file.path] = file;
  return { id: workspaceId(), name, source, files: map, createdAt: now, updatedAt: now };
}

export const isDirty = (file: WorkspaceFile) => file.original !== null && file.original !== file.content;
export const isNew = (file: WorkspaceFile) => file.original === null;

export function dirtyFiles(ws: Workspace): WorkspaceFile[] {
  return Object.values(ws.files).filter((f) => isDirty(f) || isNew(f));
}

export type PendingChange = { path: string; kind: "added" | "modified" | "deleted"; content: string | null; binary: boolean; added: number; removed: number };

/** Everything a commit would carry: new and modified files plus deletions of files that came from the source. */
export function pendingChanges(ws: Workspace): PendingChange[] {
  const out: PendingChange[] = [];
  for (const file of Object.values(ws.files)) {
    if (isNew(file)) out.push({ path: file.path, kind: "added", content: file.content, binary: file.binary, ...(file.binary ? { added: 0, removed: 0 } : diffStats(null, file.content)) });
    else if (isDirty(file)) out.push({ path: file.path, kind: "modified", content: file.content, binary: file.binary, ...(file.binary ? { added: 0, removed: 0 } : diffStats(file.original, file.content)) });
  }
  for (const path of ws.tombstones ?? []) {
    if (ws.files[path]) continue;
    out.push({ path, kind: "deleted", content: null, binary: false, added: 0, removed: 0 });
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

/** Remove a file, remembering it for the commit if it came from the source. */
export function removeFile(ws: Workspace, path: string): Workspace {
  const file = ws.files[path];
  if (!file) return ws;
  const files = { ...ws.files };
  delete files[path];
  const tombstones = file.original !== null && !(ws.tombstones ?? []).includes(path) ? [...(ws.tombstones ?? []), path] : ws.tombstones;
  return { ...ws, files, tombstones, updatedAt: new Date().toISOString() };
}

/** Folder tree with directories first, then files, both alphabetical (case-insensitive). */
export function buildTree(files: Record<string, WorkspaceFile>): TreeNode[] {
  const root: TreeNode[] = [];
  const dirs = new Map<string, TreeNode[]>();
  dirs.set("", root);
  const childrenOf = (dirPath: string): TreeNode[] => {
    const existing = dirs.get(dirPath);
    if (existing) return existing;
    const parent = dirPath.includes("/") ? dirPath.slice(0, dirPath.lastIndexOf("/")) : "";
    const siblings = childrenOf(parent);
    const children: TreeNode[] = [];
    siblings.push({ kind: "dir", name: dirPath.split("/").pop() ?? dirPath, path: dirPath, children });
    dirs.set(dirPath, children);
    return children;
  };
  for (const file of Object.values(files)) {
    const parent = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    childrenOf(parent).push({ kind: "file", name: file.path.split("/").pop() ?? file.path, path: file.path, size: file.size, dirty: isDirty(file) || isNew(file), binary: file.binary });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) : a.kind === "dir" ? -1 : 1));
    for (const node of nodes) if (node.kind === "dir") sort(node.children);
  };
  sort(root);
  return root;
}

/** All directory paths that contain `path`, for expanding the tree to a file. */
export function ancestorsOf(path: string): string[] {
  const out: string[] = [];
  const parts = path.split("/");
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join("/"));
  return out;
}

/** When a ZIP or upload has one top-level folder (GitHub zipballs do), strip it. */
export function stripCommonRoot(paths: string[]): (path: string) => string {
  if (paths.length === 0) return (p) => p;
  const firsts = new Set(paths.map((p) => p.split("/")[0]));
  const allNested = paths.every((p) => p.includes("/"));
  if (firsts.size === 1 && allNested) {
    const root = [...firsts][0] + "/";
    return (p) => (p.startsWith(root) ? p.slice(root.length) : p);
  }
  return (p) => p;
}

export type SearchHit = { path: string; line: number; text: string };

/** Case-insensitive substring/regex search across text files, capped. */
export function searchWorkspace(files: Record<string, WorkspaceFile>, query: string, options: { regex?: boolean; limit?: number; glob?: string } = {}): SearchHit[] {
  const limit = options.limit ?? 60;
  if (!query.trim()) return [];
  let matcher: (line: string) => boolean;
  try {
    const re = options.regex ? new RegExp(query, "i") : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    matcher = (line) => re.test(line);
  } catch {
    return [];
  }
  const globRe = options.glob ? globToRegExp(options.glob) : null;
  const hits: SearchHit[] = [];
  for (const file of Object.values(files).sort((a, b) => a.path.localeCompare(b.path))) {
    if (file.binary) continue;
    if (globRe && !globRe.test(file.path)) continue;
    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (matcher(lines[i])) {
        hits.push({ path: file.path, line: i + 1, text: lines[i].trim().slice(0, 200) });
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

export function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        out += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else out += "[^/]*";
    } else if (c === "?") out += "[^/]";
    else out += /[.+^${}()|[\]\\]/.test(c) ? `\\${c}` : c;
  }
  return new RegExp(`^${out}$`, "i");
}

/** Compact listing for the model: paths with sizes, grouped so a 2,000-file repo fits in a few KB. */
export function describeTree(files: Record<string, WorkspaceFile>, max = 400): string {
  const paths = Object.keys(files).sort();
  const shown = paths.slice(0, max);
  const lines = shown.map((p) => `${p}${files[p].binary ? " (binary)" : ` (${formatBytes(files[p].size)})`}`);
  if (paths.length > max) lines.push(`… ${paths.length - max} more files (use searchFiles or listFiles with a folder to see them)`);
  return lines.join("\n");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Lines-with-numbers view of a file slice, the way the model reads it. */
export function numberedSlice(content: string, start = 1, end?: number): { text: string; lines: number; start: number; end: number } {
  const lines = content.split("\n");
  const s = Math.max(1, Math.min(start, lines.length));
  const e = Math.min(lines.length, end ?? s + 399);
  const width = String(e).length;
  const text = lines
    .slice(s - 1, e)
    .map((line, i) => `${String(s + i).padStart(width)}| ${line}`)
    .join("\n");
  return { text, lines: lines.length, start: s, end: e };
}

/* ── edits proposed by the model ─────────────────────── */

export type ProposedEdit =
  | { path: string; kind: "replace"; content: string }
  | { path: string; kind: "patch"; find: string; replace: string; all?: boolean }
  | { path: string; kind: "create"; content: string }
  | { path: string; kind: "delete" };

export type EditProblem = { line: number | null; severity: "error" | "warning"; message: string };
export type AppliedEdit = { path: string; before: string | null; after: string | null; ok: boolean; error?: string; problems?: EditProblem[] };

export type ReviewDecision = "pending" | "accepted" | "rejected";
/** One proposeEdits call as the user sees it: the diffs plus a per-file decision. */
export type Review = { summary: string; edits: AppliedEdit[]; decisions: Record<string, ReviewDecision> };

/** Compute the after-state of each edit without mutating the workspace. */
export function previewEdits(files: Record<string, WorkspaceFile>, edits: ProposedEdit[]): AppliedEdit[] {
  const out: AppliedEdit[] = [];
  const working: Record<string, string | null> = {};
  const current = (path: string): string | null => (path in working ? working[path] : files[path] && !files[path].binary ? files[path].content : files[path] ? "\u0000binary" : null);
  for (const edit of edits) {
    if (!isValidPath(edit.path)) {
      out.push({ path: edit.path, before: null, after: null, ok: false, error: "Invalid path." });
      continue;
    }
    const before = current(edit.path);
    if (before === "\u0000binary") {
      out.push({ path: edit.path, before: null, after: null, ok: false, error: "Binary file; can't edit." });
      continue;
    }
    switch (edit.kind) {
      case "create": {
        if (before !== null) {
          out.push({ path: edit.path, before, after: edit.content, ok: false, error: "File exists; use replace or patch." });
          break;
        }
        working[edit.path] = edit.content;
        out.push({ path: edit.path, before: null, after: edit.content, ok: true });
        break;
      }
      case "replace": {
        working[edit.path] = edit.content;
        out.push({ path: edit.path, before, after: edit.content, ok: true });
        break;
      }
      case "delete": {
        if (before === null) {
          out.push({ path: edit.path, before: null, after: null, ok: false, error: "No such file." });
          break;
        }
        working[edit.path] = null;
        out.push({ path: edit.path, before, after: null, ok: true });
        break;
      }
      case "patch": {
        if (before === null) {
          out.push({ path: edit.path, before: null, after: null, ok: false, error: "No such file; use create." });
          break;
        }
        const count = before.split(edit.find).length - 1;
        if (count === 0) {
          out.push({ path: edit.path, before, after: before, ok: false, error: "The text to find isn't in the file (check whitespace and indentation)." });
          break;
        }
        if (count > 1 && !edit.all) {
          out.push({ path: edit.path, before, after: before, ok: false, error: `The text to find appears ${count} times; include more context or set all: true.` });
          break;
        }
        const after = edit.all ? before.split(edit.find).join(edit.replace) : before.replace(edit.find, () => edit.replace);
        working[edit.path] = after;
        out.push({ path: edit.path, before, after, ok: true });
        break;
      }
    }
  }
  return out;
}

/** Apply previously previewed edits (only the ok ones the user accepted). */
export function applyEdits(ws: Workspace, accepted: AppliedEdit[]): Workspace {
  let next = ws;
  for (const edit of accepted) {
    if (!edit.ok) continue;
    if (edit.after === null) {
      next = removeFile(next, edit.path);
      continue;
    }
    const existing = next.files[edit.path];
    next = {
      ...next,
      files: { ...next.files, [edit.path]: makeFile(edit.path, edit.after, { original: existing ? existing.original : null }) },
      tombstones: next.tombstones?.filter((p) => p !== edit.path),
    };
  }
  return { ...next, updatedAt: new Date().toISOString() };
}

/** Minimal line diff stats for a badge: +added −removed. */
export function diffStats(before: string | null, after: string | null): { added: number; removed: number } {
  const a = before === null ? [] : before.split("\n");
  const b = after === null ? [] : after.split("\n");
  const setA = new Map<string, number>();
  for (const line of a) setA.set(line, (setA.get(line) ?? 0) + 1);
  let common = 0;
  for (const line of b) {
    const n = setA.get(line) ?? 0;
    if (n > 0) {
      common++;
      setA.set(line, n - 1);
    }
  }
  return { added: b.length - common, removed: a.length - common };
}
