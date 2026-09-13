import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { createServiceOffer } from "@/lib/service-business/offer";
import { isTrade } from "@/lib/service-business/profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const store = getStore();
  const hits = await store.incr(`offer:ip:${ip}`, 60 * 60);
  if (hits > 15) return NextResponse.json({ error: "Too many requests from this network. Try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await createServiceOffer(
    {
      trade: typeof body?.trade === "string" && isTrade(body.trade) ? body.trade : undefined,
      city: typeof body?.city === "string" ? body.city : undefined,
      name: typeof body?.name === "string" ? body.name : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
      email: typeof body?.email === "string" ? body.email : undefined,
      address: typeof body?.address === "string" ? body.address : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      urgency: typeof body?.urgency === "string" ? (body.urgency as "flexible" | "soon" | "asap") : undefined,
      sourcePath: typeof body?.sourcePath === "string" ? body.sourcePath : undefined,
    },
    store,
  );
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({
    ok: true,
    id: result.id,
    token: result.homeownerToken,
    pingedCount: result.pingedOrgIds.length,
    expiresAt: result.expiresAt,
  });
}
