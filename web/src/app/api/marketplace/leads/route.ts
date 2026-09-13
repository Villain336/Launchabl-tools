import { NextResponse, type NextRequest } from "next/server";
import { getListing } from "@/lib/marketplace/listing";
import { submitLead } from "@/lib/service-business/lead";
import { getServiceBusinessProfile } from "@/lib/service-business/profile";
import { getStore } from "@/lib/ai/store";
import { isTrade } from "@/lib/service-business/profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const store = getStore();
  const hits = await store.incr(`lead:ip:${ip}`, 60 * 60);
  if (hits > 20) return NextResponse.json({ error: "Too many quote requests from this network. Try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const listingSlug = typeof body?.listingSlug === "string" ? body.listingSlug : "";
  const listing = await getListing(listingSlug, store);
  if (!listing || !listing.storefront.published) return NextResponse.json({ error: "That listing isn't taking requests right now." }, { status: 404 });

  const trade = typeof body?.trade === "string" && isTrade(body.trade) ? body.trade : listing.trades[0];
  const city = typeof body?.city === "string" ? body.city : listing.cities[0];
  const profile = listing.orgId ? await getServiceBusinessProfile(listing.orgId, store) : null;

  const result = await submitLead(
    {
      orgId: listing.orgId,
      leadTier: profile?.leadTier,
      listingSlug: listing.slug,
      trade,
      city,
      name: typeof body?.name === "string" ? body.name : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
      email: typeof body?.email === "string" ? body.email : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      urgency: typeof body?.urgency === "string" ? (body.urgency as "flexible" | "soon" | "asap") : undefined,
      sourcePath: typeof body?.sourcePath === "string" ? body.sourcePath : undefined,
    },
    store,
  );
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true, held: result.held, exclusive: result.exclusive });
}
