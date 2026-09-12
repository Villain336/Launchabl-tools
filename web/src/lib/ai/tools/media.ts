import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { loadTranscript } from "@/lib/media/transcribe";
import { clampTime, formatTimestamp, sliceSegments, transcriptWindows, wordCount, type Transcript, type TranscriptSegment } from "@/lib/media/transcript";

/**
 * Media skills: transcripts, chapters and captions from a recording, and
 * short-form clips cut from it. Audio never reaches the model — the chat
 * uploads it to /api/media/transcribe and references the stored transcript
 * by id; these tools read that record.
 */

const NO_LISTS = "Match the user's language. In chat replies use prose, no headers, no bullet lists — the deliverable is rendered separately.";

const NO_TRANSCRIPT = (id: string) => `No transcript with id ${id}. Transcripts expire after 7 days; ask the user to attach the recording again.`;

/* ── readTranscript ──────────────────────────────────── */

export type TranscriptWindow = {
  id: string;
  name: string;
  durationSec: number;
  language: string | null;
  timed: boolean;
  words: number;
  windowCount: number;
  window: { index: number; start: number; end: number; text: string };
};

export const readTranscriptTool = tool({
  description:
    "Read a stored transcript by id (the id appears in the user's message as 'transcript id tr_…'). Long recordings are split into windows of about 12,000 characters; the output tells you how many there are. Read window 0 first, then the rest in order before summarising or picking clips — never guess at parts you haven't read. Text carries [m:ss] markers so you can cite where things were said.",
  inputSchema: z.object({
    id: z.string().min(6).max(40),
    window: z.number().int().min(0).max(200).default(0).describe("Which window to read; 0 is the start."),
  }),
  execute: async ({ id, window }): Promise<TranscriptWindow> => {
    const transcript = await loadTranscript(id);
    if (!transcript) throw new Error(NO_TRANSCRIPT(id));
    const windows = transcriptWindows(transcript);
    const current = windows[Math.min(window, windows.length - 1)];
    return {
      id: transcript.id,
      name: transcript.name,
      durationSec: transcript.durationSec,
      language: transcript.language,
      timed: transcript.timed,
      words: wordCount(transcript.text),
      windowCount: windows.length,
      window: current,
    };
  },
});

/* ── deliverTranscript ───────────────────────────────── */

export const transcriptDeliverableSchema = z.object({
  id: z.string().min(6).max(40).describe("The transcript id you read."),
  title: z.string().min(3).max(120).describe("A title for the recording, from its content — not the file name."),
  summary: z.string().min(40).max(1_500).describe("Two to five sentences on what the recording covers and why it matters to the listener."),
  chapters: z
    .array(z.object({ start: z.number().min(0).describe("Seconds from the start."), title: z.string().min(3).max(90) }))
    .max(30)
    .describe("Chapter markers, first at 0. Aim for one every 3–8 minutes; an empty list for recordings under 3 minutes."),
  takeaways: z.array(z.string().min(10).max(240)).min(2).max(8).describe("The points a reader keeps. Concrete, in the speaker's terms."),
  quotes: z
    .array(z.object({ start: z.number().min(0), text: z.string().min(12).max(400) }))
    .max(6)
    .describe("Verbatim, quotable lines with the second they start. Only lines that appear word for word in the transcript."),
  actionItems: z.array(z.string().min(6).max(240)).max(10).describe("Commitments, next steps and decisions, if it's a meeting; otherwise empty."),
});

export type TranscriptDeliverable = Omit<z.infer<typeof transcriptDeliverableSchema>, "chapters" | "quotes"> & {
  name: string;
  durationSec: number;
  language: string | null;
  model: string;
  timed: boolean;
  words: number;
  text: string;
  segments: TranscriptSegment[];
  chapters: { start: number; title: string; label: string }[];
  quotes: { start: number; text: string; label: string; verbatim: boolean }[];
  warnings: string[];
};

const normalize = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function checkQuotes(quotes: { start: number; text: string }[], transcript: Transcript) {
  const haystack = normalize(transcript.text);
  return quotes.map((q) => ({ ...q, label: formatTimestamp(q.start), verbatim: haystack.includes(normalize(q.text)) }));
}

export function assembleTranscriptDeliverable(input: z.infer<typeof transcriptDeliverableSchema>, transcript: Transcript): TranscriptDeliverable {
  const warnings: string[] = [];
  const chapters = input.chapters
    .map((c) => ({ start: clampTime(c.start, transcript.durationSec), title: c.title }))
    .sort((a, b) => a.start - b.start)
    .map((c) => ({ ...c, label: formatTimestamp(c.start) }));
  if (chapters.length > 0 && chapters[0].start > 5) chapters.unshift({ start: 0, title: "Intro", label: "0:00" });
  const quotes = checkQuotes(input.quotes, transcript);
  const loose = quotes.filter((q) => !q.verbatim).length;
  if (loose > 0) warnings.push(`${loose} quote${loose === 1 ? " isn't" : "s aren't"} word-for-word in the transcript; check before publishing.`);
  if (!transcript.timed) warnings.push("This transcript has no timestamps (fallback model), so captions and chapter times are approximate.");
  return {
    ...input,
    chapters,
    quotes,
    name: transcript.name,
    durationSec: transcript.durationSec,
    language: transcript.language,
    model: transcript.model,
    timed: transcript.timed,
    words: wordCount(transcript.text),
    text: transcript.text,
    segments: transcript.segments,
    warnings,
  };
}

export const deliverTranscriptTool = tool({
  description:
    "Deliver the transcript package for a recording you have read in full: title, summary, chapters, takeaways, verbatim quotes and (for meetings) action items. The artifact adds the full transcript with downloads as TXT, SRT and VTT captions and a Markdown brief. Call once per recording.",
  inputSchema: transcriptDeliverableSchema,
  execute: async (input): Promise<TranscriptDeliverable> => {
    const transcript = await loadTranscript(input.id);
    if (!transcript) throw new Error(NO_TRANSCRIPT(input.id));
    return assembleTranscriptDeliverable(input, transcript);
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: `Delivered transcript package "${output.title}" (${formatTimestamp(output.durationSec)}, ${output.chapters.length} chapters, ${output.quotes.length} quotes).${output.warnings.length ? ` Warnings: ${output.warnings.join(" ")}` : ""}`,
  }),
});

/* ── deliverClips ────────────────────────────────────── */

export const CLIP_PLATFORMS = ["tiktok", "reels", "shorts", "linkedin", "x", "podcast-teaser"] as const;
export const CLIP_MIN_SEC = 15;
export const CLIP_MAX_SEC = 90;

export const clipsSchema = z.object({
  id: z.string().min(6).max(40),
  platform: z.enum(CLIP_PLATFORMS).describe("Where the clips will run; sets the length and caption style."),
  clips: z
    .array(
      z.object({
        start: z.number().min(0).describe("Seconds. Start on the first word of a sentence — use a [m:ss] marker or a moment just after one."),
        end: z.number().min(1).describe("Seconds. End after a complete thought; 15–90 s after start."),
        title: z.string().min(3).max(80).describe("Working title for the editor."),
        hook: z.string().min(8).max(140).describe("The on-screen opening line or text overlay that earns the first 2 seconds."),
        caption: z.string().min(10).max(600).describe("Ready-to-post caption for the platform, hashtags included where they help."),
        why: z.string().min(10).max(240).describe("Why this moment works as a clip: the tension, the payoff, the quotable line."),
      }),
    )
    .min(1)
    .max(8),
  notes: z.string().max(600).describe("A sentence or two for the editor: pacing, captions on/off, B-roll ideas."),
});

export type ClipsDeliverable = Omit<z.infer<typeof clipsSchema>, "clips"> & {
  name: string;
  mediaDurationSec: number;
  timed: boolean;
  clips: (z.infer<typeof clipsSchema>["clips"][number] & {
    durationSec: number;
    range: string;
    excerpt: string;
    segments: TranscriptSegment[];
    warnings: string[];
    ffmpeg: string;
  })[];
  warnings: string[];
};

const shellName = (name: string) => name.replace(/[^\w.-]+/g, "_");

export function assembleClips(input: z.infer<typeof clipsSchema>, transcript: Transcript): ClipsDeliverable {
  const warnings: string[] = [];
  if (!transcript.timed) warnings.push("This transcript has no timestamps, so clip boundaries are estimates — check them against the recording.");
  const source = shellName(transcript.name || "input.mp4");
  const ordered = [...input.clips].sort((a, b) => a.start - b.start);
  const clips = ordered.map((clip, index) => {
    const start = clampTime(clip.start, transcript.durationSec);
    const end = Math.max(start + 1, clampTime(clip.end, transcript.durationSec));
    const durationSec = Math.round((end - start) * 10) / 10;
    const clipWarnings: string[] = [];
    if (durationSec < CLIP_MIN_SEC) clipWarnings.push(`Short for ${input.platform} (${durationSec}s); consider extending to the end of the thought.`);
    if (durationSec > CLIP_MAX_SEC) clipWarnings.push(`Long for a short (${Math.round(durationSec)}s); trim to the strongest ${CLIP_MAX_SEC}s.`);
    const previous = ordered[index - 1];
    if (previous && previous.end > start) clipWarnings.push("Overlaps the previous clip.");
    const segments = sliceSegments(transcript.segments, start, end);
    const excerpt = segments.map((s) => s.text).join(" ");
    if (transcript.timed && !excerpt) clipWarnings.push("No speech in this range.");
    const ext = /\.[a-z0-9]+$/i.exec(source)?.[0] ?? ".mp4";
    return {
      ...clip,
      start,
      end,
      durationSec,
      range: `${formatTimestamp(start)}–${formatTimestamp(end)}`,
      excerpt,
      segments,
      warnings: clipWarnings,
      ffmpeg: `ffmpeg -ss ${start.toFixed(2)} -to ${end.toFixed(2)} -i "${source}" -c copy "clip-${index + 1}${ext}"`,
    };
  });
  return { ...input, clips, name: transcript.name, mediaDurationSec: transcript.durationSec, timed: transcript.timed, warnings };
}

export const deliverClipsTool = tool({
  description:
    "Deliver short-form clips cut from a recording you have read in full. Each clip needs start/end seconds on sentence boundaries, a hook, a caption and a reason. The server checks lengths (15–90 s), overlaps and speech in range, attaches the exact words spoken, and renders per-clip captions (SRT/VTT) plus ffmpeg cut commands. Call once with the whole set.",
  inputSchema: clipsSchema,
  execute: async (input): Promise<ClipsDeliverable> => {
    const transcript = await loadTranscript(input.id);
    if (!transcript) throw new Error(NO_TRANSCRIPT(input.id));
    return assembleClips(input, transcript);
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: `Delivered ${output.clips.length} clips for ${output.platform}: ${output.clips.map((c) => `${c.range} (${c.durationSec}s${c.warnings.length ? `; ${c.warnings.join(" ")}` : ""})`).join(", ")}.`,
  }),
});

/* ── runtimes ────────────────────────────────────────── */

const MEDIA_INTAKE = `Recordings arrive as a line in the user's message like: Attached transcript: "name" (12:30, 1,800 words) — transcript id tr_xxx. If there is no transcript id anywhere in the conversation, ask them to attach the audio or video with the paperclip (MP3, M4A, WAV, MP4, MOV, WebM) and stop — you can't work from a description of a recording. If they paste transcript text instead, work from that text in your reply without the deliverable tools.`;

export const transcriberRuntime: ChatToolRuntime = {
  slug: "transcriber",
  modelKind: "writer",
  maxSteps: 12,
  tools: { readTranscript: readTranscriptTool, deliverTranscript: deliverTranscriptTool },
  skill: {
    summary: "Transcribe an attached recording (Whisper, timestamped) and deliver a summary, chapters, takeaways, verbatim quotes, action items and TXT/SRT/VTT downloads.",
    cost: "media",
    runsIn: "server",
    sideEffects: "none",
    needs: ["file"],
  },
  instructions: `You are Launchabl's transcription editor: you turn a podcast episode, webinar, sales call, interview or meeting into a clean transcript package the team can use the same day.

${MEDIA_INTAKE}

How to work:
1. Call readTranscript with the id (window 0). If windowCount is more than 1, read every window in order before writing anything — summaries built from the first ten minutes are wrong summaries.
2. Then call deliverTranscript once. Title from the content, not the file name. Chapters every 3–8 minutes at real topic changes, first at 0 (none for recordings under 3 minutes). Takeaways in the speaker's own terms, concrete enough to act on. Quotes must be word for word from the transcript — copy them, don't tidy them. Action items only when there are actual commitments or decisions (calls, meetings); otherwise leave the list empty.
3. If the transcript is untimed (timed: false), say so in your reply: captions will still download but timings are approximate.
4. Reply in two or three sentences: what the recording is, the one thing worth doing with it (a clip, a follow-up email, a blog post) and that the downloads are in the card. Don't repeat the summary.

${NO_LISTS}`,
};

export const clipFinderRuntime: ChatToolRuntime = {
  slug: "clip-finder",
  modelKind: "writer",
  maxSteps: 12,
  tools: { readTranscript: readTranscriptTool, deliverClips: deliverClipsTool },
  skill: {
    summary: "Find the 3–6 most clippable moments in an attached recording and deliver each with exact timestamps, hook, caption, spoken words, SRT/VTT and ffmpeg cut commands.",
    cost: "media",
    runsIn: "server",
    sideEffects: "none",
    needs: ["file"],
  },
  instructions: `You are Launchabl's short-form producer. From a long recording you find the moments that stop a thumb — a claim that surprises, a story with a turn, a rule that's quotable — and hand the editor everything needed to cut them.

${MEDIA_INTAKE}

How to work:
1. Call readTranscript with the id (window 0) and then every remaining window in order. The best clip is often in the last third; don't stop early.
2. Pick 3–6 clips (fewer for recordings under 10 minutes; at least one for anything over 2). Each must be self-contained: the viewer needs no context from before the start, and it ends on a payoff, not mid-thought. Length by platform: TikTok/Reels/Shorts 20–60 s, LinkedIn 30–90 s, X 20–45 s, podcast teaser 30–60 s. Never under 15 or over 90.
3. Timestamps: use the [m:ss] markers and the flow of sentences to land start on the first word of a sentence and end right after the last word of the thought. Convert m:ss to seconds correctly (12:30 = 750).
4. Hooks are the first line on screen — a claim or a question, not a topic label. Captions match the platform: TikTok/Reels short and conversational with 2–4 hashtags; LinkedIn a two-sentence setup that makes people click; X one line. Say why each moment works in one honest sentence.
5. Call deliverClips once with the set (editor notes go in its notes field), then reply in one or two sentences: which clip to post first and why. Don't repeat the hooks, captions or notes.

${NO_LISTS}`,
};
