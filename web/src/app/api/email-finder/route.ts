import { NextRequest, NextResponse } from "next/server";
import { findEmailCandidates } from "@/lib/email-finder";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";

  if (!name || !domain) {
    return NextResponse.json({ error: "Provide both a full name and a company domain." }, { status: 400 });
  }

  const result = await findEmailCandidates(name, domain);
  if (result.candidates.length === 0) {
    return NextResponse.json({ error: "Could not parse a usable name from that input." }, { status: 400 });
  }

  return NextResponse.json(result);
}
