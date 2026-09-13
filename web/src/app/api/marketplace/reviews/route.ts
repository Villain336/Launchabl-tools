import { NextResponse, type NextRequest } from "next/server";
import { submitJobReview } from "@/lib/service-business/review";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await submitJobReview({
    token: typeof body?.token === "string" ? body.token : undefined,
    listingSlug: typeof body?.listingSlug === "string" ? body.listingSlug : undefined,
    rating: typeof body?.rating === "number" ? body.rating : Number(body?.rating),
    body: typeof body?.body === "string" ? body.body : undefined,
    authorName: typeof body?.authorName === "string" ? body.authorName : undefined,
  });
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ review: result });
}
