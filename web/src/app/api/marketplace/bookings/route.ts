import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/ai/store";
import { getListing } from "@/lib/marketplace/listing";
import { bookPublicSlot, listOpenSlotsForListing } from "@/lib/service-business/booking";
import { isTrade } from "@/lib/service-business/profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const store = getStore();
  const listing = await getListing(slug, store);
  if (!listing || !listing.storefront.published) return NextResponse.json({ error: "That listing isn't taking bookings right now." }, { status: 404 });
  const slots = await listOpenSlotsForListing(listing, store);
  return NextResponse.json({ slots: slots.slice(0, 12), startingPrice: listing.startingPrice, bookingEnabled: listing.storefront.bookingEnabled !== false });
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const store = getStore();
  const hits = await store.incr(`book:ip:${ip}`, 60 * 60);
  if (hits > 20) return NextResponse.json({ error: "Too many bookings from this network. Try again later." }, { status: 429 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const listingSlug = typeof body?.listingSlug === "string" ? body.listingSlug : "";
  const listing = await getListing(listingSlug, store);
  if (!listing || !listing.storefront.published) return NextResponse.json({ error: "That listing isn't taking bookings right now." }, { status: 404 });

  const result = await bookPublicSlot(
    listing,
    {
      trade: typeof body?.trade === "string" && isTrade(body.trade) ? body.trade : listing.trades[0],
      city: typeof body?.city === "string" ? body.city : listing.cities[0],
      name: typeof body?.name === "string" ? body.name : undefined,
      phone: typeof body?.phone === "string" ? body.phone : undefined,
      email: typeof body?.email === "string" ? body.email : undefined,
      address: typeof body?.address === "string" ? body.address : undefined,
      serviceName: typeof body?.serviceName === "string" ? body.serviceName : undefined,
      scheduledFor: typeof body?.scheduledFor === "string" ? body.scheduledFor : undefined,
      sourcePath: typeof body?.sourcePath === "string" ? body.sourcePath : undefined,
    },
    store,
  );
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({
    ok: true,
    exclusive: result.lead.exclusive,
    scheduledFor: result.lead.scheduledFor,
    jobId: result.jobId,
    onTheBook: Boolean(result.jobId),
  });
}
