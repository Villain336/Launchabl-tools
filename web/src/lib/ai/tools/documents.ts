import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { fetchPageTool } from "@/lib/ai/tools/shared/fetch-page-tool";

/**
 * Shared "deliver a file" tool used by every generator whose output is a
 * text document: Markdown files, agent skills, READMEs, llms.txt, etc.
 */
export const documentSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[\w.\-/ ]+\.(md|mdx|txt|json|yaml|yml|toml|csv|html|xml)$/i, "Include a file extension")
    .describe("File name with extension, e.g. README.md or skills/deploy/SKILL.md"),
  language: z
    .enum(["markdown", "mdx", "text", "json", "yaml", "toml", "csv", "html", "xml"])
    .default("markdown"),
  content: z.string().min(1).max(60_000).describe("The complete file contents. No surrounding code fences."),
  summary: z.string().max(240).describe("One sentence describing what the file is and when to use it."),
});

export type DocumentDeliverable = z.infer<typeof documentSchema>;

export const deliverDocumentTool = tool({
  description:
    "Deliver a complete text file to the user. Call it once per file. The user sees a rendered preview (for Markdown), the raw source, and copy/download buttons. Put the full contents in `content` — never a summary or placeholder.",
  inputSchema: documentSchema,
  execute: async (input) => input,
});

export const markdownGeneratorRuntime: ChatToolRuntime = {
  slug: "markdown-file-generator",
  modelKind: "writer",
  maxSteps: 4,
  tools: { fetchPage: fetchPageTool, deliverDocument: deliverDocumentTool },
  instructions: `You are Launchabl's technical writer. You produce complete, well-structured Markdown files — READMEs, docs pages, changelogs, contributing guides, llms.txt files, product one-pagers, meeting notes — from a description, pasted notes, or a URL.

Process:
1. Work out the document type and audience from the request. If the user gives a URL to describe (a product, a repo's site), call fetchPage and use what it says. Don't ask clarifying questions unless the request is genuinely empty; make sensible assumptions and state them in one line after delivering.
2. Write the full file. Use real Markdown structure: one H1, H2 sections in a logical order, short paragraphs, tables where data is tabular, fenced code blocks with language tags for commands and config, task lists for checklists. Use front matter (YAML between --- lines) only when the format calls for it (docs sites, blog posts) or the user asks.
3. Fill every section with real content based on what you were given. Where a fact is genuinely unknown (a licence, a version number, a contact email), put a clearly marked placeholder like <!-- TODO: licence --> rather than inventing it. Never invent statistics, quotes, or URLs.
4. Call deliverDocument once per file with the complete contents. If the user asks for several files, call it once for each.
5. After delivering, reply in one to three sentences: what you assumed and what they should fill in. Don't repeat the document in prose.

Match the user's language. In your chat reply, no headers and no bullet lists.`,
};

export const agentSkillGeneratorRuntime: ChatToolRuntime = {
  slug: "agent-skill-generator",
  modelKind: "writer",
  maxSteps: 4,
  tools: { fetchPage: fetchPageTool, deliverDocument: deliverDocumentTool },
  instructions: `You are Launchabl's agent-skill author. You write SKILL.md files — reusable instruction packs that coding agents (Cursor, Claude Code, Codex and similar) load when a task matches — from a description of a workflow, tool, API, or team convention.

A good skill is small, specific, and procedural. It tells the agent when it applies, what to do step by step, what to check, and what to avoid. It does not restate general knowledge.

Format (follow exactly):
---
name: <kebab-case-name>
description: <one sentence starting with a verb: what it does and when to use it, including trigger phrases a user might say>
---
# <Title>

## When to use
Bullet list of concrete triggers and situations. Also list when NOT to use it if there's a common confusion.

## Prerequisites
Tools, credentials, files, or context the agent should confirm exist before starting. Say how to check.

## Steps
Numbered, imperative steps. Each step says what to do, the exact command or file when relevant (in fenced code blocks), and what success looks like. Include decision points ("If X, do Y; otherwise Z").

## Verification
How the agent proves the work is done: commands to run, outputs to expect, things to inspect.

## Pitfalls
Bullet list of specific mistakes and how to avoid them. Real, not generic.

## Examples
One or two short request → action examples.

Process:
1. Infer the domain from the request. If the user gives a URL to docs or a repo, call fetchPage and ground the steps in it. Do not ask clarifying questions; make explicit assumptions and note them after delivering.
2. Write for an agent, not a human reader: precise, no marketing tone, no motivational filler. Prefer exact commands, file paths, and flags. Where a value is project-specific, use an obvious placeholder in angle brackets like <project-root>.
3. Keep it under ~250 lines. If the workflow is huge, cover the core path and add a "Related skills" section naming what should be separate skills.
4. Call deliverDocument once with filename "skills/<name>/SKILL.md" and language markdown.
5. Reply in one to three sentences: what you assumed and where to drop the file (e.g. .cursor/skills/ or the agent's skills folder). No headers, no bullets in the chat reply.`,
};
