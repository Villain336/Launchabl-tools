/**
 * GitHub access for the IDE. Server-side only: the browser sends the user's
 * token per request in a header; we forward it to api.github.com and never
 * store it. Public repos work without a token (GitHub's unauthenticated
 * limit is 60 requests/hour per IP, so imports use the zipball, which is one
 * request).
 */

const API = "https://api.github.com";
const UA = "Launchabl-IDE/1.0 (+https://launchabl.io)";

export type RepoRef = { owner: string; repo: string; ref: string | null };

export type RepoInfo = {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  /** KB, as GitHub reports it. */
  size: number;
  htmlUrl: string;
  permissions: { push: boolean } | null;
};

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: "not_found" | "unauthorized" | "forbidden" | "rate_limited" | "too_large" | "conflict" | "upstream",
  ) {
    super(message);
  }
}

/** Accepts `owner/repo`, `owner/repo#branch`, `owner/repo@branch`, or any github.com URL (tree/blob paths included). */
export function parseRepoRef(input: string): RepoRef | null {
  const s = input.trim().replace(/\.git$/, "");
  const url = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob|commits?)\/([^/?#]+))?/i.exec(s);
  if (url) return { owner: url[1], repo: url[2], ref: url[3] ? decodeURIComponent(url[3]) : null };
  const ssh = /^git@github\.com:([\w.-]+)\/([\w.-]+)$/i.exec(s);
  if (ssh) return { owner: ssh[1], repo: ssh[2], ref: null };
  const short = /^([\w.-]+)\/([\w.-]+)(?:[#@]([^\s]+))?$/.exec(s);
  if (short) return { owner: short[1], repo: short[2], ref: short[3] ?? null };
  return null;
}

export function isValidToken(token: string | null | undefined): token is string {
  return typeof token === "string" && /^(ghp_|github_pat_|gho_|ghu_|ghs_)[A-Za-z0-9_]{20,}$/.test(token);
}

function headers(token: string | null, accept = "application/vnd.github+json"): HeadersInit {
  const h: Record<string, string> = { accept, "user-agent": UA, "x-github-api-version": "2022-11-28" };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

async function fail(res: Response, what: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as { message?: string } | null;
  const msg = body?.message ?? res.statusText;
  if (res.status === 404) throw new GitHubError(`${what}: not found${msg ? ` (${msg})` : ""}. Private repo? Add a token in Settings.`, 404, "not_found");
  if (res.status === 401) throw new GitHubError("GitHub rejected the token. Check it hasn't expired and has the repo scope.", 401, "unauthorized");
  if (res.status === 403 && /rate limit/i.test(msg)) throw new GitHubError("GitHub's rate limit for anonymous requests is used up. Add a token in Settings to continue.", 403, "rate_limited");
  if (res.status === 403) throw new GitHubError(`GitHub refused: ${msg}. The token may lack the Contents (write) permission for this repo.`, 403, "forbidden");
  if (res.status === 409 || res.status === 422) throw new GitHubError(`GitHub: ${msg}`, res.status, "conflict");
  throw new GitHubError(`${what}: GitHub returned ${res.status} ${msg}`, res.status, "upstream");
}

export async function repoInfo(ref: RepoRef, token: string | null, fetchImpl: typeof fetch = fetch): Promise<RepoInfo> {
  const res = await fetchImpl(`${API}/repos/${ref.owner}/${ref.repo}`, { headers: headers(token) });
  if (!res.ok) await fail(res, "Repository");
  const json = (await res.json()) as {
    name: string;
    owner: { login: string };
    full_name: string;
    description: string | null;
    private: boolean;
    default_branch: string;
    size: number;
    html_url: string;
    permissions?: { push?: boolean };
  };
  return {
    owner: json.owner.login,
    repo: json.name,
    fullName: json.full_name,
    description: json.description,
    private: json.private,
    defaultBranch: json.default_branch,
    size: json.size,
    htmlUrl: json.html_url,
    permissions: json.permissions ? { push: Boolean(json.permissions.push) } : null,
  };
}

export const ZIP_MAX_BYTES = 60 * 1024 * 1024;

/** The repo at `ref` as a ZIP (GitHub redirects to codeload; one request, no per-file rate-limit cost). */
export async function repoZip(ref: RepoRef & { ref: string }, token: string | null, fetchImpl: typeof fetch = fetch): Promise<{ bytes: ArrayBuffer; sha: string | null }> {
  const res = await fetchImpl(`${API}/repos/${ref.owner}/${ref.repo}/zipball/${encodeURIComponent(ref.ref)}`, { headers: headers(token), redirect: "follow" });
  if (!res.ok) await fail(res, "Download");
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > ZIP_MAX_BYTES) throw new GitHubError(`This repository is ${(length / 1048576).toFixed(0)} MB zipped; the IDE imports up to 60 MB.`, 413, "too_large");
  const bytes = await res.arrayBuffer();
  if (bytes.byteLength > ZIP_MAX_BYTES) throw new GitHubError("This repository is over the 60 MB import limit.", 413, "too_large");
  // codeload names the zip folder <owner>-<repo>-<sha>; the header carries the same sha.
  const disposition = res.headers.get("content-disposition") ?? "";
  const sha = /-([0-9a-f]{7,40})\.zip/i.exec(disposition)?.[1] ?? null;
  return { bytes, sha };
}

export async function branchSha(ref: RepoRef & { ref: string }, token: string | null, fetchImpl: typeof fetch = fetch): Promise<string> {
  const res = await fetchImpl(`${API}/repos/${ref.owner}/${ref.repo}/git/ref/heads/${encodeURIComponent(ref.ref)}`, { headers: headers(token) });
  if (!res.ok) await fail(res, `Branch ${ref.ref}`);
  const json = (await res.json()) as { object: { sha: string } };
  return json.object.sha;
}

export type FileChange = { path: string; content: string | null; binary: boolean };

export type CommitRequest = {
  owner: string;
  repo: string;
  /** Branch the commit builds on. */
  baseBranch: string;
  /** Where the commit lands. Same as base to commit directly; a new name creates a branch from base. */
  branch: string;
  message: string;
  changes: FileChange[];
};

export type CommitResult = { sha: string; branch: string; url: string; created: boolean; files: number };

const ok = (res: Response) => res.status >= 200 && res.status < 300;

/**
 * One commit with all the changes via the Git Data API:
 * blobs → tree (base_tree keeps everything else) → commit → ref.
 */
export async function commitChanges(req: CommitRequest, token: string, fetchImpl: typeof fetch = fetch): Promise<CommitResult> {
  if (req.changes.length === 0) throw new GitHubError("Nothing to commit.", 400, "conflict");
  if (req.changes.length > 300) throw new GitHubError("Commit at most 300 files at a time.", 400, "conflict");
  const base = `${API}/repos/${req.owner}/${req.repo}`;
  const h = { ...headers(token), "content-type": "application/json" };

  const baseSha = await branchSha({ owner: req.owner, repo: req.repo, ref: req.baseBranch }, token, fetchImpl);
  const commitRes = await fetchImpl(`${base}/git/commits/${baseSha}`, { headers: h });
  if (!ok(commitRes)) await fail(commitRes, "Base commit");
  const baseTree = ((await commitRes.json()) as { tree: { sha: string } }).tree.sha;

  const tree: { path: string; mode: "100644"; type: "blob"; sha: string | null }[] = [];
  for (const change of req.changes) {
    if (change.content === null) {
      tree.push({ path: change.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const blobRes = await fetchImpl(`${base}/git/blobs`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(change.binary ? { content: change.content, encoding: "base64" } : { content: change.content, encoding: "utf-8" }),
    });
    if (!ok(blobRes)) await fail(blobRes, `Blob for ${change.path}`);
    tree.push({ path: change.path, mode: "100644", type: "blob", sha: ((await blobRes.json()) as { sha: string }).sha });
  }

  const treeRes = await fetchImpl(`${base}/git/trees`, { method: "POST", headers: h, body: JSON.stringify({ base_tree: baseTree, tree }) });
  if (!ok(treeRes)) await fail(treeRes, "Tree");
  const treeSha = ((await treeRes.json()) as { sha: string }).sha;

  const newCommitRes = await fetchImpl(`${base}/git/commits`, { method: "POST", headers: h, body: JSON.stringify({ message: req.message, tree: treeSha, parents: [baseSha] }) });
  if (!ok(newCommitRes)) await fail(newCommitRes, "Commit");
  const commit = (await newCommitRes.json()) as { sha: string; html_url: string };

  let created = false;
  if (req.branch === req.baseBranch) {
    const refRes = await fetchImpl(`${base}/git/refs/heads/${encodeURIComponent(req.branch)}`, { method: "PATCH", headers: h, body: JSON.stringify({ sha: commit.sha, force: false }) });
    if (!ok(refRes)) await fail(refRes, `Update ${req.branch}`);
  } else {
    const createRes = await fetchImpl(`${base}/git/refs`, { method: "POST", headers: h, body: JSON.stringify({ ref: `refs/heads/${req.branch}`, sha: commit.sha }) });
    if (createRes.status === 422) {
      // Branch exists already: fast-forward it instead.
      const refRes = await fetchImpl(`${base}/git/refs/heads/${encodeURIComponent(req.branch)}`, { method: "PATCH", headers: h, body: JSON.stringify({ sha: commit.sha, force: false }) });
      if (!ok(refRes)) await fail(refRes, `Update ${req.branch}`);
    } else if (!ok(createRes)) await fail(createRes, `Create ${req.branch}`);
    else created = true;
  }
  return { sha: commit.sha, branch: req.branch, url: commit.html_url, created, files: req.changes.length };
}

export type PullRequestResult = { number: number; url: string };

export async function openPullRequest(
  req: { owner: string; repo: string; head: string; base: string; title: string; body: string },
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PullRequestResult> {
  const res = await fetchImpl(`${API}/repos/${req.owner}/${req.repo}/pulls`, {
    method: "POST",
    headers: { ...headers(token), "content-type": "application/json" },
    body: JSON.stringify({ title: req.title, body: req.body, head: req.head, base: req.base }),
  });
  if (!ok(res)) await fail(res, "Pull request");
  const json = (await res.json()) as { number: number; html_url: string };
  return { number: json.number, url: json.html_url };
}

export const isValidBranchName = (name: string) => /^(?!\/|.*(?:\/\.|\/\/|@\{|\\))[^\s~^:?*[\]]{1,120}(?<!\.lock|\/|\.)$/.test(name);
