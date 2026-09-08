import { NextRequest, NextResponse } from "next/server";
import { checkBrokenLinks } from "@/lib/link-checker";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "Provide a url to check." }, { status: 400 });
  }

  try {
    const report = await checkBrokenLinks(url);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not check this page." },
      { status: 502 },
    );
  }
}
