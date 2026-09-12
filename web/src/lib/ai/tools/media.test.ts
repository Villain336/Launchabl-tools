import { describe, expect, it } from "vitest";
import { assembleClips, assembleTranscriptDeliverable } from "./media";
import type { Transcript } from "@/lib/media/transcript";

const transcript: Transcript = {
  id: "tr_testtesttest",
  name: "Episode 12.mp3",
  mediaType: "audio/mpeg",
  bytes: 1,
  language: "en",
  durationSec: 120,
  model: "openai/whisper-1",
  text: "Welcome back. Rule one: invoice the day you deliver. Rule two: take a deposit. That's the whole show.",
  segments: [
    { start: 0, end: 3, text: "Welcome back." },
    { start: 3, end: 30, text: "Rule one: invoice the day you deliver." },
    { start: 30, end: 70, text: "Rule two: take a deposit." },
    { start: 70, end: 120, text: "That's the whole show." },
  ],
  createdAt: "2026-09-12T00:00:00.000Z",
  costUsd: 0.01,
  timed: true,
};

describe("transcript deliverable", () => {
  it("normalises chapters, checks quotes verbatim and carries the segments for captions", () => {
    const out = assembleTranscriptDeliverable(
      {
        id: transcript.id,
        title: "Three rules for getting paid",
        summary: "A short episode on invoicing discipline for freelancers and small agencies, with two rules and a closing.",
        chapters: [
          { start: 900, title: "Way past the end" },
          { start: 30, title: "Deposits" },
        ],
        takeaways: ["Invoice the day you deliver.", "Take a deposit before you start."],
        quotes: [
          { start: 3, text: "Invoice the day you deliver" },
          { start: 30, text: "Always take a fifty percent deposit" },
        ],
        actionItems: [],
      },
      transcript,
    );
    expect(out.chapters.map((c) => `${c.label} ${c.title}`)).toEqual(["0:00 Intro", "0:30 Deposits", "2:00 Way past the end"]);
    expect(out.quotes.map((q) => q.verbatim)).toEqual([true, false]);
    expect(out.warnings[0]).toMatch(/1 quote isn't word-for-word/);
    expect(out.segments).toHaveLength(4);
    expect(out.words).toBe(18);
  });
});

describe("clips deliverable", () => {
  it("clamps ranges, slices the spoken words, flags length/overlap problems and writes ffmpeg commands", () => {
    const out = assembleClips(
      {
        id: transcript.id,
        platform: "tiktok",
        notes: "Captions on.",
        clips: [
          { start: 30, end: 70, title: "Deposits", hook: "Never start without a deposit", caption: "Rule two. #freelance", why: "Clear rule, quotable." },
          { start: 3, end: 10, title: "Rule one", hook: "Invoice today", caption: "Rule one.", why: "Short and punchy." },
          { start: 60, end: 500, title: "Outro", hook: "That's the show", caption: "Bye.", why: "Closing line." },
        ],
      },
      transcript,
    );
    expect(out.clips.map((c) => c.title)).toEqual(["Rule one", "Deposits", "Outro"]);
    expect(out.clips[0].warnings[0]).toMatch(/Short for tiktok/);
    expect(out.clips[0].excerpt).toBe("Rule one: invoice the day you deliver.");
    expect(out.clips[0].segments[0]).toEqual({ start: 0, end: 7, text: "Rule one: invoice the day you deliver." });
    expect(out.clips[1].warnings).toEqual([]);
    expect(out.clips[1].range).toBe("0:30–1:10");
    expect(out.clips[2].end).toBe(120);
    expect(out.clips[2].warnings).toEqual(["Overlaps the previous clip."]);
    expect(out.clips[1].ffmpeg).toBe('ffmpeg -ss 30.00 -to 70.00 -i "Episode_12.mp3" -c copy "clip-2.mp3"');
    expect(out.warnings).toEqual([]);
  });
});
