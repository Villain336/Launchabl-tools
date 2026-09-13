"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREDIT_PACK_IDS, CREDIT_PACKS, perCreditUsd, type CreditPackId } from "@/lib/billing/plan-display";

/**
 * One-time-payment alternative to the Tools Pro subscription, for people
 * who hit the pro-tool trial wall but run those tools rarely enough that a
 * recurring plan isn't worth it. Starts Stripe Checkout in "payment" mode;
 * the webhook grants the pack's credits on completion (lib/billing/webhook-handler.ts).
 */
export function CreditPacksCard({ onSignInRequired, className = "" }: { onSignInRequired?: () => void; className?: string }) {
  const [pending, setPending] = useState<CreditPackId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (pack: CreditPackId) => {
    setPending(pack);
    setError(null);
    try {
      const res = await fetch("/api/billing/credits/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      if (res.status === 401) {
        onSignInRequired?.();
        setPending(null);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Couldn't start checkout.");
      // External Stripe-hosted URL — a full navigation, not client-side routing.
      // eslint-disable-next-line react-hooks/immutability -- global window navigation, not component state
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setPending(null);
    }
  };

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="gap-3 pb-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">Credit packs</CardTitle>
          <Badge variant="outline" className="gap-1">
            <Zap className="size-3" aria-hidden="true" />
            No subscription
          </Badge>
        </div>
        <CardDescription>Use Tools Pro tools occasionally? Pay once for a batch of credits instead — one credit covers one run, no expiry.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4">
        {CREDIT_PACK_IDS.map((pack) => {
          const { credits, priceUsd, label } = CREDIT_PACKS[pack];
          return (
            <div key={pack} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">${priceUsd} · {perCreditUsd(pack).toFixed(2)}/credit</p>
              </div>
              <Button size="sm" variant={pack === "growth" ? "default" : "outline"} disabled={pending !== null} onClick={() => void buy(pack)}>
                {pending === pack ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" /> : null}
                {pending === pack ? "Starting…" : `Buy ${credits}`}
              </Button>
            </div>
          );
        })}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
