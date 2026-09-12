import { describe, expect, it } from "vitest";
import { applyEdits, buildTree, createWorkspace, describeTree, diffStats, globToRegExp, isIgnoredPath, languageOf, looksBinary, makeFile, normalisePath, numberedSlice, previewEdits, searchWorkspace, stripCommonRoot } from "./workspace";
import { importEntries } from "./import";

const enc = (s: string) => new TextEncoder().encode(s);

describe("workspace paths and languages", () => {
  it("normalises paths and ignores dependency folders", () => {
    expect(normalisePath("./src//app/../lib/x.ts")).toBe("src/lib/x.ts");
    expect(isIgnoredPath("node_modules/react/index.js")).toBe(true);
    expect(isIgnoredPath("src/.git/config")).toBe(true);
    expect(isIgnoredPath("src/components/build.tsx")).toBe(false);
  });
  it("maps extensions and special names to languages", () => {
    expect(languageOf("src/app/page.tsx")).toBe("tsx");
    expect(languageOf("Dockerfile")).toBe("dockerfile");
    expect(languageOf(".env.local")).toBe("shell");
    expect(languageOf("README")).toBe("text");
  });
  it("sniffs binary content", () => {
    expect(looksBinary(enc("hello\nworld"))).toBe(false);
    expect(looksBinary(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 13]))).toBe(true);
  });
});

describe("import", () => {
  it("strips a single top-level folder (zipball style), skips ignored and binary-classifies by name", () => {
    const report = importEntries([
      { path: "repo-main/package.json", bytes: enc("{}") },
      { path: "repo-main/src/index.ts", bytes: enc("export {}") },
      { path: "repo-main/node_modules/x/index.js", bytes: enc("x") },
      { path: "repo-main/logo.png", bytes: new Uint8Array([1, 2, 3]) },
    ]);
    expect(report.files.map((f) => f.path)).toEqual(["package.json", "src/index.ts", "logo.png"]);
    expect(report.files[2].binary).toBe(true);
    expect(report.skipped[0].reason).toBe("ignored folder");
    expect(stripCommonRoot(["a/x", "b/y"])("a/x")).toBe("a/x");
  });
});

describe("tree, search and slices", () => {
  const files = {
    "src/app/page.tsx": makeFile("src/app/page.tsx", "export default function Page() {\n  return <h1>Hello</h1>;\n}\n"),
    "src/lib/util.ts": makeFile("src/lib/util.ts", "export const hello = 1;\n"),
    "README.md": makeFile("README.md", "# Demo\n"),
  };
  it("builds a sorted tree with directories first", () => {
    const tree = buildTree(files);
    expect(tree.map((n) => n.name)).toEqual(["src", "README.md"]);
    const src = tree[0];
    expect(src.kind === "dir" && src.children.map((c) => c.name)).toEqual(["app", "lib"]);
  });
  it("searches text files with optional glob", () => {
    expect(searchWorkspace(files, "hello").map((h) => `${h.path}:${h.line}`)).toEqual(["src/app/page.tsx:2", "src/lib/util.ts:1"]);
    expect(searchWorkspace(files, "hello", { glob: "**/*.ts" })).toHaveLength(1);
    expect(globToRegExp("src/**/*.tsx").test("src/app/page.tsx")).toBe(true);
  });
  it("numbers slices and describes the tree compactly", () => {
    const slice = numberedSlice(files["src/app/page.tsx"].content, 2, 2);
    expect(slice.text).toBe("2|   return <h1>Hello</h1>;");
    expect(slice.lines).toBe(4);
    expect(describeTree(files, 2)).toContain("… 1 more files");
  });
});

describe("proposed edits", () => {
  const ws = createWorkspace("demo", { kind: "blank" }, [makeFile("a.ts", "const a = 1;\nconst b = 2;\n"), makeFile("img.png", "AAAA", { binary: true })]);
  it("patches with unique context, refuses ambiguous or missing text", () => {
    const [ok] = previewEdits(ws.files, [{ path: "a.ts", kind: "patch", find: "const a = 1;", replace: "const a = 10;" }]);
    expect(ok.ok).toBe(true);
    expect(ok.after).toBe("const a = 10;\nconst b = 2;\n");
    const [ambiguous] = previewEdits(ws.files, [{ path: "a.ts", kind: "patch", find: "const", replace: "let" }]);
    expect(ambiguous.ok).toBe(false);
    expect(ambiguous.error).toMatch(/2 times/);
    const [all] = previewEdits(ws.files, [{ path: "a.ts", kind: "patch", find: "const", replace: "let", all: true }]);
    expect(all.after).toBe("let a = 1;\nlet b = 2;\n");
    const [missing] = previewEdits(ws.files, [{ path: "a.ts", kind: "patch", find: "nope", replace: "x" }]);
    expect(missing.ok).toBe(false);
  });
  it("creates, replaces, deletes and refuses binary or existing-file creates; later edits see earlier ones", () => {
    const results = previewEdits(ws.files, [
      { path: "b.ts", kind: "create", content: "export {};\n" },
      { path: "b.ts", kind: "patch", find: "export {};", replace: "export const b = 1;" },
      { path: "a.ts", kind: "create", content: "x" },
      { path: "img.png", kind: "replace", content: "x" },
      { path: "a.ts", kind: "delete" },
      { path: "../etc/passwd", kind: "create", content: "x" },
    ]);
    expect(results.map((r) => r.ok)).toEqual([true, true, false, false, true, false]);
    expect(results[1].after).toBe("export const b = 1;\n");
    const next = applyEdits(ws, results);
    expect(Object.keys(next.files).sort()).toEqual(["b.ts", "img.png"]);
    expect(next.files["b.ts"].original).toBeNull();
    expect(diffStats("a\nb\nc", "a\nc\nd")).toEqual({ added: 1, removed: 1 });
  });
});
