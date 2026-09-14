/**
 * Client-safe reply-queue types and copy helpers (§39).
 * The KV/auth module is `reply-queue.ts`. Do not import that from client components.
 */

export const REPLY_CHANNELS = [
  { id: "nextdoor", label: "Nextdoor" },
  { id: "facebook", label: "Facebook" },
  { id: "gbp", label: "Google Business Profile" },
] as const;
export type ReplyChannelId = (typeof REPLY_CHANNELS)[number]["id"];
export const isReplyChannelId = (value: unknown): value is ReplyChannelId =>
  typeof value === "string" && REPLY_CHANNELS.some((channel) => channel.id === value);

export const REPLY_STATUSES = ["ready", "copied", "sent", "skipped"] as const;
export type ReplyStatus = (typeof REPLY_STATUSES)[number];
export const isReplyStatus = (value: unknown): value is ReplyStatus => typeof value === "string" && (REPLY_STATUSES as readonly string[]).includes(value);

export const REPLY_QUEUE_RULE =
  "We draft. You send it from your phone. We do not scrape Nextdoor, Facebook, or Google, and we do not post as you.";

export type ReplyDraft = {
  id: string;
  orgId: string;
  orgName: string;
  slug: string;
  channel: ReplyChannelId;
  neighborhoodAsk: string;
  body: string;
  bookingPath: string;
  status: ReplyStatus;
  source: "pasted";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  copiedAt: string | null;
  sentAt: string | null;
};

export const REPLY_LIMITS = { askMax: 2000, bodyMax: 2000 } as const;

export function bookingShortPath(slug: string): string {
  return `/b/${slug}`;
}

export function draftIncludesBookingLink(body: string, slug: string): boolean {
  return body.includes(bookingShortPath(slug));
}

export function ensureBookingLink(body: string, slug: string): string {
  const trimmed = body.trim();
  if (draftIncludesBookingLink(trimmed, slug)) return trimmed;
  return `${trimmed}\n\nBook here: ${bookingShortPath(slug)}`;
}

export function replyClipboardText(draft: Pick<ReplyDraft, "body" | "bookingPath">, origin: string): string {
  const absolute = `${origin.replace(/\/$/, "")}${draft.bookingPath}`;
  if (draft.body.includes(absolute)) return draft.body;
  if (draft.body.includes(draft.bookingPath)) return draft.body.split(draft.bookingPath).join(absolute);
  return `${draft.body.trim()}\n\n${absolute}`;
}

export function suggestReplyBody(input: { businessName: string; city?: string; bookingPath: string }): string {
  const where = input.city ? ` in ${input.city}` : "";
  return `Hi — ${input.businessName} can take this${where}. Grab a time here and we’ll confirm: ${input.bookingPath}`;
}

export function channelLabel(id: ReplyChannelId): string {
  return REPLY_CHANNELS.find((channel) => channel.id === id)?.label ?? id;
}
