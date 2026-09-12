"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { useSession } from "@/lib/auth/use-session";
import { SignInForm } from "@/components/auth/sign-in-form";
import { hasDeliverable } from "@/lib/reports/extract";

/**
 * "Share report" in the chat header. Freezes the conversation's
 * deliverables into a public `/r/<id>` page and hands back the link.
 * Anonymous visitors see the sign-in form in place; the report is created
 * as soon as they're in.
 */

type State =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "done"; url: string; trimmed: boolean; key: string }
  | { phase: "error"; message: string };

/** Changes whenever the conversation gains content, so a stale link isn't reused. */
function conversationKey(messages: ToolChatMessage[]): string {
  const last = messages[messages.length - 1];
  return `${messages.length}:${last?.id ?? ""}:${last?.parts.length ?? 0}`;
}

export function ShareReportButton({ slug, messages, disabled, source }: { slug: string; messages: ToolChatMessage[]; disabled: boolean; source?: string }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const key = conversationKey(messages);
  const ready = hasDeliverable(messages);

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

  if (!ready) return null;

  const create = async () => {
    setState({ phase: "saving" });
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, messages }),
      });
      const body = (await res.json().catch(() => ({}))) as { path?: string; trimmed?: boolean; error?: string; cause?: string };
      if (!res.ok || !body.path) {
        setState({ phase: "error", message: body.error ?? "Couldn't create the report. Try again." });
        return;
      }
      setState({ phase: "done", url: `${window.location.origin}${body.path}`, trimmed: Boolean(body.trimmed), key });
    } catch {
      setState({ phase: "error", message: "Network error. Try again." });
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    const fresh = state.phase === "done" && state.key === key;
    if (session.user && !fresh && state.phase !== "saving") void create();
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Share as a client report"
        title="Share this conversation's deliverables as a report"
        disabled={disabled}
        onClick={toggle}
        className={`flex h-7 items-center gap-1 rounded-[6px] px-1.5 text-[12px] font-medium transition-colors duration-100 hover:bg-hover disabled:opacity-40 ${
          open ? "text-ink" : "text-ink-3 hover:text-ink"
        }`}
        data-share-report
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Share report"
          className="absolute right-0 top-full z-20 mt-1 w-[320px] rounded-[10px] border border-line bg-surface p-3 shadow-card"
          style={{ animation: "fade-up 200ms cubic-bezier(0.23,1,0.32,1) both" }}
        >
          <p className="text-[13px] font-semibold text-ink">Share as a client report</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-2">
            A clean page with every deliverable from this conversation. Anyone with the link can view it; it stays up for 90 days.
          </p>
          {session.status === "ready" && !session.user ? (
            <div className="mt-3">
              <SignInForm
                compact
                source={source}
                onSignedIn={() => {
                  void create();
                }}
              />
            </div>
          ) : state.phase === "saving" || session.status !== "ready" ? (
            <p className="mt-3 text-[12.5px] text-ink-3" role="status">
              Creating your report…
            </p>
          ) : state.phase === "error" ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[12.5px] text-red">{state.message}</p>
              <button type="button" onClick={() => void create()} className="shrink-0 text-[12px] font-medium text-ink hover:underline">
                Retry
              </button>
            </div>
          ) : state.phase === "done" ? (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 rounded-[8px] border border-line bg-field px-2 py-1.5">
                <input
                  readOnly
                  value={state.url}
                  onFocus={(event) => event.currentTarget.select()}
                  aria-label="Report link"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-ink outline-none"
                  data-report-url
                />
                <button
                  type="button"
                  onClick={() => copy(state.url)}
                  aria-label={copied ? "Copied" : "Copy link"}
                  className={`flex size-6 items-center justify-center rounded-[5px] transition-colors duration-100 hover:bg-hover ${copied ? "text-green" : "text-ink-3 hover:text-ink"}`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <a
                  href={state.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open report"
                  className="flex size-6 items-center justify-center rounded-[5px] text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              {state.trimmed && <p className="mt-2 text-[11.5px] text-ink-3">Generated images were left out to keep the page small.</p>}
              {state.key !== key && (
                <button type="button" onClick={() => void create()} className="mt-2 text-[12px] font-medium text-ink hover:underline">
                  The conversation changed — refresh the report
                </button>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
