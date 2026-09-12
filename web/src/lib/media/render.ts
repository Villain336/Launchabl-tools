/**
 * Clip rendering recipes: ffmpeg commands that cut a clip, reframe it for
 * the platform (centre crop) and burn the clip's captions in, plus a
 * one-file shell script that does the whole set. Pure — runs in the browser
 * for the artifact and in tests. Rendering itself happens on the user's
 * machine until a worker with ffmpeg exists; see `RENDER_WORKER_NOTE`.
 */

import type { TranscriptSegment } from "@/lib/media/transcript";
import { toSrt } from "@/lib/media/transcript";

export type Frame = "9:16" | "1:1" | "4:5" | "16:9";

export const FRAMES: Record<Frame, { width: number; height: number; label: string }> = {
  "9:16": { width: 1080, height: 1920, label: "Vertical 9:16" },
  "4:5": { width: 1080, height: 1350, label: "Portrait 4:5" },
  "1:1": { width: 1080, height: 1080, label: "Square 1:1" },
  "16:9": { width: 1920, height: 1080, label: "Landscape 16:9" },
};

/** Default frame per platform; users can override in the artifact. */
export const PLATFORM_FRAME: Record<string, Frame> = {
  tiktok: "9:16",
  reels: "9:16",
  shorts: "9:16",
  linkedin: "4:5",
  x: "16:9",
  "podcast-teaser": "1:1",
};

export type RenderClip = {
  start: number;
  end: number;
  segments: TranscriptSegment[];
};

export type RenderOptions = {
  /** Source file name as it sits next to the script. */
  source: string;
  frame: Frame;
  /** Burn captions from the per-clip SRT (only when the clip has segments). */
  captions: boolean;
  /** Audio-only sources get a waveform on a dark card instead of a crop. */
  audioOnly: boolean;
  /** Brand accent for the waveform / caption highlight, hex without '#'. */
  accent?: string;
};

export const AUDIO_ONLY_EXT = /\.(mp3|m4a|wav|ogg|oga|flac|aac)$/i;

/** Quote a filename for POSIX sh: single quotes, with embedded quotes escaped. */
export const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

/** Filenames that are safe inside ffmpeg filter arguments (no ':' or ','). */
export const safeName = (name: string) => name.replace(/[^\w.-]+/g, "_");

const clipStem = (index: number) => `clip-${index + 1}`;
export const clipSrtName = (index: number) => `${clipStem(index)}.srt`;
export const clipOutputName = (index: number, frame: Frame) => `${clipStem(index)}-${frame.replace(":", "x")}.mp4`;

/**
 * libass style for burned captions: bold sans, white with a black outline,
 * bottom-centre, lifted clear of platform UI on vertical frames.
 *
 * Sizes are in the SRT's script resolution (libass converts SRT with
 * PlayResX=384, PlayResY=288 and scales to the video), not output pixels:
 * FontSize 15 is ~5% of the frame height on any frame.
 */
export function captionStyle(frame: Frame): string {
  const vertical = frame === "9:16" || frame === "4:5";
  return [
    "FontName=Inter",
    `FontSize=${frame === "16:9" ? 14 : 15}`,
    "Bold=1",
    "PrimaryColour=&H00FFFFFF",
    "OutlineColour=&H00000000",
    "BorderStyle=1",
    "Outline=2",
    "Shadow=1",
    "Alignment=2",
    `MarginV=${vertical ? 52 : 24}`,
    "MarginL=16",
    "MarginR=16",
  ].join(",");
}

function reframeFilter(frame: Frame): string {
  const { width, height } = FRAMES[frame];
  return `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1`;
}

function subtitlesFilter(index: number, frame: Frame): string {
  return `subtitles=${clipSrtName(index)}:force_style='${captionStyle(frame)}'`;
}

const ENCODE = "-c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart";

/**
 * One ffmpeg command for one clip. `-ss` before `-i` seeks the input, so the
 * output starts at 0 and the clip's re-based SRT lines up with it.
 */
export function renderCommand(clip: RenderClip, index: number, options: RenderOptions): string {
  const { frame } = options;
  const { width, height } = FRAMES[frame];
  const source = safeName(options.source);
  const start = clip.start.toFixed(2);
  const end = clip.end.toFixed(2);
  const duration = Math.max(0.5, clip.end - clip.start).toFixed(2);
  const accent = (options.accent ?? "FF6600").replace(/^#/, "");
  const captions = options.captions && clip.segments.length > 0;
  const output = clipOutputName(index, frame);

  if (options.audioOnly) {
    // Dark card (input 0, a lavfi colour source) + waveform of the cut audio (input 1) + captions.
    const waveHeight = Math.round(height * 0.2);
    const waveY = Math.round(height * 0.4);
    const chain = [
      `[1:a]aformat=channel_layouts=mono,showwaves=s=${width}x${waveHeight}:mode=cline:draw=full:rate=30:colors=0x${accent}:scale=cbrt[wave]`,
      `[0:v][wave]overlay=0:${waveY}:shortest=1${captions ? "[base]" : "[v]"}`,
      captions ? `[base]${subtitlesFilter(index, frame)}[v]` : null,
    ]
      .filter(Boolean)
      .join(";");
    return `ffmpeg -y -f lavfi -i color=c=0x0B0B0C:s=${width}x${height}:r=30 -ss ${start} -to ${end} -i ${source} -filter_complex "${chain}" -map "[v]" -map 1:a -t ${duration} ${ENCODE} ${output}`;
  }

  const filters = [reframeFilter(frame), captions ? subtitlesFilter(index, frame) : null].filter(Boolean).join(",");
  return `ffmpeg -y -ss ${start} -to ${end} -i ${source} -vf "${filters}" ${ENCODE} ${output}`;
}

/**
 * A self-contained POSIX shell script: writes each clip's SRT, checks for
 * ffmpeg, renders every clip, lists the outputs. Drop it next to the
 * recording and run `sh render-clips.sh`.
 */
export function renderScript(clips: RenderClip[], options: RenderOptions, meta: { title: string; platform: string }): string {
  const source = safeName(options.source);
  const lines: string[] = [
    "#!/bin/sh",
    `# ${meta.title} — ${clips.length} clip${clips.length === 1 ? "" : "s"} for ${meta.platform}, ${FRAMES[options.frame].label}`,
    "# Made with Launchabl Clip Finder. Put this file next to the recording and run:  sh render-clips.sh",
    "set -eu",
    "",
    'if ! command -v ffmpeg >/dev/null 2>&1; then',
    '  echo "ffmpeg is not installed. macOS: brew install ffmpeg · Ubuntu: sudo apt install ffmpeg · Windows: winget install ffmpeg" >&2',
    "  exit 1",
    "fi",
    `if [ ! -f ${shellQuote(source)} ]; then`,
    `  echo "Put the recording next to this script as ${source} (or edit the name above)." >&2`,
    "  exit 1",
    "fi",
    "",
  ];
  clips.forEach((clip, index) => {
    if (options.captions && clip.segments.length > 0) {
      lines.push(`cat > ${clipSrtName(index)} <<'SRT'`, toSrt(clip.segments).trimEnd(), "SRT", "");
    }
  });
  clips.forEach((clip, index) => {
    lines.push(`echo "Rendering clip ${index + 1}/${clips.length} (${clip.start.toFixed(1)}s–${clip.end.toFixed(1)}s)…"`, renderCommand(clip, index, options), "");
  });
  lines.push('echo "Done:"', `ls -1 ${clips.map((_, i) => clipOutputName(i, options.frame)).join(" ")}`, "");
  return lines.join("\n");
}

export const RENDER_WORKER_NOTE =
  "Rendering runs on your machine for now (ffmpeg, one command per clip). A hosted renderer that returns finished MP4s is the next step once a worker with ffmpeg is attached.";
