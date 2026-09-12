/**
 * Shareable client reports.
 *
 * A report is the deliverable half of a conversation — the briefs the
 * person typed, the assistant's final words and every artifact a tool
 * produced — frozen into a small JSON record with a public, unguessable
 * URL (`/r/<id>`). Reports are the hand-off from a free tool run to a
 * client, a teammate or a sales conversation, so they render with the
 * same artifact components as the chat and carry a light Launchabl brand.
 *
 * This module is pure (no store, no React) so the chat client can reuse
 * the extraction rules; persistence lives in `./storage`.
 */

import type { ToolChatMessage } from "@/lib/ai/chat-message";
import { hasGeneratedPixels, stripGeneratedPixels } from "@/lib/chat/pixels";

export const REPORT_TTL_SECONDS = 90 * 24 * 60 * 60;
export const REPORT_MAX_BYTES = 800_000;
export const REPORT_MAX_ITEMS = 80;
const TITLE_MAX = 90;
const TEXT_MAX = 20_000;

export type ReportItem =
  | { kind: "prompt"; text: string }
  | { kind: "text"; text: string }
  | { kind: "tool"; tool: string; toolCallId: string; input: unknown; output: unknown };

export type Report = {
  id: string;
  /** Tool slug the conversation ran in (`agent`, `seo-audit`, …). */
  slug: string;
  title: string;
  ownerUid: string;
  /** Display name for "Prepared by"; null when the account has no name. */
  preparedBy: string | null;
  createdAt: string;
  items: ReportItem[];
  /** Set when images were dropped to fit the size budget. */
  trimmed?: boolean;
};

/** Tools whose output is a working step, not a deliverable; left out of reports. */
const INTERNAL_TOOLS = new Set(["fetchPage", "readTranscript"]);

type LoosePart = { type?: unknown; text?: unknown; state?: unknown; input?: unknown; output?: unknown; toolCallId?: unknown };
type LooseMessage = { role?: unknown; parts?: unknown };

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, TEXT_MAX) : "";
}

/**
 * Deliverables in conversation order: each user brief, then the tool
 * artifacts and closing text of the reply. Consecutive text parts inside
 * one reply merge into a single block; empty and errored parts are skipped.
 */
export function extractReportItems(messages: ToolChatMessage[] | unknown[]): ReportItem[] {
  const items: ReportItem[] = [];
  for (const raw of messages as LooseMessage[]) {
    if (!raw || !Array.isArray(raw.parts)) continue;
    if (raw.role === "user") {
      const text = (raw.parts as LoosePart[])
        .filter((part) => part.type === "text")
        .map((part) => cleanText(part.text))
        .filter(Boolean)
        .join("\n\n");
      if (text) items.push({ kind: "prompt", text });
      continue;
    }
    if (raw.role !== "assistant") continue;
    let pending = "";
    const flush = () => {
      if (pending.trim()) items.push({ kind: "text", text: pending.trim() });
      pending = "";
    };
    for (const part of raw.parts as LoosePart[]) {
      if (part.type === "text") {
        const text = cleanText(part.text);
        if (text) pending = pending ? `${pending}\n\n${text}` : text;
        continue;
      }
      if (typeof part.type === "string" && part.type.startsWith("tool-") && part.state === "output-available") {
        const tool = part.type.slice(5);
        if (INTERNAL_TOOLS.has(tool) || !tool) continue;
        flush();
        items.push({
          kind: "tool",
          tool,
          toolCallId: typeof part.toolCallId === "string" ? part.toolCallId : `${tool}-${items.length}`,
          input: part.input ?? null,
          output: part.output ?? null,
        });
      }
    }
    flush();
  }
  return items;
}

export function reportTitle(items: ReportItem[], fallback = "Launchabl report"): string {
  const first = items.find((item) => item.kind === "prompt");
  const text = first?.text.replace(/\s+/g, " ").trim() ?? "";
  if (!text) return fallback;
  return text.length > TITLE_MAX ? `${text.slice(0, TITLE_MAX - 1).trimEnd()}…` : text;
}

export const byteLength = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;

/**
 * Shrink a report into the byte budget: cap the item count, drop inline
 * pixels (newest last), then drop the oldest items. Returns null when even
 * a single item doesn't fit.
 */
export function fitReport(report: Report, maxBytes = REPORT_MAX_BYTES): Report | null {
  let items = report.items.slice(-REPORT_MAX_ITEMS);
  let trimmed = items.length < report.items.length;
  const size = () => byteLength({ ...report, items, trimmed });
  if (size() <= maxBytes) return { ...report, items, trimmed: trimmed || undefined };

  for (let i = 0; i < items.length && size() > maxBytes; i++) {
    const item = items[i];
    if (item.kind === "tool" && hasGeneratedPixels(item.output)) {
      items = items.map((it) => (it === item ? { ...item, output: stripGeneratedPixels(item.output as Record<string, unknown>) } : it));
      trimmed = true;
    }
  }
  while (items.length > 0 && size() > maxBytes) {
    items = items.slice(1);
    trimmed = true;
  }
  if (items.length === 0 || !items.some((item) => item.kind === "tool")) return null;
  return { ...report, items, trimmed };
}

/** True when the conversation holds at least one deliverable a report could carry. */
export function hasDeliverable(messages: ToolChatMessage[]): boolean {
  return messages.some(
    (message) =>
      message.role === "assistant" &&
      message.parts.some((part) => part.type.startsWith("tool-") && "state" in part && part.state === "output-available" && !INTERNAL_TOOLS.has(part.type.slice(5))),
  );
}
