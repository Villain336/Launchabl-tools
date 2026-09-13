"use client";

import { useState } from "react";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { CREDIT_PACK_IDS, CREDIT_PACKS, TOOLS_PRO_PRICE_USD, type BillingInterval, type CreditPackId } from "@/lib/billing/plan-display";

/**
 * Shown in a tool chat when the entitlement check returns `needs_pro`
 * (see lib/ai/entitlement.ts). Starts Stripe Checkout for the chosen
 * interval; Stripe redirects back to /tools?upgraded=1 on success. Also
 * offers the credit-pack alternative (one-time payment, /pricing has the
 * full pitch) for people who hit the wall but don't run pro tools often
 * enough to want a subscription.
 */
export function ProUpgradeCard() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [loading, setLoading] = useState(false);
  const [creditPending, setCreditPending] = useState<CreditPackId | null>(null);
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
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Couldn't start checkout.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setLoading(false);
    }
  };

  const buyCredits = async (pack: CreditPackId) => {
    setCreditPending(pack);
    setError(null);
    try {
      const res = await fetch("/api/billing/credits/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Couldn't start checkout.");
      // External Stripe-hosted URL — a full navigation, not client-side routing.
      // eslint-disable-next-line react-hooks/immutability -- global window navigation, not component state
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout.");
      setCreditPending(null);
    }
  };

  return (
    <div
      className="mx-auto w-full max-w-sm rounded-[12px] border border-line bg-field/60 p-4 sm:p-5"
      style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
      data-pro-upgrade-card
    >
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-ink">This tool is part of Tools Pro</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">
            Image generation, transcription and clip-finding cost real money to run. Tools Pro unlocks unlimited use of all three, no daily limits.
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-1.5 rounded-[8px] border border-line bg-surface p-1">
        {(["month", "year"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBillingInterval(option)}
            className={`flex flex-col items-center rounded-[6px] px-2 py-1.5 text-[12.5px] transition-colors duration-100 ${
              billingInterval === option ? "bg-ink text-surface" : "text-ink-2 hover:bg-hover"
            }`}
          >
            <span className="font-semibold">${TOOLS_PRO_PRICE_USD[option]}</span>
            <span className={billingInterval === option ? "text-surface/70" : "text-ink-3"}>
              {option === "month" ? "per month" : "per year · save 2 months"}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void checkout()}
        disabled={loading || creditPending !== null}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] bg-ink text-[13px] font-medium text-surface transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Starting checkout…" : `Upgrade to Tools Pro`}
      </button>
      {error && <p className="mt-2 text-center text-[12px] text-red">{error}</p>}
      <p className="mt-2 text-center text-[11.5px] text-ink-3">Cancel anytime from your account.</p>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-ink-3">
        <span className="h-px flex-1 bg-line" />
        <span>or use it occasionally</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="mt-2 flex gap-1.5">
        {CREDIT_PACK_IDS.map((pack) => (
          <button
            key={pack}
            type="button"
            onClick={() => void buyCredits(pack)}
            disabled={loading || creditPending !== null}
            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] border border-line bg-surface text-[12px] font-medium text-ink transition-colors duration-100 hover:bg-hover disabled:opacity-60"
          >
            {creditPending === pack ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {`${CREDIT_PACKS[pack].credits} for $${CREDIT_PACKS[pack].priceUsd}`}
          </button>
        ))}
      </div>
    </div>
  );
}
