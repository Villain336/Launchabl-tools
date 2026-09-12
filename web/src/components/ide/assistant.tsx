"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { Bot, FileSearch, FileText, FolderTree, KeyRound, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea, PromptInputTools } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { EditReview, type Review } from "@/components/ide/edit-review";
import type { Selection } from "@/components/ide/code-editor";
import type { CodeEditorTools, IdeMessage, ListFilesResult, ProposeEditsResult, ReadFileResult, RunChecksResult, SearchFilesResult } from "@/lib/ai/tools/code-editor";
import { annotateEdits, canCheck, runChecks, UNCHECKED_NOTE, type Problem } from "@/lib/ide/checks";
import type { IdeSettings } from "@/lib/ide/store";
import { describeTree, diffStats, globToRegExp, languageOf, numberedSlice, pendingChanges, previewEdits, searchWorkspace, type AppliedEdit, type Workspace } from "@/lib/ide/workspace";

type Props = {
  workspace: Workspace;
  activePath: string | null;
  selection: Selection | null;
  settings: IdeSettings;
  /** Errors the preview iframe reported, so the model can see them via runChecks. */
  runtimeProblems: Problem[];
  onAcceptEdits: (edits: AppliedEdit[]) => void;
  onOpenFile: (path: string) => void;
  onOpenSettings: () => void;
};

const SUGGESTIONS = ["Explain how this project is structured", "Find where the page title is set", "Tighten the hero headline and subhead", "Add a FAQ section with three questions", "Check my changes for problems"];

function parseError(error: Error | undefined): { message: string; cause: string | null } | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error.message) as { error?: string; cause?: string };
    if (parsed && typeof parsed.error === "string") return { message: parsed.error, cause: typeof parsed.cause === "string" ? parsed.cause : null };
  } catch {
    /* plain text */
  }
  return { message: error.message || "Something went wrong.", cause: null };
}

function byokHeaders(s: IdeSettings): Record<string, string> {
  if (s.provider === "launchabl" || !s.apiKey) return {};
  const h: Record<string, string> = { "x-ide-provider": s.provider, "x-ide-key": s.apiKey };
  if (s.model) h["x-ide-model"] = s.model;
  return h;
}

function sourceLabel(ws: Workspace): string {
  if (ws.source.kind === "github") return `GitHub ${ws.source.owner}/${ws.source.repo} @ ${ws.source.ref}`;
  if (ws.source.kind === "upload") return `uploaded ${ws.source.name}`;
  return "blank project";
}

/* ── client-side tool execution ─────────────────────── */

function runListFiles(ws: Workspace, input: CodeEditorTools["listFiles"]["input"]): ListFilesResult {
  const folder = input.folder.replace(/^\/+|\/+$/g, "");
  const glob = input.glob ? globToRegExp(input.glob) : null;
  const all = Object.values(ws.files)
    .filter((f) => (!folder || f.path === folder || f.path.startsWith(`${folder}/`)) && (!glob || glob.test(f.path)))
    .sort((a, b) => a.path.localeCompare(b.path));
  const files = all.slice(0, 400).map((f) => ({ path: f.path, size: f.size, binary: f.binary }));
  return { folder, files, truncated: all.length > files.length };
}

function runReadFile(ws: Workspace, input: CodeEditorTools["readFile"]["input"]): ReadFileResult {
  const file = ws.files[input.path];
  if (!file) {
    const near = Object.keys(ws.files).filter((p) => p.endsWith(input.path.split("/").pop() ?? "")).slice(0, 5);
    return { path: input.path, error: `No such file.${near.length ? ` Did you mean: ${near.join(", ")}?` : " Use listFiles or searchFiles to find the right path."}` };
  }
  if (file.binary) return { path: input.path, error: "Binary file; nothing to read." };
  const slice = numberedSlice(file.content, input.startLine, input.endLine ?? undefined);
  return { path: input.path, language: languageOf(input.path), lines: slice.lines, start: slice.start, end: slice.end, text: slice.text };
}

function runSearchFiles(ws: Workspace, input: CodeEditorTools["searchFiles"]["input"]): SearchFilesResult {
  const hits = searchWorkspace(ws.files, input.query, { regex: input.regex, glob: input.glob ?? undefined, limit: 61 });
  return { query: input.query, hits: hits.slice(0, 60), truncated: hits.length > 60 };
}

function runChecksTool(ws: Workspace, input: CodeEditorTools["runChecks"]["input"], runtime: Problem[]): RunChecksResult {
  const requested = input.paths?.length ? input.paths : pendingChanges(ws).map((c) => c.path);
  const existing = requested.filter((p) => ws.files[p] && !ws.files[p].binary);
  const checked = existing.filter(canCheck);
  const unchecked = existing.filter((p) => !canCheck(p));
  const problems = runChecks(ws.files, checked).map((p) => ({ path: p.path, line: p.line, severity: p.severity, message: p.message, source: p.source }));
  return {
    checked,
    unchecked,
    note: unchecked.length ? UNCHECKED_NOTE : null,
    problems,
    runtime: runtime.map((p) => ({ path: p.path, line: p.line, severity: p.severity, message: p.message })),
  };
}

/* ── compact tool rows ──────────────────────────────── */

function toolTitle(part: Extract<IdeMessage["parts"][number], { type: `tool-${string}` }>): { icon: typeof FileText; title: string } {
  const input = (part.input ?? {}) as Record<string, unknown>;
  switch (part.type) {
    case "tool-readFile": {
      const out = part.output as ReadFileResult | undefined;
      const range = out && "start" in out ? ` · lines ${out.start}–${out.end} of ${out.lines}` : "";
      return { icon: FileText, title: `Read ${String(input.path ?? "")}${range}` };
    }
    case "tool-searchFiles": {
      const out = part.output as SearchFilesResult | undefined;
      return { icon: FileSearch, title: `Searched “${String(input.query ?? "")}”${out ? ` · ${out.hits.length} hit${out.hits.length === 1 ? "" : "s"}` : ""}` };
    }
    case "tool-listFiles": {
      const out = part.output as ListFilesResult | undefined;
      return { icon: FolderTree, title: `Listed ${String(input.folder || "/")}${out ? ` · ${out.files.length} files` : ""}` };
    }
    case "tool-runChecks": {
      const out = part.output as RunChecksResult | undefined;
      const count = out ? out.problems.length + out.runtime.length : 0;
      return { icon: ShieldCheck, title: out ? `Checked ${out.checked.length} file${out.checked.length === 1 ? "" : "s"} · ${count === 0 ? "no problems" : `${count} problem${count === 1 ? "" : "s"}`}` : "Running checks" };
    }
    default:
      return { icon: Sparkles, title: part.type.replace(/^tool-/, "") };
  }
}

/**
 * The right-hand assistant. Tools run here against the workspace ref (never
 * stale), edits land as diffs the user accepts per file.
 */
export function Assistant({ workspace, activePath, selection, settings, runtimeProblems, onAcceptEdits, onOpenFile, onOpenSettings }: Props) {
  const [reviews, setReviews] = useState<Record<string, Review>>({});

  // useChat reads the latest transport and callbacks on every request, so a
  // fresh transport per render is the simplest way to send current context.
  const transport = new DefaultChatTransport<IdeMessage>({
    api: "/api/ide/chat",
    headers: byokHeaders(settings),
    body: {
      context: {
        workspace: workspace.name,
        source: sourceLabel(workspace),
        tree: describeTree(workspace.files),
        activePath,
        selection: selection && selection.text.trim() && activePath && workspace.files[activePath] ? numberedSlice(workspace.files[activePath].content, selection.startLine, selection.endLine).text : null,
      },
    },
  });

  const { messages, sendMessage, status, stop, error, clearError, setMessages, addToolOutput, regenerate } = useChat<IdeMessage>({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: ({ toolCall }) => {
      const ws = workspace;
      if (toolCall.dynamic) return;
      switch (toolCall.toolName) {
        case "listFiles":
          addToolOutput({ tool: "listFiles", toolCallId: toolCall.toolCallId, output: runListFiles(ws, toolCall.input) });
          return;
        case "readFile":
          addToolOutput({ tool: "readFile", toolCallId: toolCall.toolCallId, output: runReadFile(ws, toolCall.input) });
          return;
        case "searchFiles":
          addToolOutput({ tool: "searchFiles", toolCallId: toolCall.toolCallId, output: runSearchFiles(ws, toolCall.input) });
          return;
        case "runChecks":
          addToolOutput({ tool: "runChecks", toolCallId: toolCall.toolCallId, output: runChecksTool(ws, toolCall.input, runtimeProblems) });
          return;
        case "proposeEdits": {
          const results = annotateEdits(ws.files, previewEdits(ws.files, toolCall.input.edits));
          const decisions: Review["decisions"] = {};
          for (const r of results) if (r.ok) decisions[r.path] = "pending";
          setReviews((prev) => ({ ...prev, [toolCall.toolCallId]: { summary: toolCall.input.summary, edits: results, decisions } }));
          const output: ProposeEditsResult = {
            summary: toolCall.input.summary,
            results: results.map((r, i) => ({ path: r.path, kind: toolCall.input.edits[i]?.kind ?? "patch", ok: r.ok, error: r.error, ...diffStats(r.before, r.after), problems: r.problems })),
            applied: false,
          };
          addToolOutput({ tool: "proposeEdits", toolCallId: toolCall.toolCallId, output });
          return;
        }
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const parsedError = parseError(error);
  const signInRequired = parsedError?.cause === "sign_in_required";
  const awaitingFirstToken = status === "submitted" || (status === "streaming" && messages[messages.length - 1]?.role === "user");

  const decide = useCallback(
    (toolCallId: string, paths: string[], decision: "accepted" | "rejected") => {
      const review = reviews[toolCallId];
      if (!review) return;
      if (decision === "accepted") onAcceptEdits(review.edits.filter((e) => e.ok && paths.includes(e.path)));
      setReviews((prev) => {
        const current = prev[toolCallId];
        if (!current) return prev;
        const decisions = { ...current.decisions };
        for (const p of paths) decisions[p] = decision;
        return { ...prev, [toolCallId]: { ...current, decisions } };
      });
    },
    [reviews, onAcceptEdits],
  );

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    clearError();
    void sendMessage({ text: trimmed });
  };

  const byok = settings.provider !== "launchabl" && settings.apiKey;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const modelLabel = lastAssistant?.metadata?.modelLabel;

  return (
    <div className="flex h-full min-h-0 flex-col" data-ide-assistant>
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[12px]">
        <Bot className="size-3.5 text-primary" />
        <span className="font-medium text-foreground">Assistant</span>
        <span className="truncate text-muted-foreground">{modelLabel ?? (byok ? `${settings.provider} · your key` : "Launchabl models")}</span>
        <span className="ml-auto" />
        {messages.length > 0 && (
          <Button type="button" variant="ghost" size="icon-xs" aria-label="New chat" title="New chat" onClick={() => setMessages([])}>
            <RotateCcw className="size-3.5" />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-xs" aria-label="Model and keys" title="Model and keys" onClick={onOpenSettings} data-ide-open-settings>
          <KeyRound className="size-3.5" />
        </Button>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 p-3">
          {messages.length === 0 && (
            <ConversationEmptyState className="p-4">
              <Sparkles className="size-6 text-primary" />
              <div className="space-y-1">
                <h3 className="text-[13.5px] font-medium text-foreground">Ask for a change, or a question about the code</h3>
                <p className="text-[12.5px] text-muted-foreground">It reads and searches your files, then proposes diffs you accept file by file. Select lines in the editor to point at them.</p>
              </div>
            </ConversationEmptyState>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role} className="max-w-full">
              <MessageContent className={message.role === "user" ? "rounded-xl bg-primary px-3 py-2 text-[13px] text-primary-foreground" : "w-full max-w-full bg-transparent p-0 text-[13px]"} data-ide-message={message.role}>
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    if (!part.text.trim()) return null;
                    return message.role === "user" ? (
                      <p key={index} className="whitespace-pre-wrap">
                        {part.text}
                      </p>
                    ) : (
                      <MessageResponse key={index} className="prose prose-sm max-w-none text-[13px] leading-relaxed dark:prose-invert">
                        {part.text}
                      </MessageResponse>
                    );
                  }
                  if (part.type === "tool-proposeEdits") {
                    const review = reviews[part.toolCallId];
                    if (review) return <EditReview key={part.toolCallId} review={review} onDecide={(paths, decision) => decide(part.toolCallId, paths, decision)} onOpenFile={onOpenFile} />;
                    const out = part.output as ProposeEditsResult | undefined;
                    return (
                      <div key={part.toolCallId} className="not-prose rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12.5px] text-muted-foreground">
                        {part.state === "input-streaming" || part.state === "input-available" ? <Shimmer>Preparing edits…</Shimmer> : `Proposed ${out?.results.length ?? 0} change${out?.results.length === 1 ? "" : "s"} (reviewed earlier).`}
                      </div>
                    );
                  }
                  if (part.type === "tool-readFile" || part.type === "tool-searchFiles" || part.type === "tool-listFiles" || part.type === "tool-runChecks") {
                    const { title } = toolTitle(part);
                    return (
                      <Tool key={part.toolCallId} className="mb-0 bg-muted/20 text-[12.5px]" data-ide-tool={part.type}>
                        <ToolHeader type={part.type} state={part.state} title={title} className="gap-2 p-2 [&_span]:text-[12px]" />
                        <ToolContent className="space-y-3 p-3">
                          <ToolInput input={part.input} />
                          {part.state === "output-available" && <ToolOutput output={part.type === "tool-readFile" && part.output && "text" in part.output ? part.output.text : part.output} errorText={undefined} />}
                          {part.state === "output-error" && <ToolOutput output={undefined} errorText={part.errorText} />}
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}
          {awaitingFirstToken && (
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground" data-ide-thinking>
              <Shimmer>{messages.length <= 1 ? "Reading the project…" : "Working…"}</Shimmer>
            </div>
          )}
          {parsedError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive" role="alert" data-ide-error>
              {signInRequired ? (
                <>
                  Sign in to keep using Launchabl&apos;s models —{" "}
                  <Link href="/sign-in?next=/ide" className="underline underline-offset-2">
                    it&apos;s free
                  </Link>
                  . Or{" "}
                  <button type="button" onClick={onOpenSettings} className="underline underline-offset-2">
                    use your own API key
                  </button>
                  .
                </>
              ) : (
                <>
                  {parsedError.message}{" "}
                  <button type="button" onClick={() => void regenerate()} className="underline underline-offset-2">
                    Retry
                  </button>
                </>
              )}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-2">
        {messages.length === 0 && (
          <Suggestions className="mb-2">
            {SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={send} className="h-6 px-2.5 text-[11.5px]" />
            ))}
          </Suggestions>
        )}
        <PromptInput onSubmit={(message) => send(message.text ?? "")} className="rounded-lg">
          <PromptInputBody>
            <PromptInputTextarea placeholder={activePath ? `Ask about ${activePath.split("/").pop()} or request a change…` : "What should change?"} className="min-h-[44px] text-[13px]" data-ide-prompt />
          </PromptInputBody>
          <PromptInputFooter className="px-2 pb-1.5">
            <PromptInputTools>
              <span className="text-[11px] text-muted-foreground">{activePath ? `Context: ${activePath}` : `${Object.keys(workspace.files).length} files`}</span>
            </PromptInputTools>
            <PromptInputSubmit status={status} onStop={() => void stop()} data-ide-send />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
