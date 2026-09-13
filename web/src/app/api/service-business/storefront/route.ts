import { NextResponse, type NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { getOrgForUser } from "@/lib/orgs/org";
import { defaultStorefront, getOrgStorefront, saveOrgStorefront, type StorefrontInput } from "@/lib/service-business/storefront";
import { getFoundingListing } from "@/lib/marketplace/founding";
import { getListing, updateFoundingListing } from "@/lib/marketplace/listing";

export const runtime = "nodejs";

const unauthorised = () => NextResponse.json({ error: "Sign in first.", cause: "sign_in_required" }, { status: 401 });

export async function GET(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const foundingSlug = request.nextUrl.searchParams.get("founding");
  if (foundingSlug && getFoundingListing(foundingSlug)) {
    const listing = await getListing(foundingSlug);
    return NextResponse.json({ kind: "founding", listing }, { headers: { "cache-control": "private, no-store" } });
  }
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ kind: "org", org: null, storefront: null }, { headers: { "cache-control": "private, no-store" } });
  const storefront = (await getOrgStorefront(org.id)) ?? defaultStorefront({ published: false });
  return NextResponse.json({ kind: "org", org, storefront }, { headers: { "cache-control": "private, no-store" } });
}

function readStorefrontInput(body: unknown): StorefrontInput & { name?: string; phone?: string; address?: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  return {
    theme: typeof b.theme === "string" ? (b.theme as StorefrontInput["theme"]) : undefined,
    accent: typeof b.accent === "string" ? b.accent : undefined,
    logoUrl: b.logoUrl === null || typeof b.logoUrl === "string" ? (b.logoUrl as string | null) : undefined,
    coverUrl: b.coverUrl === null || typeof b.coverUrl === "string" ? (b.coverUrl as string | null) : undefined,
    tagline: typeof b.tagline === "string" ? b.tagline : undefined,
    about: typeof b.about === "string" ? b.about : undefined,
    hours: typeof b.hours === "string" ? b.hours : undefined,
    yearsInBusiness: typeof b.yearsInBusiness === "string" ? b.yearsInBusiness : undefined,
    ctaLabel: typeof b.ctaLabel === "string" ? b.ctaLabel : undefined,
    services: Array.isArray(b.services) ? (b.services as StorefrontInput["services"]) : undefined,
    gallery: Array.isArray(b.gallery) ? (b.gallery as StorefrontInput["gallery"]) : undefined,
    showLeadForm: typeof b.showLeadForm === "boolean" ? b.showLeadForm : undefined,
    showHours: typeof b.showHours === "boolean" ? b.showHours : undefined,
    showGallery: typeof b.showGallery === "boolean" ? b.showGallery : undefined,
    showServices: typeof b.showServices === "boolean" ? b.showServices : undefined,
    published: typeof b.published === "boolean" ? b.published : undefined,
    name: typeof b.name === "string" ? b.name : undefined,
    phone: typeof b.phone === "string" ? b.phone : undefined,
    address: typeof b.address === "string" ? b.address : undefined,
  };
}

export async function PUT(request: NextRequest) {
  const session = await readSession(request.cookies);
  if (!session) return unauthorised();
  const input = readStorefrontInput(await request.json().catch(() => null));
  const foundingSlug = request.nextUrl.searchParams.get("founding");
  if (foundingSlug) {
    const result = await updateFoundingListing(foundingSlug, session.uid, input);
    if ("error" in result) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ kind: "founding", listing: result });
  }
  const org = await getOrgForUser(session.uid);
  if (!org) return NextResponse.json({ error: "Create a team first — see /team." }, { status: 409 });
  const result = await saveOrgStorefront(org.id, session.uid, input);
  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ kind: "org", storefront: result });
}
