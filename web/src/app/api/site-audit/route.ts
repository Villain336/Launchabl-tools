import { NextRequest, NextResponse } from "next/server";
import { auditUrl } from "@/lib/site-audit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const urls: string[] = Array.isArray(body?.urls)
    ? body.urls.filter((u: unknown) => typeof u === "string" && u.trim())
    : typeof body?.url === "string" && body.url.trim()
      ? [body.url]
      : [];

  if (urls.length === 0) {
    return NextResponse.json({ error: "Provide a url or urls[] to audit." }, { status: 400 });
  }
  if (urls.length > 4) {
    return NextResponse.json({ error: "Audit at most 4 URLs at a time." }, { status: 400 });
  }

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const result = await auditUrl(url);
        return { url, ok: true as const, result };
      } catch (err) {
        return {
          url,
          ok: false as const,
          error: err instanceof Error ? err.message : "Could not fetch or parse this URL.",
        };
      }
    }),
  );

  return NextResponse.json({ results });
}
