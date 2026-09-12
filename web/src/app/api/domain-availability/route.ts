import { NextRequest, NextResponse } from "next/server";
import { checkDomains, DEFAULT_TLDS, labelFromName, normaliseDomain, priceLine, registrarLinks } from "@/lib/web/domains";

export const maxDuration = 30;

/**
 * Domain availability over RDAP (registry data, the successor to WHOIS) with a
 * DNS fallback for TLDs that don't publish it. Accepts a brand name (combined
 * with the common TLDs) or a list of full domains.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { name?: unknown; domains?: unknown; tlds?: unknown } | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const domains = Array.isArray(body?.domains) ? body.domains.filter((d): d is string => typeof d === "string") : [];
  const tlds = Array.isArray(body?.tlds) ? body.tlds.filter((t): t is string => typeof t === "string" && /^[a-z.]{2,20}$/i.test(t)).map((t) => t.toLowerCase().replace(/^\./, "")) : DEFAULT_TLDS;

  const candidates = [...domains];
  let label = "";
  if (name) {
    const direct = normaliseDomain(name);
    if (direct) candidates.push(direct);
    else {
      label = labelFromName(name);
      if (!label) return NextResponse.json({ error: "That name has no usable characters for a domain." }, { status: 400 });
      for (const tld of tlds) candidates.push(`${label}.${tld}`);
    }
  }
  if (!candidates.length) return NextResponse.json({ error: "Provide a name or a list of domains to check." }, { status: 400 });

  const results = await checkDomains(candidates.slice(0, 40));
  return NextResponse.json({
    query: name || null,
    slug: label || null,
    results: results.map((r) => ({ ...r, price: priceLine(r.tld), registrars: r.status === "available" ? registrarLinks(r.domain).slice(0, 2) : [] })),
  });
}
