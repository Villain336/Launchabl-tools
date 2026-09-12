import { AttachmentError } from "@/lib/chat/attachments";
import type { TranscriptRef } from "@/lib/media/transcript";

/**
 * Browser side of recording attachments. Small files post straight to the
 * transcribe route; larger ones (when the deployment has Blob storage) go
 * browser → Vercel Blob and the route fetches them by URL. Either way the
 * chat only ever sees a transcript reference, never the audio.
 */

const DIRECT_LIMIT = 4_500_000;

export type UploadMode = { mode: "blob" | "direct"; maxBytes: number };
export type MediaPhase = { phase: "uploading" | "transcribing"; percent: number | null };

let modeCache: Promise<UploadMode> | null = null;

export function uploadMode(): Promise<UploadMode> {
  modeCache ??= fetch("/api/media/upload", { cache: "no-store" })
    .then(async (res) => (res.ok ? ((await res.json()) as UploadMode) : { mode: "direct" as const, maxBytes: DIRECT_LIMIT }))
    .catch(() => ({ mode: "direct" as const, maxBytes: DIRECT_LIMIT }));
  return modeCache;
}

export class MediaError extends AttachmentError {
  cause?: string;
  constructor(message: string, cause?: string) {
    super(message);
    this.cause = cause;
  }
}

const mb = (n: number) => `${Math.round(n / 1024 / 1024)} MB`;

async function parseResponse(res: Response): Promise<TranscriptRef> {
  const body = (await res.json().catch(() => ({}))) as { transcript?: TranscriptRef; error?: string; cause?: string };
  if (!res.ok || !body.transcript) throw new MediaError(body.error ?? `Transcription failed (${res.status}).`, body.cause);
  return body.transcript;
}

export async function transcribeFile(file: File, slug: string, onPhase: (phase: MediaPhase) => void, signal?: AbortSignal): Promise<TranscriptRef> {
  const { mode, maxBytes } = await uploadMode();
  if (file.size > maxBytes) {
    throw new MediaError(
      mode === "blob"
        ? `${file.name} is ${mb(file.size)}; the limit is ${mb(maxBytes)}. Export the audio at 64 kbps mono — speech transcribes just as well.`
        : `${file.name} is ${mb(file.size)}; this deployment takes recordings up to ${mb(maxBytes)}. Export a shorter or lower-bitrate audio file.`,
    );
  }
  onPhase({ phase: "uploading", percent: 0 });

  if (mode === "blob" && file.size > DIRECT_LIMIT) {
    const { upload } = await import("@vercel/blob/client");
    const blob = await upload(`recordings/${file.name}`, file, {
      access: "public",
      handleUploadUrl: "/api/media/upload",
      contentType: file.type || "audio/mpeg",
      abortSignal: signal,
      onUploadProgress: ({ percentage }) => onPhase({ phase: "uploading", percent: Math.round(percentage) }),
    });
    onPhase({ phase: "transcribing", percent: null });
    const res = await fetch("/api/media/transcribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: blob.url, name: file.name, slug }),
      signal,
    });
    return parseResponse(res);
  }

  const form = new FormData();
  form.set("file", file, file.name);
  form.set("slug", slug);
  onPhase({ phase: "transcribing", percent: null });
  const res = await fetch("/api/media/transcribe", { method: "POST", body: form, signal });
  return parseResponse(res);
}

/** The line appended to a message so the model (and later turns) can find the transcript. */
export const transcriptLine = (ref: TranscriptRef) => `Attached transcript: ${ref.summary}`;
