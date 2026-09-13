import { NextResponse, type NextRequest } from "next/server";
import { getOfferByToken, toPublicOfferView } from "@/lib/service-business/offer";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const offer = await getOfferByToken(id, token);
  if (!offer) return NextResponse.json({ error: "That request was not found." }, { status: 404 });
  return NextResponse.json({ offer: await toPublicOfferView(offer) });
}
