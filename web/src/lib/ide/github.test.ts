import { describe, expect, it } from "vitest";
import { commitChanges, isValidBranchName, parseRepoRef } from "./github";

describe("github refs", () => {
  it("parses URLs, shorthand and ssh", () => {
    expect(parseRepoRef("https://github.com/Villain336/Launchabl-tools/tree/main/web")).toEqual({ owner: "Villain336", repo: "Launchabl-tools", ref: "main" });
    expect(parseRepoRef("vercel/next.js")).toEqual({ owner: "vercel", repo: "next.js", ref: null });
    expect(parseRepoRef("vercel/next.js#canary")).toEqual({ owner: "vercel", repo: "next.js", ref: "canary" });
    expect(parseRepoRef("git@github.com:vercel/ai.git")).toEqual({ owner: "vercel", repo: "ai", ref: null });
    expect(parseRepoRef("not a repo")).toBeNull();
  });
  it("validates branch names", () => {
    expect(isValidBranchName("launchabl/fix-meta-tags")).toBe(true);
    expect(isValidBranchName("bad branch")).toBe(false);
    expect(isValidBranchName("trailing/")).toBe(false);
  });
});

describe("commitChanges", () => {
  it("walks the Git Data API: ref → commit → blobs → tree → commit → new branch", async () => {
    const calls: { url: string; method: string; body?: unknown }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
      if (url.endsWith("/git/ref/heads/main")) return json({ object: { sha: "base000" } });
      if (url.includes("/git/commits/base000")) return json({ tree: { sha: "tree000" } });
      if (url.endsWith("/git/blobs")) return json({ sha: `blob${calls.length}` }, 201);
      if (url.endsWith("/git/trees")) return json({ sha: "tree111" }, 201);
      if (url.endsWith("/git/commits")) return json({ sha: "commit111", html_url: "https://github.com/o/r/commit/commit111" }, 201);
      if (url.endsWith("/git/refs")) return json({ ref: "refs/heads/feature" }, 201);
      return json({ message: "unexpected" }, 500);
    }) as unknown as typeof fetch;
    const result = await commitChanges(
      { owner: "o", repo: "r", baseBranch: "main", branch: "feature", message: "Fix", changes: [{ path: "a.ts", content: "x", binary: false }, { path: "gone.ts", content: null, binary: false }] },
      "ghp_" + "a".repeat(36),
      fetchImpl,
    );
    expect(result).toMatchObject({ sha: "commit111", branch: "feature", created: true, files: 2 });
    const tree = calls.find((c) => c.url.endsWith("/git/trees"))?.body as { base_tree: string; tree: { path: string; sha: string | null }[] };
    expect(tree.base_tree).toBe("tree000");
    expect(tree.tree.map((t) => [t.path, t.sha === null])).toEqual([["a.ts", false], ["gone.ts", true]]);
    expect(calls.filter((c) => c.url.endsWith("/git/blobs"))).toHaveLength(1);
  });
});
