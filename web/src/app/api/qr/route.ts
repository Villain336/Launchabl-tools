import type { NextRequest } from "next/server";
import { renderQrSvg } from "@/lib/qr/render";
import { decodeStyle } from "@/lib/qr/share";

/**
 * Hosted QR rendering: GET /api/qr?data=<url>&s=<encoded style>&size=512
 *
 * Returns SVG so the design can be dropped into any <img>, email signature,
 * Notion page, or CMS without the visitor's browser running our JS. Logos
 * are intentionally not supported here — the image would have to be hosted
 * somewhere, which is what dynamic codes will add later.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = (params.get("data") ?? "").trim();
  if (!data) return new Response("Missing ?data=", { status: 400 });
  if (data.length > 2_000) return new Response("Payload too long for a QR code.", { status: 413 });

  const size = Math.min(4096, Math.max(64, Number(params.get("size")) || 512));
  const style = decodeStyle(params.get("s"));

  try {
    const { svg } = renderQrSvg(data, { ...style, logo: undefined }, { size });
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("That text is too long or contains characters a QR code can't encode.", { status: 422 });
  }
}
