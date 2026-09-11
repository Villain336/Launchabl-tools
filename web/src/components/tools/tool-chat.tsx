"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { ArrowUp, Check, Copy, RefreshCw, RotateCcw, Square, Sparkles } from "lucide-react";
import { getChatTool } from "@/lib/ai/chat-tools";
import { getToolBySlug } from "@/lib/site-config";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import type { VariantsDeliverable } from "@/lib/ai/tools/ab-copy-variants";
import type { QrDesignOutput } from "@/lib/ai/tools/qr-designer";
import type { MetaTagSet } from "@/lib/ai/tools/meta-tags";
import type { DocumentDeliverable } from "@/lib/ai/tools/documents";
import type { Dataset } from "@/lib/ai/tools/dataset-builder";
import type { FetchPageToolOutput } from "@/lib/ai/tools/shared/fetch-page-tool";
import { defaultQrStyle } from "@/lib/qr/style";
import { ArtifactSessionProvider } from "@/components/tools/chat/artifact-session";
import { Markdown } from "@/components/tools/chat/markdown";
import { QrArtifact } from "@/components/tools/chat/qr-artifact";
import { MetaTagsArtifact } from "@/components/tools/chat/meta-tags-artifact";
import { DocumentArtifact } from "@/components/tools/chat/document-artifact";
import { DatasetArtifact } from "@/components/tools/chat/dataset-artifact";
import { VariantsArtifact } from "@/components/tools/chat/variants-artifact";
import { BacklinksArtifact, CanonicalArtifact, LinksArtifact, PerformanceArtifact } from "@/components/tools/chat/audit-artifacts";
import type { BacklinksToolOutput, CanonicalToolOutput, LinksToolOutput, PerformanceToolOutput } from "@/lib/ai/tools/seo-audits";

/* ─────────────────────────────────────────────────────────
 * TOOL CHAT — the shared LLM-style surface for chat tools.
 * One component, configured by slug: the server owns prompts
 * and function tools; this owns the conversation UI.
 * ───────────────────────────────────────────────────────── */

type ToolPart = Extract<ToolChatMessage["parts"][number], { type: `tool-${string}` }>;

type ArtifactRenderer = (part: ToolPart) => ReactNode;

function auditOrError<T extends { ok: true }>(output: T | { ok: false; error: string }, render: (ok: T) => ReactNode): ReactNode {
  if (!output.ok) return <p className="text-[12.5px] text-red">{output.error}</p>;
  return render(output);
}

/** Maps `tool-<name>` parts to rich renderers. Tools without an entry fall back to a status line. */
const artifactRenderers: Record<string, ArtifactRenderer> = {
  deliverVariants: (part) => <VariantsArtifact data={part.output as VariantsDeliverable} />,
  designQr: (part) => <QrArtifact design={part.output as QrDesignOutput} />,
  deliverMetaTags: (part) => <MetaTagsArtifact tags={part.output as MetaTagSet} />,
  deliverDocument: (part) => <DocumentArtifact doc={part.output as DocumentDeliverable} />,
  deliverDataset: (part) => <DatasetArtifact data={part.output as Dataset} />,
  analyzeCanonical: (part) => auditOrError(part.output as CanonicalToolOutput, (r) => <CanonicalArtifact report={r.report} />),
  checkLinks: (part) => auditOrError(part.output as LinksToolOutput, (r) => <LinksArtifact report={r.report} />),
  auditPerformance: (part) => auditOrError(part.output as PerformanceToolOutput, (r) => <PerformanceArtifact report={r.report} />),
  checkBacklinks: (part) => auditOrError(part.output as BacklinksToolOutput, (r) => <BacklinksArtifact report={r.report} />),
  fetchPage: (part) => {
    const result = part.output as FetchPageToolOutput;
    const url = (part.input as { url?: string } | undefined)?.url ?? "";
    return (
      <p className="text-[12.5px] text-ink-3">
        {result.ok
          ? `Read ${result.page.finalUrl} · ${result.page.wordCount.toLocaleString()} words · HTTP ${result.page.status}`
          : `Couldn't read ${url}: ${result.error}`}
      </p>
    );
  },
};

const artifactLabels: Record<string, { working: string; done: string }> = {
  deliverVariants: { working: "Writing variants", done: "Variants ready" },
  designQr: { working: "Designing your code", done: "Design ready" },
  deliverMetaTags: { working: "Writing meta tags", done: "Meta tags ready" },
  deliverDocument: { working: "Writing the file", done: "File ready" },
  deliverDataset: { working: "Building the dataset", done: "Dataset ready" },
  fetchPage: { working: "Reading the page", done: "Read the page" },
  analyzeCanonical: { working: "Checking canonicals", done: "Canonical audit ready" },
  checkLinks: { working: "Checking every link", done: "Link check ready" },
  auditPerformance: { working: "Auditing page delivery", done: "Audit ready" },
  checkBacklinks: { working: "Verifying backlinks", done: "Backlink check ready" },
};

/** Shown in the empty state so a tool is usable before the first message. */
const starterArtifacts: Record<string, () => ReactNode> = {
  qr: () => (
    <QrArtifact
      compact
      design={{
        data: "https://launchabl.com",
        style: defaultQrStyle,
        name: "Your QR code",
        notes: "Paste your link, tweak the look by hand, or describe a style below and I'll design it.",
        warnings: [],
        encodable: true,
      }}
    />
  ),
};

function Shimmer({ children }: { children: ReactNode }) {
  return (
    <span
      role="status"
      className="bg-clip-text text-[13px] font-medium text-transparent"
      style={{
        backgroundImage: "linear-gradient(90deg, var(--ink-3) 35%, var(--ink) 50%, var(--ink-3) 65%)",
        backgroundSize: "200% 100%",
        animation: "shimmer-text 1.4s linear infinite",
      }}
    >
      {children}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium transition-colors duration-100 hover:bg-hover ${
        active ? "text-green" : "text-ink-3 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function messageText(message: ToolChatMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n\n")
    .trim();
}

function parseErrorMessage(error: Error | undefined): string | null {
  if (!error) return null;
  const raw = error.message || "Something went wrong.";
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed && typeof parsed.error === "string") return parsed.error;
  } catch {
    // plain text
  }
  return raw;
}

function ToolPartView({ part, streaming }: { part: ToolPart; streaming: boolean }) {
  const name = getToolName(part);
  const labels = artifactLabels[name] ?? { working: `Running ${name}`, done: `Finished ${name}` };
  const render = artifactRenderers[name];

  switch (part.state) {
    case "output-available":
      return render ? (
        <div style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>{render(part)}</div>
      ) : (
        <p className="text-[12.5px] text-ink-3">{labels.done}</p>
      );
    case "output-error":
      return <p className="text-[12.5px] text-red">{labels.working} failed. {part.errorText}</p>;
    case "output-denied":
      return <p className="text-[12.5px] text-ink-3">Skipped {name}.</p>;
    default:
      return streaming ? <Shimmer>{labels.working}…</Shimmer> : <p className="text-[12.5px] text-ink-3">{labels.working}…</p>;
  }
}

function AssistantMessage({
  message,
  isLast,
  streaming,
  onRegenerate,
}: {
  message: ToolChatMessage;
  isLast: boolean;
  streaming: boolean;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = messageText(message);
  const hasBody = message.parts.some((part) => (part.type === "text" && part.text.trim()) || isToolUIPart(part));
  const showActions = !streaming && hasBody;

  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  // A failed call that the model then corrected is noise to the reader;
  // only surface the error when nothing succeeded afterwards.
  const succeededTools = new Set(
    message.parts
      .filter((part): part is ToolPart => isToolUIPart(part) && part.state === "output-available")
      .map((part) => getToolName(part)),
  );

  return (
    <div className="flex w-full flex-col gap-2.5 pr-6" style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>
      {message.parts.map((part, index) => {
        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return <Markdown key={`${message.id}-${index}`} text={part.text} />;
        }
        if (isToolUIPart(part)) {
          const toolPart = part as ToolPart;
          if (toolPart.state === "output-error" && succeededTools.has(getToolName(toolPart))) return null;
          return <ToolPartView key={`${message.id}-${index}`} part={toolPart} streaming={streaming} />;
        }
        return null;
      })}

      {streaming && !hasBody && <Shimmer>Thinking</Shimmer>}

      {showActions && (
        <div className="-ml-1.5 flex items-center gap-0.5">
          {text && (
            <IconButton label={copied ? "Copied" : "Copy response"} onClick={copy} active={copied}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </IconButton>
          )}
          {isLast && (
            <IconButton label="Regenerate response" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate</span>
            </IconButton>
          )}
          {message.metadata?.modelLabel && (
            <span className="ml-1 text-[11.5px] text-ink-3">
              {message.metadata.modelLabel}
              {message.metadata.totalUsage?.totalTokens
                ? ` · ${message.metadata.totalUsage.totalTokens.toLocaleString()} tokens`
                : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ToolChat({ slug, className = "" }: { slug: string; className?: string }) {
  const meta = getChatTool(slug);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);

  const transport = useMemo(
    () => new DefaultChatTransport<ToolChatMessage>({ api: "/api/tools/chat", body: () => ({ tool: slug }) }),
    [slug],
  );

  const { messages, sendMessage, status, stop, regenerate, error, clearError, setMessages } =
    useChat<ToolChatMessage>({ transport });

  const busy = status === "submitted" || status === "streaming";
  const errorMessage = parseErrorMessage(error);
  const canSend = draft.trim().length > 0 && !busy;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    pinnedRef.current = true;
    void sendMessage({ text: trimmed });
    setDraft("");
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.style.height = "auto";
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  };

  // Keep the newest content in view while streaming unless the reader scrolled up.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !pinnedRef.current || messages.length === 0) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, status]);

  const onScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    pinnedRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
  };

  const reset = () => {
    stop();
    clearError();
    setMessages([]);
    setDraft("");
    inputRef.current?.focus();
  };

  if (!meta) {
    return <p className="text-sm text-red">Chat tool “{slug}” is not registered.</p>;
  }

  const tool = getToolBySlug(slug);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const awaitingFirstToken = status === "submitted" || (status === "streaming" && messages[messages.length - 1]?.role === "user");

  const starter = meta.starter ? starterArtifacts[meta.starter] : undefined;

  return (
    <ArtifactSessionProvider>
    <div
      className={`flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[14px] bg-surface shadow-card ${className}`}
      data-tool-chat={slug}
    >
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-ink">{tool?.name ?? "Launchabl"}</span>
          <span className="hidden sm:inline">· free, no account needed</span>
        </div>
        {messages.length > 0 && (
          <IconButton label="Start a new conversation" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New chat</span>
          </IconButton>
        )}
      </div>

      {/* conversation */}
      <div ref={scrollRef} onScroll={onScroll} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-3 sm:px-6">
        {messages.length === 0 && starter && (
          <div style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>{starter()}</div>
        )}

        {messages.length === 0 && (
          <div className={`${starter ? "" : "my-auto"} flex flex-col items-center px-2 text-center`} style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>
            {!starter && (
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-2">{meta.intro}</p>
            <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
              {meta.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-[10px] border border-line bg-field/60 px-3.5 py-3 text-left text-[13px] leading-snug text-ink transition-colors duration-100 hover:border-line-strong hover:bg-field"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          if (message.role === "user") {
            return (
              <div key={message.id} className="flex justify-end pl-10 sm:pl-24">
                <div
                  className="max-w-full rounded-2xl bg-field px-4 py-2.5 text-[14px] leading-[1.5] whitespace-pre-wrap text-ink"
                  style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
                >
                  {messageText(message)}
                </div>
              </div>
            );
          }
          if (message.role === "assistant") {
            return (
              <AssistantMessage
                key={message.id}
                message={message}
                isLast={message.id === lastAssistantId}
                streaming={busy && message.id === lastAssistantId}
                onRegenerate={() => {
                  pinnedRef.current = true;
                  void regenerate({ messageId: message.id });
                }}
              />
            );
          }
          return null;
        })}

        {awaitingFirstToken && (
          <div className="flex items-center gap-2">
            <Shimmer>Thinking</Shimmer>
          </div>
        )}

        {errorMessage && (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-red/30 bg-red-tint px-3 py-2 text-[13px] text-ink">
            <span className="min-w-0 flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={() => {
                clearError();
                pinnedRef.current = true;
                void regenerate();
              }}
              className="inline-flex h-7 items-center gap-1 rounded-[6px] bg-surface px-2 text-[12px] font-medium text-ink shadow-card hover:bg-hover"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
            <button type="button" onClick={clearError} className="text-[12px] text-ink-3 hover:text-ink">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* composer */}
      <div className="shrink-0 p-2 sm:p-3">
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong"
        >
          <textarea
            ref={inputRef}
            value={draft}
            rows={1}
            onChange={(event) => {
              setDraft(event.target.value);
              const node = event.target;
              node.style.height = "auto";
              node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
            }}
            onKeyDown={onKeyDown}
            placeholder={meta.placeholder}
            aria-label="Message"
            className="max-h-[200px] min-h-6 w-full resize-none bg-transparent text-[14px] leading-[1.5] text-ink outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-ink-3">
              Enter to send · Shift+Enter for a new line
            </span>
            {busy ? (
              <button
                type="button"
                aria-label="Stop generating"
                onClick={() => stop()}
                className="flex size-8 items-center justify-center rounded-[8px] bg-ink text-surface transition-transform duration-200 active:scale-[0.96]"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                disabled={!canSend}
                onClick={() => send(draft)}
                className="flex size-8 items-center justify-center rounded-[8px] transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]"
                style={{
                  background: canSend ? "var(--ink)" : "var(--line-strong)",
                  color: canSend ? "var(--surface)" : "var(--ink-2)",
                }}
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 px-1 text-center text-[11.5px] text-ink-3">
          AI can make mistakes. Check claims before you publish.
        </p>
      </div>
    </div>
    </ArtifactSessionProvider>
  );
}
