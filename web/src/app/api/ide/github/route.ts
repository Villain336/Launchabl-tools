import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { branchSha, commitChanges, GitHubError, isValidBranchName, isValidToken, openPullRequest, parseRepoRef, repoInfo, repoZip } from "@/lib/ide/github";
import { isValidPath } from "@/lib/ide/workspace";
import { clientKey, createRateLimiter } from "@/lib/ai/rate-limit";
import { getStore } from "@/lib/ai/store";

/**
 * GitHub proxy for the IDE. The user's token travels in `x-github-token`
 * per request and is forwarded, never stored or logged. Public repos work
 * without a token.
 */

export const maxDuration = 120;

declare global {
  var __launchablIdeGithubLimiter: ReturnType<typeof createRateLimiter> | undefined;
}

const limiter = () => (globalThis.__launchablIdeGithubLimiter ??= createRateLimiter([{ name: "ide-gh", limit: 60, windowSeconds: 10 * 60 }], getStore()));

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("info"), repo: z.string().min(3).max(300) }),
  z.object({ action: z.literal("zip"), repo: z.string().min(3).max(300), ref: z.string().min(1).max(200).optional() }),
  z.object({
    action: z.literal("commit"),
    owner: z.string().min(1).max(100),
    repo: z.string().min(1).max(100),
    baseBranch: z.string().min(1).max(200),
    branch: z.string().min(1).max(200),
    message: z.string().min(1).max(2_000),
    changes: z.array(z.object({ path: z.string().min(1).max(400), content: z.string().max(4_000_000).nullable(), binary: z.boolean() })).min(1).max(300),
    pullRequest: z.object({ title: z.string().min(1).max(200), body: z.string().max(10_000) }).nullable().optional(),
  }),
]);

function errorResponse(error: unknown) {
  if (error instanceof GitHubError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status >= 400 && error.status < 600 ? error.status : 502 });
  console.error("[ide/github]", error);
  return NextResponse.json({ error: "GitHub request failed." }, { status: 502 });
}

export async function POST(request: NextRequest) {
  const limit = await limiter().check(clientKey(request.headers));
  if (!limit.ok) return NextResponse.json({ error: "Too many GitHub requests; try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const body = parsed.data;
  const rawToken = request.headers.get("x-github-token");
  const token = isValidToken(rawToken) ? rawToken : null;
  if (rawToken && !token) return NextResponse.json({ error: "That doesn't look like a GitHub token (expected ghp_… or github_pat_…)." }, { status: 400 });

  try {
    switch (body.action) {
      case "info": {
        const ref = parseRepoRef(body.repo);
        if (!ref) return NextResponse.json({ error: "Enter owner/repo or a github.com URL." }, { status: 400 });
        const info = await repoInfo(ref, token);
        return NextResponse.json({ info, ref: ref.ref ?? info.defaultBranch });
      }
      case "zip": {
        const ref = parseRepoRef(body.repo);
        if (!ref) return NextResponse.json({ error: "Enter owner/repo or a github.com URL." }, { status: 400 });
        const info = await repoInfo(ref, token);
        const branch = body.ref ?? ref.ref ?? info.defaultBranch;
        const [{ bytes, sha }, headSha] = await Promise.all([
          repoZip({ ...ref, ref: branch }, token),
          branchSha({ ...ref, ref: branch }, token).catch(() => null),
        ]);
        return new Response(bytes, {
          headers: {
            "content-type": "application/zip",
            "x-repo-owner": info.owner,
            "x-repo-name": info.repo,
            "x-repo-ref": branch,
            "x-repo-sha": headSha ?? sha ?? "",
            "x-repo-default-branch": info.defaultBranch,
            "x-repo-push": info.permissions?.push ? "1" : "0",
            "cache-control": "no-store",
          },
        });
      }
      case "commit": {
        if (!token) return NextResponse.json({ error: "Committing needs a GitHub token with Contents (write) permission. Add one in Settings.", code: "unauthorized" }, { status: 401 });
        if (!isValidBranchName(body.branch) || !isValidBranchName(body.baseBranch)) return NextResponse.json({ error: "Invalid branch name." }, { status: 400 });
        if (body.changes.some((c) => !isValidPath(c.path))) return NextResponse.json({ error: "A file path is invalid." }, { status: 400 });
        const commit = await commitChanges({ owner: body.owner, repo: body.repo, baseBranch: body.baseBranch, branch: body.branch, message: body.message, changes: body.changes }, token);
        let pullRequest = null;
        if (body.pullRequest && body.branch !== body.baseBranch) {
          pullRequest = await openPullRequest({ owner: body.owner, repo: body.repo, head: body.branch, base: body.baseBranch, title: body.pullRequest.title, body: body.pullRequest.body }, token);
        }
        return NextResponse.json({ commit, pullRequest });
      }
    }
  } catch (error) {
    return errorResponse(error);
  }
}
