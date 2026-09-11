import { NextRequest, NextResponse } from "next/server";
import { Output } from "ai";
import { z } from "zod";
import { hasGatewayKey, modelChain } from "@/lib/ai/models";
import { generateWithFallback } from "@/lib/ai/stream";
import { chatRateLimiter, clientKey } from "@/lib/ai/rate-limit";

export const maxDuration = 30;

type Format = "ad-headline" | "landing-hero" | "product-blurb" | "email-subject";

const formatBrief: Record<Format, { label: string; count: number; rule: string }> = {
  "ad-headline": { label: "paid ad headline", count: 5, rule: "under 10 words each, no punctuation gimmicks" },
  "landing-hero": { label: "landing page hero headline", count: 3, rule: "one clear promise per line, 6–14 words" },
  "product-blurb": { label: "product blurb", count: 2, rule: "one or two sentences, 25–45 words, concrete benefit first" },
  "email-subject": { label: "email subject line", count: 4, rule: "under 50 characters, no spam triggers, no ALL CAPS" },
};

/** Deterministic fallback so the tool still returns something when no model is reachable. */
function templateCopy(format: Format, brand: string, product: string, tone: string): string[] {
  const b = brand || "Your Brand";
  const p = product || "your product";
  const t = tone || "simple";
  const banks: Record<Format, string[]> = {
    "ad-headline": [
      `${p}, finally done right.`,
      `${b}: ${p} that actually works.`,
      `Stop settling for less than ${p}.`,
      `The ${t} way to get ${p}.`,
      `${p} — see the difference in a week.`,
    ],
    "landing-hero": [
      `${b} gives you ${p} without the usual headaches — built to be ${t} from day one.`,
      `Everything you need for ${p}, in one ${t} platform: ${b}.`,
      `${p} shouldn't be this hard. ${b} makes it ${t}.`,
    ],
    "product-blurb": [
      `${p} from ${b} is designed to feel ${t} — no learning curve, no fluff, just results.`,
      `A ${t} take on ${p}, built by ${b} for people who don't have time to waste.`,
    ],
    "email-subject": [`${b}: your ${p} is ready`, `A ${t} update on ${p}`, `Quick question about ${p}`, `${p}, reimagined by ${b}`],
  };
  return banks[format];
}

const outputSchema = z.object({
  variations: z.array(z.string().min(1)).min(2).max(6),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const format = body?.format as Format | undefined;
  const brand = typeof body?.brand === "string" ? body.brand.trim().slice(0, 120) : "";
  const product = typeof body?.product === "string" ? body.product.trim().slice(0, 1_500) : "";
  const tone = typeof body?.tone === "string" ? body.tone.trim().slice(0, 60) : "simple";

  if (!format || !(format in formatBrief)) {
    return NextResponse.json({ error: "Provide a format." }, { status: 400 });
  }

  const fallback = () => NextResponse.json({ variations: templateCopy(format, brand, product, tone), demo: true });

  if (!hasGatewayKey()) return fallback();

  const limit = chatRateLimiter().check(`copywriter:${clientKey(request.headers)}`);
  if (!limit.ok) return fallback();

  const brief = formatBrief[format];
  try {
    const { model, result } = await generateWithFallback(modelChain("writer"), {
      instructions: `You write conversion copy for small businesses. Return exactly ${brief.count} ${brief.label} options. Rules: ${brief.rule}. Each option must take a different angle (outcome, pain relief, specificity, social proof, curiosity). Plain, concrete language; no hype words, no invented numbers or claims. Match the requested tone.`,
      messages: [
        {
          role: "user",
          content: `Brand: ${brand || "(not given)"}\nProduct / offer: ${product || "(not given)"}\nTone: ${tone}`,
        },
      ],
      output: Output.object({ schema: outputSchema }),
      abortSignal: request.signal,
      providerOptions: { gateway: { tags: ["launchabl", "tool:copywriter"] } },
    });
    const variations = result.output?.variations ?? [];
    if (variations.length === 0) return fallback();
    return NextResponse.json({ variations, model });
  } catch (error) {
    console.error("[copywriter] falling back to templates", error);
    return fallback();
  }
}
