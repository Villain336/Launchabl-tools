import { NextResponse, type NextRequest } from "next/server";
import { listDirectory, listDirectoryFiltered } from "@/lib/marketplace/listing";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") ?? undefined;
  const trade = request.nextUrl.searchParams.get("trade") ?? undefined;
  const listings = city || trade ? await listDirectoryFiltered({ city, trade }) : await listDirectory();
  return NextResponse.json({ listings }, { headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
