import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { clientKey, createRateLimiter, type RateLimiter } from "@/lib/ai/rate-limit";
import { getStore } from "@/lib/ai/store";
import { readSession } from "@/lib/auth/session";
import { blobEnabled, MEDIA_LIMITS } from "@/lib/media/transcribe";

/**
 * Upload negotiation for audio/video. Vercel functions accept 4.5 MB in the
 * request body, so bigger recordings go browser → Vercel Blob directly and
 * the transcribe route fetches them by URL. Without BLOB_READ_WRITE_TOKEN
 * (local dev, previews) the client falls back to direct multipart uploads
 * up to the body limit.
 */

export const runtime = "nodejs";

declare global {
  var __launchablUploadLimiter: RateLimiter | undefined;
}

const limiter = () =>
  (globalThis.__launchablUploadLimiter ??= createRateLimiter([{ name: "media-upload", limit: MEDIA_LIMITS.burst, windowSeconds: 10 * 60 }], getStore()));

export async function GET() {
  return NextResponse.json({
    mode: blobEnabled() ? "blob" : "direct",
    maxBytes: blobEnabled() ? MEDIA_LIMITS.blobBytes : MEDIA_LIMITS.directBytes,
  });
}

export async function POST(request: NextRequest) {
  if (!blobEnabled()) return NextResponse.json({ error: "Large uploads are not configured on this deployment." }, { status: 503 });
  const session = await readSession(request.cookies);
  const limit = await limiter().check(session?.uid ?? clientKey(request.headers));
  if (!limit.ok) return NextResponse.json({ error: "Too many uploads. Try again in a few minutes." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;
  if (!body) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["audio/*", "video/mp4", "video/webm", "video/quicktime"],
        maximumSizeInBytes: MEDIA_LIMITS.blobBytes,
        addRandomSuffix: true,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
      // Blobs are deleted by the transcribe route once read; nothing to do on completion.
      onUploadCompleted: async () => undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
