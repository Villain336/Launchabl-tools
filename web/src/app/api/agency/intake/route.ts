import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { submitAgencyIntake } from "@/lib/service-business/agency-intake";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const store = getStore();
  const hits = await store.incr(`agency:intake:ip:${ip}`, 60 * 60);
  if (hits > 8) return NextResponse.json({ error: "Too many agency requests from this network. Try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const result = await submitAgencyIntake(body ?? {}, store);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, id: result.id });
}
