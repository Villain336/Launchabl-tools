/**
 * Transcripts: the pure half of the media tools.
 *
 * A transcript is timestamped segments plus the flat text. Everything a
 * tool or artifact needs from one — SRT/VTT captions, a time-marked text
 * the model can quote, windows of a long recording, clip slicing — is
 * derived here without touching the network, so it runs on the server, in
 * the browser and in tests alike.
 */

export type TranscriptSegment = { start: number; end: number; text: string };

export const AUDIO_TYPES = /^(audio\/(mpeg|mp3|mp4|m4a|x-m4a|wav|x-wav|wave|webm|ogg|flac|aac|x-aac)|video\/(mp4|webm|quicktime|x-m4v))$/i;
export const AUDIO_EXT = /\.(mp3|m4a|mp4|wav|webm|ogg|oga|flac|aac|mov|m4v)$/i;
export const ACCEPT_MEDIA = ".mp3,.m4a,.mp4,.wav,.webm,.ogg,.flac,.aac,.mov,audio/*,video/mp4,video/webm,video/quicktime";

export function isMediaFile(name: string, type: string): boolean {
  return AUDIO_TYPES.test(type) || AUDIO_EXT.test(name);
}

/** What the client sends back with a message once a recording is transcribed. */
export type TranscriptRef = { id: string; name: string; durationSec: number; words: number; timed: boolean; summary: string };

export type Transcript = {
  id: string;
  name: string;
  mediaType: string;
  bytes: number;
  language: string | null;
  durationSec: number;
  model: string;
  text: string;
  segments: TranscriptSegment[];
  createdAt: string;
  costUsd: number;
  /** Set when the model returned no timestamps; clipping and captions need them. */
  timed: boolean;
};

/** USD per minute of audio, approximate list prices; used when the gateway omits cost. */
export const TRANSCRIPTION_PRICES: Record<string, number> = {
  "openai/whisper-1": 0.006,
  "openai/gpt-4o-mini-transcribe": 0.003,
  "openai/gpt-4o-transcribe": 0.006,
};

export function estimateTranscriptionCost(model: string, durationSec: number): number {
  const perMinute = TRANSCRIPTION_PRICES[model] ?? 0.006;
  return (Math.max(0, durationSec) / 60) * perMinute;
}

export const clampTime = (value: number, max: number) => Math.min(Math.max(0, Number.isFinite(value) ? value : 0), Math.max(0, max));

/** `m:ss` for display; `h:mm:ss` past an hour. */
export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function captionTime(seconds: number, separator: "," | "."): string {
  const clamped = Math.max(0, seconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}${separator}${String(ms).padStart(3, "0")}`;
}

const cleanSegments = (segments: TranscriptSegment[]) => segments.filter((s) => s.text.trim()).map((s) => ({ ...s, text: s.text.trim() }));

export function toSrt(segments: TranscriptSegment[]): string {
  return cleanSegments(segments)
    .map((s, i) => `${i + 1}\n${captionTime(s.start, ",")} --> ${captionTime(Math.max(s.end, s.start + 0.5), ",")}\n${s.text}`)
    .join("\n\n")
    .concat("\n");
}

export function toVtt(segments: TranscriptSegment[]): string {
  const body = cleanSegments(segments)
    .map((s) => `${captionTime(s.start, ".")} --> ${captionTime(Math.max(s.end, s.start + 0.5), ".")}\n${s.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

/**
 * Transcript text with a `[m:ss]` marker at least every `everySec` seconds,
 * so a model can cite where something was said without seeing every
 * segment boundary. Falls back to the flat text when there are no timings.
 */
export function markedText(segments: TranscriptSegment[], everySec = 20, fallback = ""): string {
  const clean = cleanSegments(segments);
  if (clean.length === 0) return fallback;
  const out: string[] = [];
  let nextMark = -1;
  for (const s of clean) {
    if (s.start >= nextMark) {
      out.push(`\n[${formatTimestamp(s.start)}] `);
      nextMark = Math.floor(s.start / everySec) * everySec + everySec;
    }
    out.push(s.text, " ");
  }
  return out.join("").replace(/ +\n/g, "\n").trim();
}

/** Segments overlapping [start, end], re-based so the clip starts at 0. */
export function sliceSegments(segments: TranscriptSegment[], start: number, end: number): TranscriptSegment[] {
  return cleanSegments(segments)
    .filter((s) => s.end > start && s.start < end)
    .map((s) => ({ start: Math.max(0, s.start - start), end: Math.max(0, Math.min(s.end, end) - start), text: s.text }));
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Characters of marked text one model call should see at once; ~3k tokens. */
export const WINDOW_CHARS = 12_000;

/**
 * Cut a long transcript into windows the model reads one at a time. Windows
 * follow segment boundaries and report their time span so the model can ask
 * for the next one.
 */
export function transcriptWindows(transcript: Transcript, chars = WINDOW_CHARS): { index: number; start: number; end: number; text: string }[] {
  if (!transcript.timed || transcript.segments.length === 0) {
    const windows: { index: number; start: number; end: number; text: string }[] = [];
    for (let i = 0, index = 0; i < transcript.text.length; i += chars, index++) {
      windows.push({ index, start: 0, end: transcript.durationSec, text: transcript.text.slice(i, i + chars) });
    }
    return windows.length ? windows : [{ index: 0, start: 0, end: transcript.durationSec, text: "" }];
  }
  const windows: { index: number; start: number; end: number; text: string }[] = [];
  let bucket: TranscriptSegment[] = [];
  let size = 0;
  const flush = () => {
    if (bucket.length === 0) return;
    windows.push({ index: windows.length, start: bucket[0].start, end: bucket[bucket.length - 1].end, text: markedText(bucket) });
    bucket = [];
    size = 0;
  };
  for (const s of transcript.segments) {
    if (size + s.text.length > chars) flush();
    bucket.push(s);
    size += s.text.length + 12;
  }
  flush();
  return windows;
}

/** One-line summary used in message text and chips. */
export function describeTranscript(t: Pick<Transcript, "name" | "durationSec" | "text" | "id">): string {
  return `"${t.name}" (${formatTimestamp(t.durationSec)}, ${wordCount(t.text).toLocaleString()} words) — transcript id ${t.id}`;
}

export const TRANSCRIPT_REF = /transcript id (tr_[A-Za-z0-9_-]{8,})/g;

export function transcriptIdsIn(text: string): string[] {
  return Array.from(text.matchAll(TRANSCRIPT_REF), (m) => m[1]);
}
