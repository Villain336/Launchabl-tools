import { describe, expect, it } from "vitest";
import {
  describeTranscript,
  estimateTranscriptionCost,
  formatTimestamp,
  markedText,
  sliceSegments,
  toSrt,
  toVtt,
  transcriptIdsIn,
  transcriptWindows,
  type Transcript,
} from "./transcript";

const segments = [
  { start: 0, end: 4.2, text: "Welcome back to the show." },
  { start: 4.2, end: 21.5, text: "Today: three rules for getting paid on time." },
  { start: 21.5, end: 30, text: "  " },
  { start: 30, end: 41, text: "Rule one — invoice the day you deliver." },
  { start: 41, end: 3661.25, text: "Rule two, deposits." },
];

describe("transcript formatting", () => {
  it("formats timestamps and captions", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(65)).toBe("1:05");
    expect(formatTimestamp(3661)).toBe("1:01:01");
    const srt = toSrt(segments);
    expect(srt.startsWith("1\n00:00:00,000 --> 00:00:04,200\nWelcome back to the show.\n\n2\n00:00:04,200 --> 00:00:21,500")).toBe(true);
    expect(srt).not.toContain("\n3\n00:00:21,500 --> 00:00:30,000\n\n"); // blank segment dropped
    expect(srt.trim().endsWith("01:01:01,250\nRule two, deposits.")).toBe(true);
    const vtt = toVtt(segments);
    expect(vtt.startsWith("WEBVTT\n\n00:00:00.000 --> 00:00:04.200\n")).toBe(true);
  });

  it("marks text every N seconds and slices clips relative to their start", () => {
    const marked = markedText(segments, 20);
    expect(marked.startsWith("[0:00] Welcome back to the show. Today: three rules")).toBe(true);
    expect(marked).toContain("\n[0:30] Rule one");
    expect(marked).toContain("\n[0:41] Rule two");
    expect(markedText([], 20, "flat")).toBe("flat");

    const clip = sliceSegments(segments, 3, 35);
    expect(clip.map((s) => s.text)).toEqual(["Welcome back to the show.", "Today: three rules for getting paid on time.", "Rule one — invoice the day you deliver."]);
    expect(clip[0]).toEqual({ start: 0, end: 1.2000000000000002, text: "Welcome back to the show." });
    expect(clip[2].end).toBe(32);
  });

  it("windows long transcripts on segment boundaries and describes them", () => {
    const many = Array.from({ length: 400 }, (_, i) => ({ start: i * 10, end: i * 10 + 9, text: `Segment ${i} says something worth about seventy characters of text, roughly.` }));
    const transcript: Transcript = {
      id: "tr_abcdefghij",
      name: "ep12.mp3",
      mediaType: "audio/mpeg",
      bytes: 1,
      language: "en",
      durationSec: 4000,
      model: "openai/whisper-1",
      text: many.map((s) => s.text).join(" "),
      segments: many,
      createdAt: "2026-09-12T00:00:00.000Z",
      costUsd: 0.4,
      timed: true,
    };
    const windows = transcriptWindows(transcript, 6_000);
    expect(windows.length).toBeGreaterThan(3);
    expect(windows[0].start).toBe(0);
    expect(windows[1].start).toBeGreaterThan(windows[0].end - 10);
    expect(windows.every((w) => w.text.length <= 6_500)).toBe(true);
    expect(windows[windows.length - 1].end).toBe(3999);

    const untimed = transcriptWindows({ ...transcript, timed: false, segments: [] }, 6_000);
    expect(untimed.length).toBeGreaterThan(3);
    expect(untimed[0].text.length).toBe(6_000);

    const line = describeTranscript(transcript);
    expect(line).toBe(`"ep12.mp3" (1:06:40, 4,400 words) — transcript id tr_abcdefghij`);
    expect(transcriptIdsIn(`Attached: ${line}. Also transcript id tr_zzzzzzzz1.`)).toEqual(["tr_abcdefghij", "tr_zzzzzzzz1"]);
    expect(estimateTranscriptionCost("openai/whisper-1", 600)).toBeCloseTo(0.06, 6);
  });
});
