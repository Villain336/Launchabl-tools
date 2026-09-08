import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";

// Demo/architecture-reference implementation.
//
// Production notes: this route should call a registrar or domain-search
// reseller API (for example a domain-availability endpoint from a registrar
// partner) to get real-time, purchasable availability and pricing. Swap the
// `checkDomain` implementation below for that API call — the request/response
// shape here is designed to stay stable when you do.
//
// This demo uses a DNS lookup as a rough, free heuristic: if a domain
// resolves, it's almost certainly taken; if it doesn't resolve, it *might*
// be available, but DNS silence is not proof of availability (a registered
// domain can have no DNS records). Never present this route's output as a
// purchase-ready guarantee.

const TLDS = ["com", "co", "io", "net", "app", "ai"];

async function checkDomain(domain: string): Promise<"taken" | "likely-available"> {
  try {
    await dns.resolve(domain);
    return "taken";
  } catch {
    return "likely-available";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Provide a name to check." }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 63);

  if (!slug) {
    return NextResponse.json({ error: "That name has no usable characters for a domain." }, { status: 400 });
  }

  const results = await Promise.all(
    TLDS.map(async (tld) => ({
      domain: `${slug}.${tld}`,
      tld,
      status: await checkDomain(`${slug}.${tld}`),
    })),
  );

  return NextResponse.json({ query: name, slug, results, demo: true });
}
