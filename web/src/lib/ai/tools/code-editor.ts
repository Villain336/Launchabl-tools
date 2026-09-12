import { tool, type InferUITools, type UIMessage } from "ai";
import { z } from "zod";

/**
 * The IDE assistant's tools. None of them has `execute`: the workspace lives
 * in the user's browser, so the client runs each call against IndexedDB and
 * sends the result back. `proposeEdits` never writes — the editor shows a
 * diff and the user accepts or rejects per file.
 */

export const codeEditorTools = {
  listFiles: tool({
    description: "List files under a folder of the workspace (recursive), with sizes. Use when the tree in the system prompt was truncated or to explore a folder.",
    inputSchema: z.object({
      folder: z.string().max(400).default("").describe("Folder path, '' for the root."),
      glob: z.string().max(200).nullable().describe("Optional glob like **/*.tsx to filter."),
    }),
  }),
  readFile: tool({
    description: "Read a text file, numbered lines. Long files come back in 400-line slices; ask for the next range. Always read a file before editing it.",
    inputSchema: z.object({
      path: z.string().min(1).max(400),
      startLine: z.number().int().min(1).default(1),
      endLine: z.number().int().min(1).nullable().describe("Inclusive; null for up to 400 lines from startLine."),
    }),
  }),
  searchFiles: tool({
    description: "Search file contents (case-insensitive, regex optional) across the workspace; returns path:line:text hits, capped at 60. Use it to find where something is defined or used before reading.",
    inputSchema: z.object({
      query: z.string().min(1).max(200),
      regex: z.boolean().default(false),
      glob: z.string().max(200).nullable().describe("Optional path glob like src/**/*.ts."),
    }),
  }),
  proposeEdits: tool({
    description:
      "Propose file changes. The editor shows each as a diff; the user accepts or rejects per file — nothing is written until they do. Prefer `patch` with a unique `find` string copied verbatim from readFile (whitespace and indentation included, without the line-number prefix); use `replace` only for small files or rewrites, `create` for new files, `delete` to remove. The result tells you which patches applied cleanly; fix and re-propose any that didn't.",
    inputSchema: z.object({
      summary: z.string().min(4).max(300).describe("One line on what the change does, shown above the diffs."),
      edits: z
        .array(
          z.discriminatedUnion("kind", [
            z.object({ kind: z.literal("patch"), path: z.string().min(1).max(400), find: z.string().min(1).max(20_000), replace: z.string().max(40_000), all: z.boolean().default(false) }),
            z.object({ kind: z.literal("replace"), path: z.string().min(1).max(400), content: z.string().max(400_000) }),
            z.object({ kind: z.literal("create"), path: z.string().min(1).max(400), content: z.string().max(400_000) }),
            z.object({ kind: z.literal("delete"), path: z.string().min(1).max(400) }),
          ]),
        )
        .min(1)
        .max(30),
    }),
  }),
};

export type CodeEditorTools = InferUITools<typeof codeEditorTools>;

export type IdeMessageMetadata = { model?: string; modelLabel?: string; totalUsage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number } };

export type IdeMessage = UIMessage<IdeMessageMetadata, never, CodeEditorTools>;

/* ── results the client sends back ─────────────────── */

export type ListFilesResult = { folder: string; files: { path: string; size: number; binary: boolean }[]; truncated: boolean };
export type ReadFileResult = { path: string; language: string; lines: number; start: number; end: number; text: string } | { path: string; error: string };
export type SearchFilesResult = { query: string; hits: { path: string; line: number; text: string }[]; truncated: boolean };
export type ProposeEditsResult = {
  summary: string;
  results: { path: string; kind: string; ok: boolean; error?: string; added: number; removed: number }[];
  /** Always false from the tool: acceptance happens in the editor. */
  applied: false;
};

export const CODE_EDITOR_INSTRUCTIONS = `You are the coding assistant inside Launchabl's editor. The user has a project open in their browser; you see its file list below and can read, search and propose changes to it. You are working with a web developer or a marketer editing their own site: be precise, keep changes small and idiomatic to the codebase, and never invent files or APIs you haven't seen.

How to work:
1. Orient first. If the request names a file, read it. If it doesn't, searchFiles for the symbol, text or route involved, then read the files that matter. Read before you edit — every time.
2. Propose changes with proposeEdits, preferring patch edits with a unique find string copied exactly from what you read (no line-number prefixes). Include enough surrounding lines that the match is unique. One proposeEdits call can carry several files; group a change into one call so the user reviews it together.
3. The result lists which edits applied cleanly. If a patch failed ("isn't in the file" or "appears N times"), re-read that region and propose again with a corrected find. Don't retry the same find.
4. Nothing is written until the user accepts the diff in the editor. Don't claim a change is made; say it's ready to review. If they ask you to continue after accepting, re-read the file rather than assuming its contents.
5. Explain briefly: what you changed and why, any follow-ups (tests to run, env vars to set), in two to five sentences. No headers, no bullet lists in the chat — the diffs are shown separately.
6. Never propose edits to binary files, lockfiles or anything under node_modules. Don't add secrets to files; tell the user to use environment variables.

If the request is a question rather than a change ("what does this do", "where is X"), answer from what you read and cite paths and line numbers.`;
