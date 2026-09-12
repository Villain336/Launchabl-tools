import { experimental_transcribe as transcribe } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { classifyAiError, NoModelAvailableError, type AiFailure } from "@/lib/ai/errors";
import { getStore, type KeyValueStore } from "@/lib/ai/store";
import { recordUsage } from "@/lib/ai/usage";
import { estimateTranscriptionCost, isMediaFile, type Transcript, type TranscriptSegment } from "@/lib/media/transcript";

export { isMediaFile };

/**
 * Speech-to-text through the AI Gateway, with the same walk-the-chain
 * behaviour as text and images. Whisper leads because it returns
 * timestamped segments (captions and clipping need them); the 4o
 * transcribe models are text-only fallbacks, so a transcript records
 * whether it is `timed`.
 *
 * Transcripts are stored for a week under an unguessable id and referenced
 * from chat messages by that id, so the audio itself never enters the
 * conversation or the model context.
 */

export const MEDIA_LIMITS = {
  /** Largest upload the API route accepts in the request body (Vercel function limit is 4.5 MB). */
  directBytes: 4_500_000,
  /** Largest file fetched from a Blob URL; Whisper's own cap is 25 MB. */
  blobBytes: 25 * 1024 * 1024,
  /** Minutes of audio one client may transcribe per day. */
  minutesPerDay: 120,
  /** Files per client per 10 minutes. */
  burst: 8,
} as const;

export const TRANSCRIPT_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Large uploads need Vercel Blob; without its token the client is limited to direct uploads. */
export const blobEnabled = (env: Record<string, string | undefined> = process.env) => Boolean(env.BLOB_READ_WRITE_TOKEN);


const DEFAULT_CHAIN = ["openai/whisper-1", "openai/gpt-4o-mini-transcribe"];

export function transcriptionChain(env: Record<string, string | undefined> = process.env): string[] {
  const override = (env.AI_MODEL_TRANSCRIBE ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("/"));
  return Array.from(new Set(override.length > 0 ? override : DEFAULT_CHAIN));
}

export function newTranscriptId(): string {
  return `tr_${Buffer.from(crypto.getRandomValues(new Uint8Array(9))).toString("base64url")}`;
}

function reportedCost(meta: Record<string, unknown> | undefined): number | null {
  const cost = (meta?.gateway as { cost?: unknown } | undefined)?.cost;
  if (typeof cost === "number") return cost;
  if (typeof cost === "string" && cost.trim() && !Number.isNaN(Number(cost))) return Number(cost);
  return null;
}

/** Rough length for text-only models: assumes ~128 kbps, which most podcast/voice exports are near. */
const estimateDuration = (bytes: number) => Math.round((bytes * 8) / 128_000);

export type TranscribeOptions = {
  bytes: Uint8Array;
  mediaType: string;
  name: string;
  /** Tool slug for usage accounting. */
  slug: string;
  chain?: string[];
  abortSignal?: AbortSignal;
};

export async function transcribeMedia(options: TranscribeOptions): Promise<Transcript & { skipped: { model: string; failure: AiFailure }[] }> {
  const chain = options.chain ?? transcriptionChain();
  const skipped: { model: string; failure: AiFailure }[] = [];
  const started = Date.now();
  for (const model of chain) {
    try {
      const result = await transcribe({
        model: gateway.transcriptionModel(model),
        audio: options.bytes,
        abortSignal: options.abortSignal,
        maxRetries: 1,
        providerOptions: model === "openai/whisper-1" ? { openai: { timestampGranularities: ["segment"] } } : {},
      });
      const segments: TranscriptSegment[] = (result.segments ?? [])
        .map((s) => ({ start: Number(s.startSecond) || 0, end: Number(s.endSecond) || 0, text: String(s.text ?? "").trim() }))
        .filter((s) => s.text);
      const timed = segments.length > 0;
      const durationSec = Math.round(result.durationInSeconds ?? (timed ? segments[segments.length - 1].end : estimateDuration(options.bytes.byteLength)));
      const costUsd = reportedCost(result.providerMetadata as Record<string, unknown> | undefined) ?? estimateTranscriptionCost(model, durationSec);
      void recordUsage({ slug: options.slug, model, inputTokens: 0, outputTokens: 0, reportedCostUsd: costUsd, durationMs: Date.now() - started, ok: true });
      return {
        id: newTranscriptId(),
        name: options.name,
        mediaType: options.mediaType,
        bytes: options.bytes.byteLength,
        language: result.language ?? null,
        durationSec,
        model,
        text: result.text.trim(),
        segments,
        createdAt: new Date().toISOString(),
        costUsd,
        timed,
        skipped,
      };
    } catch (error) {
      const failure = classifyAiError(error);
      skipped.push({ model, failure });
      void recordUsage({ slug: options.slug, model, inputTokens: 0, outputTokens: 0, reportedCostUsd: 0, durationMs: Date.now() - started, ok: false });
      if (!failure.fallback) throw new NoModelAvailableError(skipped);
    }
  }
  throw new NoModelAvailableError(skipped);
}

export async function saveTranscript(transcript: Transcript, store: KeyValueStore = getStore()): Promise<void> {
  await store.set(`transcript:${transcript.id}`, JSON.stringify(transcript), TRANSCRIPT_TTL_SECONDS);
}

export async function loadTranscript(id: string, store: KeyValueStore = getStore()): Promise<Transcript | null> {
  if (!/^tr_[A-Za-z0-9_-]{8,}$/.test(id)) return null;
  const raw = await store.get(`transcript:${id}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Transcript;
    return parsed && Array.isArray(parsed.segments) && typeof parsed.text === "string" ? parsed : null;
  } catch {
    return null;
  }
}
