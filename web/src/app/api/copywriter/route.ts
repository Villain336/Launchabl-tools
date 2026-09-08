import { NextRequest, NextResponse } from "next/server";

// Demo/architecture-reference implementation.
//
// Production notes: replace `buildCopy` with a server-side call to an LLM
// provider (never expose the API key to the client — this route is exactly
// the right boundary for that call). Keep the request/response shape stable
// so the UI component doesn't need to change when you swap providers.

type Format = "ad-headline" | "landing-hero" | "product-blurb" | "email-subject";

function buildCopy(format: Format, brand: string, product: string, tone: string): string[] {
  const b = brand || "Your Brand";
  const p = product || "your product";

  const banks: Record<Format, (b: string, p: string, t: string) => string[]> = {
    "ad-headline": (b, p, t) => [
      `${p}, finally done right.`,
      `${b}: ${p} that actually works.`,
      `Stop settling for less than ${p}.`,
      `The ${t} way to get ${p}.`,
      `${p} — see the difference in a week.`,
    ],
    "landing-hero": (b, p, t) => [
      `${b} gives you ${p} without the usual headaches — built to be ${t} from day one.`,
      `Everything you need for ${p}, in one ${t} platform: ${b}.`,
      `${p} shouldn't be this hard. ${b} makes it ${t}.`,
    ],
    "product-blurb": (b, p, t) => [
      `${p} from ${b} is designed to feel ${t} — no learning curve, no fluff, just results.`,
      `A ${t} take on ${p}, built by ${b} for people who don't have time to waste.`,
    ],
    "email-subject": (b, p, t) => [
      `${b}: your ${p} is ready`,
      `A ${t} update on ${p}`,
      `Quick question about ${p}`,
      `${p}, reimagined by ${b}`,
    ],
  };

  return (banks[format] ?? banks["ad-headline"])(b, p, tone || "simple");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const format = body?.format as Format | undefined;
  const brand = typeof body?.brand === "string" ? body.brand : "";
  const product = typeof body?.product === "string" ? body.product : "";
  const tone = typeof body?.tone === "string" ? body.tone : "simple";

  if (!format) {
    return NextResponse.json({ error: "Provide a format." }, { status: 400 });
  }

  const variations = buildCopy(format, brand, product, tone);
  return NextResponse.json({ variations, demo: true });
}
