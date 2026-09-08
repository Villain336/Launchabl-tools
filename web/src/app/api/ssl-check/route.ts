import { NextRequest, NextResponse } from "next/server";
import { checkSsl } from "@/lib/ssl-checker";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
  if (!domain) {
    return NextResponse.json({ error: "Provide a domain to check." }, { status: 400 });
  }

  const result = await checkSsl(domain);
  return NextResponse.json(result);
}
