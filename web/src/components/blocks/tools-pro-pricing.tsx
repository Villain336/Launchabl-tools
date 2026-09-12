"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TOOLS_PRO_PRICE_USD, type BillingInterval } from "@/lib/billing/plan-display";

const included = [
  "Unlimited AI image generation — heroes, ads, icons, illustrations",
  "Unlimited transcription with chapters, quotes and publish kits",
  "Unlimited short-form clip finding with render-ready cut lists",
  "Every other tool stays free, no change",
];

/**
 * A third card alongside the free audit and the $1,200 agency plan: the
 * subscription that pays for the AI Gateway and Whisper costs the
 * media-tier tools incur per call. See docs/STRATEGY.md §13.
 */
export default function ToolsProPricing() {
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interval: billingInterval }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string; cause?: string };
      if (res.status === 401) {
        router.push(`/sign-in?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (!res.ok || !body.url) throw new Error(body.error ?? "Couldn't start checkout.");
      // External Stripe-hosted URL — a full navigation, not client-side routing.
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setLoading(false);
    }
  };

  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-4">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="size-3" aria-hidden="true" />
            For heavier tool usage
          </Badge>
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Tools Pro</h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            Every tool is free to try. The three that render images, transcribe audio and cut video clips cost real
            compute per call — Tools Pro covers that so we can keep them fast and unlimited for the people who use them a lot.
          </p>
        </div>

        <Card className="w-full max-w-md ring-1 ring-primary/30">
          <CardHeader className="gap-4 pb-0">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base font-semibold">Tools Pro subscription</CardTitle>
              <CardDescription>AI Image Generator, Transcriber and Clip Finder — unlimited.</CardDescription>
            </div>

            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-1">
              {(["month", "year"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setBillingInterval(option)}
                  className={`flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                    billingInterval === option ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {option === "month" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold tracking-tight text-foreground">${TOOLS_PRO_PRICE_USD[billingInterval]}</span>
              <span className="text-sm text-muted-foreground">/{billingInterval === "month" ? "mo" : "yr"}</span>
            </div>
            {billingInterval === "year" && <p className="text-sm text-muted-foreground">Two months free versus paying monthly.</p>}
          </CardHeader>

          <CardContent className="flex flex-col gap-5 pt-4">
            <Separator />
            <ul className="flex flex-col gap-3">
              {included.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>

          <CardFooter className="flex-col gap-3 border-t bg-muted/30">
            <Button size="lg" className="w-full" onClick={() => void checkout()} disabled={loading}>
              {loading ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : <Sparkles data-icon="inline-start" aria-hidden="true" />}
              {loading ? "Starting checkout…" : "Upgrade to Tools Pro"}
            </Button>
            {error && <p className="text-center text-xs text-red-600">{error}</p>}
            <p className="text-center text-xs text-muted-foreground">Cancel anytime. Every other tool stays free either way.</p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
