import { parse as parseScript, parseExpressionAt } from "acorn";
import { extensionOf, makeFile, normalisePath, type AppliedEdit, type WorkspaceFile } from "@/lib/ide/workspace";

/**
 * Static checks that run in the browser on changed files and on proposed
 * edits before the user even sees the diff. Cheap, dependency-light and
 * honest about their limits: syntax for JSON and plain JavaScript, structure
 * and broken local links for HTML, brace balance for CSS. TypeScript and
 * JSX are reported as "not checked" rather than guessed at.
 */

export type Problem = {
  path: string;
  line: number | null;
  severity: "error" | "warning";
  message: string;
  source: "json" | "js" | "html" | "css" | "links" | "runtime";
};

export const CHECKABLE_EXT = new Set(["json", "jsonld", "webmanifest", "js", "mjs", "cjs", "html", "htm", "css"]);

export function canCheck(path: string): boolean {
  return CHECKABLE_EXT.has(extensionOf(path)) || /^\.?(eslintrc|prettierrc|babelrc)$/.test(path.split("/").pop() ?? "");
}

function lineOfIndex(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

export function checkJson(path: string, text: string): Problem[] {
  if (!text.trim()) return [{ path, line: 1, severity: "error", message: "Empty file is not valid JSON.", source: "json" }];
  try {
    JSON.parse(text);
    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Engines format the position differently (or not at all), so locate it by parsing the text as a JS expression.
    const lineCol = /line (\d+) column (\d+)/i.exec(message);
    const position = /position (\d+)/i.exec(message);
    let line = lineCol ? Number(lineCol[1]) : position ? lineOfIndex(text, Number(position[1])) : null;
    if (line === null) {
      try {
        parseExpressionAt(text, 0, { ecmaVersion: "latest", locations: true });
      } catch (e) {
        line = (e as { loc?: { line: number } }).loc?.line ?? null;
      }
    }
    const short = message.replace(/^JSON\.parse: /, "").replace(/,? ?(?:\.\.\.)?"[\s\S]*" ?(?:\.\.\.)? ?is not valid JSON$/, "").replace(/ in JSON at position \d+.*$/, "").replace(/ \(line \d+ column \d+\)$/, "");
    return [{ path, line, severity: "error", message: short || "Invalid JSON.", source: "json" }];
  }
}

export function checkScript(path: string, text: string, options: { module?: boolean } = {}): Problem[] {
  const attempt = (sourceType: "module" | "script") => {
    try {
      parseScript(text, { ecmaVersion: "latest", sourceType, allowHashBang: true, allowAwaitOutsideFunction: sourceType === "module", allowReturnOutsideFunction: sourceType === "script", locations: true });
      return null;
    } catch (error) {
      const e = error as Error & { loc?: { line: number; column: number } };
      return { path, line: e.loc?.line ?? null, severity: "error" as const, message: e.message.replace(/ \(\d+:\d+\)$/, ""), source: "js" as const };
    }
  };
  const preferModule = options.module ?? !/\.cjs$/.test(path);
  const first = attempt(preferModule ? "module" : "script");
  if (!first) return [];
  const second = attempt(preferModule ? "script" : "module");
  return second ? [first] : [];
}

export function checkCss(path: string, text: string): Problem[] {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (m) => " ".repeat(m.length));
  let depth = 0;
  for (let i = 0; i < stripped.length; i++) {
    const c = stripped[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth < 0) return [{ path, line: lineOfIndex(stripped, i), severity: "error", message: "Unexpected `}` — more closing braces than opening ones.", source: "css" }];
    }
  }
  if (depth > 0) return [{ path, line: lineOfIndex(stripped, stripped.length), severity: "error", message: `${depth} unclosed \`{\` — a rule is missing its closing brace.`, source: "css" }];
  return [];
}

const RELATIVE_REF = /<(?:link|script|img|source|video|audio|iframe)\b[^>]*?\s(?:src|href)=["']([^"']+)["']/gi;

/** Structural HTML checks plus "does this local file exist" for src/href. */
export function checkHtml(path: string, text: string, files: Record<string, WorkspaceFile>): Problem[] {
  const out: Problem[] = [];
  const isDocument = /<html[\s>]/i.test(text) || /<!doctype/i.test(text);
  if (isDocument) {
    if (!/<title[\s>]/i.test(text)) out.push({ path, line: null, severity: "warning", message: "No <title> — search results and tabs will show the URL.", source: "html" });
    if (!/<html[^>]*\slang=/i.test(text)) out.push({ path, line: lineOfIndex(text, text.search(/<html/i)), severity: "warning", message: "<html> has no lang attribute (screen readers and translation rely on it).", source: "html" });
    if (!/<meta[^>]*name=["']viewport["']/i.test(text)) out.push({ path, line: null, severity: "warning", message: "No viewport meta tag — the page will render zoomed out on phones.", source: "html" });
    if (!/<meta[^>]*name=["']description["']/i.test(text)) out.push({ path, line: null, severity: "warning", message: "No meta description.", source: "html" });
  }
  for (const match of text.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt=/i.test(match[0])) out.push({ path, line: lineOfIndex(text, match.index ?? 0), severity: "warning", message: "<img> without alt text.", source: "html" });
  }
  const ids = new Map<string, number>();
  for (const match of text.matchAll(/\sid=["']([^"']+)["']/g)) {
    const id = match[1];
    const line = lineOfIndex(text, match.index ?? 0);
    if (ids.has(id)) out.push({ path, line, severity: "error", message: `Duplicate id "${id}" (first used on line ${ids.get(id)}).`, source: "html" });
    else ids.set(id, line);
  }
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
  for (const match of text.matchAll(RELATIVE_REF)) {
    const value = match[1];
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(value)) continue;
    const clean = value.split(/[?#]/)[0];
    if (!clean) continue;
    const resolved = normalisePath(clean.startsWith("/") ? clean.slice(1) : dir ? `${dir}/${clean}` : clean);
    if (!files[resolved]) out.push({ path, line: lineOfIndex(text, match.index ?? 0), severity: "error", message: `Missing file: ${value} (looked for ${resolved}).`, source: "links" });
  }
  for (const match of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    if (/\ssrc=/i.test(attrs) || /type=["'](?!module|text\/javascript)[^"']+["']/i.test(attrs) || !match[2].trim()) continue;
    const offset = (match.index ?? 0) + match[0].indexOf(match[2]);
    for (const problem of checkScript(path, match[2], { module: /type=["']module["']/i.test(attrs) })) {
      out.push({ ...problem, line: problem.line === null ? null : problem.line + lineOfIndex(text, offset) - 1, message: `Inline script: ${problem.message}` });
    }
  }
  return out;
}

/** Run every applicable check on one file's content. */
export function checkFile(path: string, text: string, files: Record<string, WorkspaceFile>): Problem[] {
  const ext = extensionOf(path);
  const name = path.split("/").pop() ?? path;
  if (ext === "json" || ext === "jsonld" || ext === "webmanifest" || /^\.?(eslintrc|prettierrc|babelrc)$/.test(name)) return checkJson(path, text);
  if (ext === "js" || ext === "mjs" || ext === "cjs") return checkScript(path, text);
  if (ext === "html" || ext === "htm") return checkHtml(path, text, files);
  if (ext === "css") return checkCss(path, text);
  return [];
}

/** Check a set of paths (default: every checkable text file), sorted by path then line. */
export function runChecks(files: Record<string, WorkspaceFile>, paths?: string[]): Problem[] {
  const targets = (paths ?? Object.keys(files)).filter((p) => files[p] && !files[p].binary && canCheck(p));
  const out: Problem[] = [];
  for (const path of targets.slice(0, 500)) out.push(...checkFile(path, files[path].content, files));
  return out.sort((a, b) => a.path.localeCompare(b.path) || (a.line ?? 0) - (b.line ?? 0));
}

export const UNCHECKED_NOTE = "TypeScript, JSX, Vue and Svelte files aren't syntax-checked in the browser; run the project's own build for those.";

/** Check each proposed after-state against the workspace as it would look with all edits applied. */
export function annotateEdits(files: Record<string, WorkspaceFile>, edits: AppliedEdit[]): AppliedEdit[] {
  const projected: Record<string, WorkspaceFile> = { ...files };
  for (const edit of edits) {
    if (!edit.ok) continue;
    if (edit.after === null) delete projected[edit.path];
    else projected[edit.path] = makeFile(edit.path, edit.after);
  }
  return edits.map((edit) => {
    if (!edit.ok || edit.after === null || !canCheck(edit.path)) return edit;
    const problems = checkFile(edit.path, edit.after, projected).map((p) => ({ line: p.line, severity: p.severity, message: p.message }));
    return problems.length ? { ...edit, problems } : edit;
  });
}
