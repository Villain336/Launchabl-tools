"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart, type FileUIPart } from "ai";
import { ArrowUp, Check, Copy, FileText, History, Paperclip, RefreshCw, RotateCcw, Square, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { getChatTool } from "@/lib/ai/chat-tools";
import { signOut, useSession } from "@/lib/auth/use-session";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AgentTemplates } from "@/components/agent/agent-templates";
import { ACCEPT, ATTACHMENT_LIMITS, AttachmentError, dataUrlBytes, fileToPart, formatBytes, isImageType } from "@/lib/chat/attachments";
import { trimImageHistory } from "@/lib/chat/inline-attachments";
import { getToolBySlug } from "@/lib/site-config";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import {
  clearHistory,
  deleteConversation,
  newConversationId,
  readHistory,
  relativeTime,
  saveConversation,
  setCurrentConversation,
  useChatHistory,
} from "@/lib/chat/history";
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
import { ChecklistArtifact, FaqSchemaArtifact } from "@/components/tools/chat/checklist-artifact";
import { EmailArtifact } from "@/components/tools/chat/email-artifact";
import type { ChecklistToolOutput, FaqSchemaDeliverable, LlmReadabilityToolOutput } from "@/lib/ai/tools/site-checks";
import type { EmailDeliverable } from "@/lib/ai/tools/newsletter";
import type { ComparisonToolOutput, LandingPageToolOutput, SitemapToolOutput, WebsiteAuditToolOutput } from "@/lib/ai/tools/site-reports";
import type { CalendarDeliverable, LocalSeoKit, SchemaDeliverable } from "@/lib/ai/tools/marketing-kits";
import { ComparisonArtifact } from "@/components/tools/chat/comparison-artifact";
import { SitemapArtifact } from "@/components/tools/chat/sitemap-artifact";
import { SchemaArtifact } from "@/components/tools/chat/schema-artifact";
import { LocalSeoArtifact } from "@/components/tools/chat/local-seo-artifact";
import { CalendarArtifact } from "@/components/tools/chat/calendar-artifact";
import { EmailFinderArtifact } from "@/components/tools/chat/infra-artifacts";
import type { AccessibilityToolOutput, DnsEmailToolOutput, EmailFinderToolOutput, SecurityHeadersToolOutput, SslToolOutput } from "@/lib/ai/tools/infra-checks";
import type { ImageDeliverable, SocialCardDeliverable } from "@/lib/ai/tools/image-gen";
import { ImageArtifact } from "@/components/tools/chat/image-artifact";
import { SocialCardArtifact } from "@/components/tools/chat/social-card-artifact";
import type { PersonaDeliverable, PressReleaseDeliverable, RepurposeDeliverable, SubjectLinesDeliverable, TestPlanDeliverable, UtmDeliverable } from "@/lib/ai/tools/growth-kits";
import { PersonasArtifact, PressReleaseArtifact, RepurposeArtifact, SubjectLinesArtifact, TestPlanArtifact, UtmArtifact } from "@/components/tools/chat/growth-artifacts";

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
  analyzeVoiceSearch: (part) => auditOrError(part.output as ChecklistToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  scanCompliance: (part) => auditOrError(part.output as ChecklistToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  analyzeLlmReadability: (part) => auditOrError(part.output as LlmReadabilityToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  deliverFaqSchema: (part) => <FaqSchemaArtifact data={part.output as FaqSchemaDeliverable} />,
  deliverEmail: (part) => <EmailArtifact email={part.output as EmailDeliverable} />,
  auditWebsite: (part) => auditOrError(part.output as WebsiteAuditToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  gradeLandingPage: (part) => auditOrError(part.output as LandingPageToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  compareSites: (part) => auditOrError(part.output as ComparisonToolOutput, (r) => <ComparisonArtifact report={r.report} />),
  generateSitemap: (part) => auditOrError(part.output as SitemapToolOutput, (r) => <SitemapArtifact data={r} />),
  deliverSchema: (part) => <SchemaArtifact data={part.output as SchemaDeliverable} />,
  deliverLocalSeoKit: (part) => <LocalSeoArtifact kit={part.output as LocalSeoKit} />,
  deliverCalendar: (part) => <CalendarArtifact cal={part.output as CalendarDeliverable} />,
  checkDnsEmail: (part) => auditOrError(part.output as DnsEmailToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  checkSecurityHeaders: (part) => auditOrError(part.output as SecurityHeadersToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  auditAccessibility: (part) => auditOrError(part.output as AccessibilityToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  checkSsl: (part) => auditOrError(part.output as SslToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  findEmail: (part) => auditOrError(part.output as EmailFinderToolOutput, (r) => <EmailFinderArtifact result={r.result} />),
  generateImage: (part) => <ImageArtifact data={part.output as ImageDeliverable} />,
  designSocialCard: (part) => <SocialCardArtifact data={part.output as SocialCardDeliverable} />,
  buildUtmLinks: (part) => <UtmArtifact data={part.output as UtmDeliverable} />,
  deliverPersonas: (part) => <PersonasArtifact data={part.output as PersonaDeliverable} />,
  scoreSubjectLines: (part) => <SubjectLinesArtifact data={part.output as SubjectLinesDeliverable} />,
  deliverPressRelease: (part) => <PressReleaseArtifact data={part.output as PressReleaseDeliverable} />,
  deliverTestPlan: (part) => <TestPlanArtifact data={part.output as TestPlanDeliverable} />,
  deliverRepurposed: (part) => <RepurposeArtifact data={part.output as RepurposeDeliverable} />,
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
  analyzeVoiceSearch: { working: "Listening to the page", done: "Voice search audit ready" },
  scanCompliance: { working: "Scanning for compliance signals", done: "Compliance scan ready" },
  analyzeLlmReadability: { working: "Reading like an AI crawler", done: "LLM readability report ready" },
  deliverFaqSchema: { working: "Writing the FAQ", done: "FAQ ready" },
  deliverEmail: { working: "Designing the email", done: "Email ready" },
  auditWebsite: { working: "Auditing the page", done: "Audit ready" },
  gradeLandingPage: { working: "Grading the landing page", done: "Grade ready" },
  compareSites: { working: "Fetching and comparing the sites", done: "Comparison ready" },
  generateSitemap: { working: "Crawling the site", done: "Sitemap and robots.txt ready" },
  deliverSchema: { working: "Writing and validating the schema", done: "Schema ready" },
  deliverLocalSeoKit: { working: "Building the local SEO kit", done: "Kit ready" },
  deliverCalendar: { working: "Planning the calendar", done: "Calendar ready" },
  checkDnsEmail: { working: "Reading the domain's DNS", done: "Deliverability report ready" },
  checkSecurityHeaders: { working: "Grading the response headers", done: "Security report ready" },
  auditAccessibility: { working: "Scanning for WCAG barriers", done: "Accessibility report ready" },
  checkSsl: { working: "Opening a TLS connection", done: "Certificate report ready" },
  findEmail: { working: "Reading the company's pages and DNS", done: "Email candidates ready" },
  generateImage: { working: "Rendering the image", done: "Image ready" },
  designSocialCard: { working: "Designing the card", done: "Card ready" },
  buildUtmLinks: { working: "Building tracked links", done: "Links ready" },
  deliverPersonas: { working: "Defining the ICP and personas", done: "Personas ready" },
  scoreSubjectLines: { working: "Scoring subject lines", done: "Scores ready" },
  deliverPressRelease: { working: "Writing and checking the release", done: "Press release ready" },
  deliverTestPlan: { working: "Writing the test plan", done: "Test plan ready" },
  deliverRepurposed: { working: "Rewriting for each channel", done: "Pieces ready" },
};

/** Shown in the empty state so a tool is usable before the first message. */
type StarterContext = { prefill: (text: string) => void };

const starterArtifacts: Record<string, (ctx: StarterContext) => ReactNode> = {
  agent: ({ prefill }) => <AgentTemplates onPick={(template) => prefill(template.prompt)} />,
  qr: () => (
    <QrArtifact
      compact
      design={{
        data: "https://launchabl.io",
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

function messageFiles(message: ToolChatMessage): FileUIPart[] {
  return message.parts.filter((part): part is FileUIPart => part.type === "file");
}

/** Attachment as it appears in a sent user message: image thumbnail or a file chip. */
function FileBubble({ part }: { part: FileUIPart }) {
  const name = part.filename ?? "attachment";
  if (isImageType(part.mediaType) && part.url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL from the user's own upload
      <img src={part.url} alt={name} title={name} className="max-h-40 max-w-full rounded-[10px] border border-line object-contain" />
    );
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-[8px] border border-line bg-surface px-2 py-1 text-[12px] text-ink-2">
      <FileText className="h-3.5 w-3.5 shrink-0 text-ink-3" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-ink-3">{part.url ? formatBytes(dataUrlBytes(part.url)) : "not saved"}</span>
    </span>
  );
}

/** Attachment queued in the composer, with a remove control. */
function AttachmentChip({ part, onRemove }: { part: FileUIPart; onRemove: () => void }) {
  const name = part.filename ?? "attachment";
  const image = isImageType(part.mediaType);
  return (
    <li className="group relative flex items-center gap-2 rounded-[8px] border border-line bg-surface py-1 pr-7 pl-1.5 text-[12px] text-ink" title={name}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- local preview of the user's own file
        <img src={part.url} alt="" className="size-7 rounded-[5px] object-cover" />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-[5px] bg-field text-ink-3">
          <FileText className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-[160px] truncate">{name}</span>
        <span className="text-[10.5px] text-ink-3">{formatBytes(dataUrlBytes(part.url))}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${name}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

function parseError(error: Error | undefined): { message: string; cause: string | null } | null {
  if (!error) return null;
  const raw = error.message || "Something went wrong.";
  try {
    const parsed = JSON.parse(raw) as { error?: string; cause?: string };
    if (parsed && typeof parsed.error === "string") {
      return { message: parsed.error, cause: typeof parsed.cause === "string" ? parsed.cause : null };
    }
  } catch {
    // plain text
  }
  return { message: raw, cause: null };
}

function AccountChip() {
  const session = useSession();
  const pathname = usePathname();
  if (session.status !== "ready") return null;
  if (session.user) {
    return (
      <div className="hidden items-center gap-1.5 pr-1 text-[12px] text-ink-3 sm:flex" data-account-chip="user">
        <UserRound className="h-3.5 w-3.5" />
        <span className="max-w-[160px] truncate">{session.user.name || session.user.email}</span>
        <button type="button" onClick={() => void signOut()} className="text-ink-3 hover:text-ink">
          Sign out
        </button>
      </div>
    );
  }
  return (
    <Link
      href={`/sign-in?next=${encodeURIComponent(pathname ?? "/tools")}`}
      className="hidden h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-ink-2 hover:bg-hover hover:text-ink sm:inline-flex"
      data-account-chip="anon"
    >
      <UserRound className="h-3.5 w-3.5" /> Sign in
    </Link>
  );
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

/** Recent conversations for this tool, read from localStorage. */
function HistoryMenu({
  slug,
  currentId,
  onOpen,
  onDelete,
  onClear,
}: {
  slug: string;
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const history = useChatHistory(slug);
  // `openedAt` doubles as the "open" flag and the reference time for relative labels.
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = openedAt !== null;
  const setOpen = (value: boolean) => setOpenedAt(value ? Date.now() : null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (history.conversations.length === 0) return null;
  const now = openedAt ?? 0;

  return (
    <div ref={rootRef} className="relative">
      <IconButton label="Recent conversations" onClick={() => setOpen(!open)} active={open}>
        <History className="h-3.5 w-3.5" />
        <span>History</span>
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-[300px] overflow-hidden rounded-[10px] border border-line bg-surface shadow-card"
          style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-[11.5px] font-medium tracking-wide text-ink-3 uppercase">Saved on this device</span>
            <button
              type="button"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="text-[11.5px] text-ink-3 hover:text-red"
            >
              Clear all
            </button>
          </div>
          <ul className="max-h-[320px] overflow-y-auto py-1">
            {history.conversations.map((conversation) => {
              const active = conversation.id === currentId;
              return (
                <li key={conversation.id} className="group flex items-stretch">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onOpen(conversation.id);
                      setOpen(false);
                    }}
                    className={`flex min-w-0 flex-1 flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors duration-100 hover:bg-hover ${active ? "bg-field" : ""}`}
                  >
                    <span className="w-full truncate text-[13px] text-ink">{conversation.title}</span>
                    <span className="text-[11.5px] text-ink-3">
                      {relativeTime(conversation.updatedAt, now)} · {conversation.messages.length} messages
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete “${conversation.title}”`}
                    title="Delete"
                    onClick={() => onDelete(conversation.id)}
                    className="flex w-9 shrink-0 items-center justify-center text-ink-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100 hover:text-red focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ToolChat({ slug, className = "", title }: { slug: string; className?: string; title?: string }) {
  const meta = getChatTool(slug);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<FileUIPart[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const restoredRef = useRef(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ToolChatMessage>({
        api: "/api/tools/chat",
        prepareSendMessagesRequest: ({ id, messages, trigger, messageId }) => ({
          body: { tool: slug, id, trigger, messageId, messages: trimImageHistory(messages) },
        }),
      }),
    [slug],
  );

  const { messages, sendMessage, status, stop, regenerate, error, clearError, setMessages } =
    useChat<ToolChatMessage>({ transport });

  const busy = status === "submitted" || status === "streaming";
  const parsedError = parseError(error);
  const signInRequired = parsedError?.cause === "sign_in_required";
  const errorMessage = signInRequired ? null : parsedError?.message ?? null;
  const canSend = (draft.trim().length > 0 || attachments.length > 0) && !busy;

  const send = (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || busy) return;
    pinnedRef.current = true;
    const files = attachments;
    // A file with no prompt still needs a text part so the model has an instruction to act on.
    void sendMessage({ text: trimmed || (files.length === 1 ? "Here's the file." : "Here are the files."), files });
    setDraft("");
    setAttachments([]);
    setAttachError(null);
    requestAnimationFrame(() => {
      if (inputRef.current) inputRef.current.style.height = "auto";
    });
  };

  /** Drop a template into the composer and select its first [slot] so typing replaces it. */
  const prefill = (text: string) => {
    setDraft(text.slice(0, 4_000));
    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      node.style.height = "auto";
      node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
      node.focus();
      const slot = node.value.indexOf("[");
      const end = slot >= 0 ? node.value.indexOf("]", slot) : -1;
      if (slot >= 0 && end > slot) node.setSelectionRange(slot, end + 1);
      else node.setSelectionRange(node.value.length, node.value.length);
    });
  };

  const addFiles = async (incoming: Iterable<File>) => {
    const files = Array.from(incoming);
    if (files.length === 0) return;
    setAttachError(null);
    const room = ATTACHMENT_LIMITS.maxFiles - attachments.length;
    const errors: string[] = [];
    if (files.length > room) errors.push(`You can attach up to ${ATTACHMENT_LIMITS.maxFiles} files per message.`);
    const parts: FileUIPart[] = [];
    for (const file of files.slice(0, Math.max(0, room))) {
      try {
        parts.push(await fileToPart(file));
      } catch (error) {
        errors.push(error instanceof AttachmentError ? error.message : `${file.name} couldn't be read.`);
      }
    }
    if (parts.length > 0) setAttachments((current) => [...current, ...parts].slice(0, ATTACHMENT_LIMITS.maxFiles));
    if (errors.length > 0) setAttachError(errors.join(" "));
    inputRef.current?.focus();
  };

  const onPickFiles = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void addFiles(event.target.files);
    event.target.value = "";
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (files.length === 0) return;
    event.preventDefault();
    void addFiles(files);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!Array.from(event.dataTransfer?.types ?? []).includes("Files")) return;
    event.preventDefault();
    if (!dragging) setDragging(true);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer?.files?.length) void addFiles(event.dataTransfer.files);
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

  // Restore the last conversation for this tool once, after hydration — unless
  // another tool handed us a prompt (?q=), in which case start fresh with it.
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get("q")?.trim();
    if (handoff) {
      params.delete("q");
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      setCurrentConversation(slug, null);
      // Deferred so the prefill isn't a synchronous state update inside the effect.
      queueMicrotask(() => {
        setDraft(handoff.slice(0, 2_000));
        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (!node) return;
          node.style.height = "auto";
          node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
          node.focus();
          node.setSelectionRange(node.value.length, node.value.length);
        });
      });
      return;
    }
    const index = readHistory(slug);
    const conversation = index.conversations.find((c) => c.id === index.current);
    if (conversation && conversation.messages.length > 0) {
      pinnedRef.current = true;
      setMessages(conversation.messages);
    }
  }, [slug, setMessages]);

  // Persist after each completed turn (never mid-stream).
  useEffect(() => {
    if (busy || messages.length === 0) return;
    const index = readHistory(slug);
    saveConversation(slug, index.current ?? newConversationId(), messages);
  }, [messages, busy, slug]);

  const currentId = useChatHistory(slug).current;

  const reset = () => {
    stop();
    clearError();
    setMessages([]);
    setCurrentConversation(slug, null);
    setDraft("");
    setAttachments([]);
    setAttachError(null);
    inputRef.current?.focus();
  };

  const openConversation = (id: string) => {
    const conversation = readHistory(slug).conversations.find((c) => c.id === id);
    if (!conversation) return;
    stop();
    clearError();
    pinnedRef.current = true;
    setCurrentConversation(slug, id);
    setMessages(conversation.messages);
    inputRef.current?.focus();
  };

  const removeConversation = (id: string) => {
    const wasCurrent = readHistory(slug).current === id;
    deleteConversation(slug, id);
    if (wasCurrent) {
      stop();
      clearError();
      setMessages([]);
    }
  };

  const clearAll = () => {
    stop();
    clearError();
    clearHistory(slug);
    setMessages([]);
    setDraft("");
  };

  if (!meta) {
    return <p className="text-sm text-red">Chat tool “{slug}” is not registered.</p>;
  }

  const tool = getToolBySlug(slug);

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;
  const awaitingFirstToken = status === "submitted" || (status === "streaming" && messages[messages.length - 1]?.role === "user");

  const Starter = meta.starter ? starterArtifacts[meta.starter] : undefined;
  const starter = Starter;

  return (
    <ArtifactSessionProvider slug={slug} onSend={send}>
    <div
      className={`flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[14px] bg-surface shadow-card ${className}`}
      data-tool-chat={slug}
    >
      {/* header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-ink">{title ?? tool?.name ?? "Launchabl"}</span>
          <span className="hidden sm:inline">· free · first run without an account</span>
        </div>
        <div className="flex items-center gap-0.5">
          <AccountChip />
          <HistoryMenu slug={slug} currentId={currentId} onOpen={openConversation} onDelete={removeConversation} onClear={clearAll} />
          {messages.length > 0 && (
            <IconButton label="Start a new conversation" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              <span>New chat</span>
            </IconButton>
          )}
        </div>
      </div>

      {/* conversation */}
      <div ref={scrollRef} onScroll={onScroll} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-5 pb-3 sm:px-6">
        {messages.length === 0 && starter && !meta.starterBelowIntro && (
          <div style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>{Starter && <Starter prefill={prefill} />}</div>
        )}

        {messages.length === 0 && (
          <div className={`${starter ? "" : "my-auto"} flex flex-col items-center px-2 text-center`} style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>
            {(!starter || meta.starterBelowIntro) && (
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-ink-2">{meta.intro}</p>
            {Starter && meta.starterBelowIntro && (
              <div className="mt-6 w-full max-w-3xl text-left">
                <Starter prefill={prefill} />
              </div>
            )}
            <div className={`${meta.suggestions.length ? "mt-6" : ""} grid w-full max-w-2xl gap-2 sm:grid-cols-2`}>
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
            const files = messageFiles(message);
            const text = messageText(message);
            return (
              <div key={message.id} className="flex flex-col items-end gap-1.5 pl-10 sm:pl-24" style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}>
                {files.length > 0 && (
                  <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                    {files.map((part, index) => (
                      <FileBubble key={`${message.id}-file-${index}`} part={part} />
                    ))}
                  </div>
                )}
                {text && (
                  <div className="max-w-full rounded-2xl bg-field px-4 py-2.5 text-[14px] leading-[1.5] whitespace-pre-wrap text-ink">
                    {text}
                  </div>
                )}
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

        {signInRequired && (
          <div
            className="mx-auto w-full max-w-sm rounded-[12px] border border-line bg-field/60 p-4 sm:p-5"
            style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
            data-sign-in-card
          >
            <div className="mb-3 flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">That was your free run</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
                  Add your email to keep going — every tool, unlimited runs, no credit card. Your request picks up right where it left off.
                </p>
              </div>
            </div>
            <SignInForm
              compact
              onSignedIn={() => {
                clearError();
                pinnedRef.current = true;
                void regenerate();
              }}
            />
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
          onDragOver={onDragOver}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`relative flex cursor-text flex-col gap-2 rounded-control border bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong ${
            dragging ? "border-primary" : "border-line"
          }`}
        >
          {dragging && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-control bg-surface/90 text-[13px] font-medium text-ink">
              Drop images or text files
            </div>
          )}
          {attachments.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Attachments">
              {attachments.map((part, index) => (
                <AttachmentChip
                  key={`${part.filename ?? "file"}-${index}`}
                  part={part}
                  onRemove={() => setAttachments((current) => current.filter((_, i) => i !== index))}
                />
              ))}
            </ul>
          )}
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
            onPaste={onPaste}
            placeholder={attachments.length > 0 ? "What should I do with this?" : meta.placeholder}
            aria-label="Message"
            className="max-h-[200px] min-h-6 w-full resize-none bg-transparent text-[14px] leading-[1.5] text-ink outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <input ref={fileInputRef} type="file" multiple accept={ACCEPT} onChange={onPickFiles} className="hidden" tabIndex={-1} />
              <button
                type="button"
                aria-label="Attach images or text files"
                title="Attach an image, screenshot, CSV or text file"
                disabled={busy || attachments.length >= ATTACHMENT_LIMITS.maxFiles}
                onClick={(event) => {
                  event.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
              <span className="truncate text-[11.5px] text-ink-3">
                {attachError ? (
                  <span className="text-red">{attachError}</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line · </span>Paste or drop files
                  </>
                )}
              </span>
            </div>
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
