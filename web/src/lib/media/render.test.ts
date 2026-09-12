import { describe, expect, it } from "vitest";
import { captionStyle, clipOutputName, renderCommand, renderScript, safeName, shellQuote } from "./render";

const clip = {
  start: 12.5,
  end: 40,
  segments: [
    { start: 0, end: 4.2, text: "Most founders price too low." },
    { start: 4.2, end: 9.8, text: "Here's the fix." },
  ],
};

describe("clip render recipes", () => {
  it("cuts, centre-crops to the frame and burns the clip SRT", () => {
    const cmd = renderCommand(clip, 0, { source: "Q3 town hall.mp4", frame: "9:16", captions: true, audioOnly: false });
    expect(cmd).toContain("-ss 12.50 -to 40.00 -i Q3_town_hall.mp4");
    expect(cmd).toContain("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920");
    expect(cmd).toContain("subtitles=clip-1.srt:force_style='FontName=Inter,FontSize=15");
    expect(cmd).toContain("-c:v libx264");
    expect(cmd.endsWith(clipOutputName(0, "9:16"))).toBe(true);
    expect(clipOutputName(0, "9:16")).toBe("clip-1-9x16.mp4");
  });

  it("skips the subtitle filter when the clip has no words or captions are off", () => {
    const silent = renderCommand({ ...clip, segments: [] }, 1, { source: "a.mp4", frame: "1:1", captions: true, audioOnly: false });
    expect(silent).not.toContain("subtitles=");
    const off = renderCommand(clip, 1, { source: "a.mp4", frame: "1:1", captions: false, audioOnly: false });
    expect(off).not.toContain("subtitles=");
    expect(off).toContain("crop=1080:1080");
  });

  it("builds an audiogram for audio-only sources", () => {
    const cmd = renderCommand(clip, 2, { source: "episode 12.mp3", frame: "1:1", captions: true, audioOnly: true, accent: "#FF6600" });
    expect(cmd).toContain("-filter_complex");
    expect(cmd).toContain("-f lavfi -i color=c=0x0B0B0C:s=1080x1080:r=30 -ss 12.50 -to 40.00 -i episode_12.mp3");
    expect(cmd).toContain("showwaves=s=1080x216:mode=cline:draw=full:rate=30:colors=0xFF6600");
    expect(cmd).toContain("[base]subtitles=clip-3.srt");
    expect(cmd).toContain('-map "[v]" -map 1:a -t 27.50');
  });

  it("writes a runnable script with embedded SRTs and an ffmpeg check", () => {
    const script = renderScript([clip, { ...clip, start: 60, end: 90, segments: [] }], { source: "talk.mp4", frame: "9:16", captions: true, audioOnly: false }, { title: "Talk", platform: "TikTok" });
    expect(script.startsWith("#!/bin/sh")).toBe(true);
    expect(script).toContain("command -v ffmpeg");
    expect(script).toContain("cat > clip-1.srt <<'SRT'");
    expect(script).toContain("00:00:00,000 --> 00:00:04,200");
    expect(script).not.toContain("cat > clip-2.srt");
    expect(script).toContain("ls -1 clip-1-9x16.mp4 clip-2-9x16.mp4");
  });

  it("quotes for the shell and strips filter-hostile characters", () => {
    expect(shellQuote("it's here.mp4")).toBe(`'it'\\''s here.mp4'`);
    expect(safeName("my: clip, final.mov")).toBe("my_clip_final.mov");
    expect(captionStyle("16:9")).toContain("FontSize=14");
  });
});
