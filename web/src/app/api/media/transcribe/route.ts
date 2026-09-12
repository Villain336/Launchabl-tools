import { NextResponse, type NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { NoModelAvailableError } from "@/lib/ai/errors";
import { checkEntitlement, NEEDS_PRO_MESSAGE } from "@/lib/ai/entitlement";
import { GATEWAY_UNCONFIGURED, hasGatewayAuth } from "@/lib/ai/models";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { getStore } from "@/lib/ai/store";
import { checkDailySpend, SPEND_CAP_MESSAGE } from "@/lib/ai/usage";
import { readSession } from "@/lib/auth/session";
import { blobEnabled, isMediaFile, MEDIA_LIMITS, saveTranscript, transcribeMedia } from "@/lib/media/transcribe";
import { describeTranscript, wordCount } from "@/lib/media/transcript";

/**
 * Turn an uploaded recording into a stored transcript and return its id.
 *
 * Accepts either multipart form data (`file`, ≤ 4.5 MB — the function body
 * limit) or JSON `{ url }` pointing at a Vercel Blob the browser uploaded
 * directly (≤ 25 MB, Whisper's cap). The blob is deleted after it's read.
 *
 * Accounts get MEDIA_LIMITS.minutesPerDay of audio a day; anonymous visitors
 * a small taste, so one free run can still show the tool working. The chat
 * turn that follows is gated as usual.
 */

export const runtime = "nodejs";
export const maxDuration = 120;

const ANON_MINUTES_PER_DAY = 10;
const DAY_SECONDS = 24 * 60 * 60;

/**
 * Pseudo-slug for entitlement's free-trial counter, deliberately separate
 * from the "transcriber"/"clip-finder" chat-tool slugs: the real ASR cost
 * happens here, once, no matter which chat tool ends up reading the
 * transcript (including the unified "agent"), so it needs its own gate
 * rather than trusting whatever slug the client sent.
 */
const MEDIA_ENTITLEMENT_SLUG = "media-transcribe";

declare global {
  var __launchablTranscribeLimiter: RateLimiter | undefined;
}

const limiter = () =>
  (globalThis.__launchablTranscribeLimiter ??= createRateLimiter([{ name: "media-transcribe", limit: MEDIA_LIMITS.burst, windowSeconds: 10 * 60 }], getStore()));

function blobHost(url: URL): boolean {
  return url.protocol === "https:" && /\.public\.blob\.vercel-storage\.com$/.test(url.hostname);
}

async function readBlob(url: string, signal: AbortSignal): Promise<{ bytes: Uint8Array; mediaType: string } | { error: string; status: number }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { error: "Bad upload URL.", status: 400 };
  }
  if (!blobHost(parsed)) return { error: "Uploads must come from this site's storage.", status: 400 };
  const res = await fetch(parsed, { signal });
  if (!res.ok) return { error: `Upload could not be read (${res.status}).`, status: 502 };
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MEDIA_LIMITS.blobBytes) return { error: "That file is over 25 MB. Export a smaller audio file (64 kbps mono is plenty for speech).", status: 413 };
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MEDIA_LIMITS.blobBytes) return { error: "That file is over 25 MB.", status: 413 };
  return { bytes: new Uint8Array(buffer), mediaType: res.headers.get("content-type")?.split(";")[0] || "audio/mpeg" };
}

export async function POST(request: NextRequest) {
  if (!hasGatewayAuth()) return NextResponse.json({ error: GATEWAY_UNCONFIGURED }, { status: 503 });
  const session = await readSession(request.cookies);
  const ip = clientKey(request.headers);
  const who = session?.uid ?? `anon:${ip}`;
  const limit = await limiter().check(who);
  if (!limit.ok) return NextResponse.json({ error: "Too many uploads in a short time. Try again in a few minutes." }, { status: 429 });

  const spend = await checkDailySpend();
  if (!spend.ok) return NextResponse.json({ error: SPEND_CAP_MESSAGE, cause: "spend_cap" }, { status: 503 });

  const store = getStore();
  const day = new Date().toISOString().slice(0, 10);
  const quotaKey = `media:${who}:${day}`;
  const cap = session ? MEDIA_LIMITS.minutesPerDay : ANON_MINUTES_PER_DAY;
  const usedSec = (await store.hgetall(quotaKey)).seconds ?? 0;
  if (usedSec >= cap * 60) {
    return NextResponse.json(
      {
        error: session
          ? `You've transcribed ${cap} minutes today — the daily limit on the free plan. It resets at midnight UTC.`
          : `Free transcription without an account is limited to ${cap} minutes a day. Create a free account for ${MEDIA_LIMITS.minutesPerDay} minutes a day.`,
        cause: session ? "quota" : "sign_in_required",
      },
      { status: session ? 429 : 401 },
    );
  }

  // Tools Pro gate for the ASR call itself — anonymous visitors keep their
  // small daily taste (capped tightly above) without needing an account;
  // signed-in accounts get a few free trials, then need a subscription (or
  // ride along in dark-launch until PAYWALL_ENFORCED_TOOLS says otherwise).
  if (session) {
    const entitlement = await checkEntitlement(MEDIA_ENTITLEMENT_SLUG, session, store, { forcePro: true });
    if (!entitlement.allowed) {
      return NextResponse.json({ error: NEEDS_PRO_MESSAGE, cause: "needs_pro" }, { status: 402 });
    }
  }

  let bytes: Uint8Array;
  let mediaType: string;
  let name: string;
  let slug = "transcriber";
  let blobUrl: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Attach an audio or video file." }, { status: 400 });
    if (file.size > MEDIA_LIMITS.directBytes) {
      return NextResponse.json(
        { error: blobEnabled() ? "File too large for a direct upload." : "Files over 4.5 MB need large-upload storage, which isn't configured on this deployment. Export a shorter or lower-bitrate audio file." },
        { status: 413 },
      );
    }
    name = file.name || "recording";
    mediaType = file.type || "audio/mpeg";
    if (!isMediaFile(name, mediaType)) return NextResponse.json({ error: "Only audio and video files (MP3, M4A, WAV, MP4, WebM, MOV…) can be transcribed." }, { status: 415 });
    bytes = new Uint8Array(await file.arrayBuffer());
    slug = typeof form?.get("slug") === "string" ? String(form.get("slug")) : slug;
  } else {
    const body = (await request.json().catch(() => null)) as { url?: unknown; name?: unknown; slug?: unknown } | null;
    if (typeof body?.url !== "string") return NextResponse.json({ error: "Bad request." }, { status: 400 });
    if (!blobEnabled()) return NextResponse.json({ error: "Large uploads are not configured on this deployment." }, { status: 503 });
    const read = await readBlob(body.url, request.signal);
    if ("error" in read) return NextResponse.json({ error: read.error }, { status: read.status });
    bytes = read.bytes;
    mediaType = read.mediaType;
    name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : "recording";
    if (!isMediaFile(name, mediaType)) return NextResponse.json({ error: "Only audio and video files can be transcribed." }, { status: 415 });
    slug = typeof body.slug === "string" ? body.slug : slug;
    blobUrl = body.url;
  }
  if (bytes.byteLength < 1_000) return NextResponse.json({ error: "That file looks empty." }, { status: 400 });

  try {
    const { skipped, ...transcript } = await transcribeMedia({ bytes, mediaType, name, slug: /^[a-z0-9-]{1,40}$/.test(slug) ? slug : "transcriber", abortSignal: request.signal });
    if (skipped.length > 0) console.warn(`[media/transcribe] fell back to ${transcript.model} after`, skipped.map((s) => `${s.model} (${s.failure.cause})`).join(", "));
    await saveTranscript(transcript, store);
    await store.hincrby(quotaKey, { seconds: Math.max(1, transcript.durationSec) }, 2 * DAY_SECONDS);
    return NextResponse.json({
      transcript: {
        id: transcript.id,
        name: transcript.name,
        durationSec: transcript.durationSec,
        words: wordCount(transcript.text),
        language: transcript.language,
        timed: transcript.timed,
        model: transcript.model,
        summary: describeTranscript(transcript),
      },
      minutesLeft: Math.max(0, Math.round((cap * 60 - usedSec - transcript.durationSec) / 60)),
    });
  } catch (error) {
    if (request.signal.aborted) return new NextResponse(null, { status: 499 });
    console.error("[media/transcribe]", error instanceof NoModelAvailableError ? error.message : error);
    return NextResponse.json({ error: "Transcription failed. Try a different export (MP3 or M4A) or a shorter file." }, { status: 502 });
  } finally {
    if (blobUrl) void del(blobUrl).catch(() => undefined);
  }
}
