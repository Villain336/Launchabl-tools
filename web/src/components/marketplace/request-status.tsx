"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PublicOffer = {
  id: string;
  status: string;
  trade: string;
  city: string;
  pingedCount: number;
  claimedByName: string | null;
  expiresAt: string;
  estimate: { totalCents: number; notes: string; lineItems: { description: string; unitCents: number; quantity: number }[] } | null;
  paid: boolean;
};

type Snapshot = { offer: PublicOffer | null; error: string | null };

async function loadOffer(offerId: string, token: string): Promise<Snapshot> {
  const res = await fetch(
    `/api/marketplace/offers/${encodeURIComponent(offerId)}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const data = (await res.json()) as { offer?: PublicOffer; error?: string };
  if (!res.ok || !data.offer) {
    return { offer: null, error: data.error ?? "Could not load this request." };
  }
  return { offer: data.offer, error: null };
}

type Props = {
  offerId: string;
  token: string;
  paidJustNow?: boolean;
};

export function RequestStatus({ offerId, token, paidJustNow }: Props) {
  const [offer, setOffer] = useState<PublicOffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  function applySnapshot(snapshot: Snapshot) {
    setOffer(snapshot.offer);
    setError(snapshot.error);
  }

  useEffect(() => {
    void loadOffer(offerId, token).then(applySnapshot);
    const timer = window.setInterval(() => {
      void loadOffer(offerId, token).then(applySnapshot);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [offerId, token]);

  async function pay() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/offers/${encodeURIComponent(offerId)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start payment.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment.");
      setPaying(false);
    }
  }

  if (!offer && !error) {
    return <p className="text-sm text-muted-foreground">Loading your request…</p>;
  }
  if (!offer) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const total = offer.estimate ? offer.estimate.totalCents / 100 : null;

  return (
    <div className="space-y-4">
      {paidJustNow || offer.status === "paid" || offer.paid ? (
        <p className="rounded-lg border border-emerald-700/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          Paid. Your crew has the job.
        </p>
      ) : null}
      {offer.status === "open" ? (
        <p className="text-sm text-foreground">
          {offer.pingedCount > 0
            ? `Pinging ${offer.pingedCount} available crew${offer.pingedCount === 1 ? "" : "s"}. First one to claim it owns the job.`
            : "No live crew was on the board when you sent this. The request still sits here until it expires."}{" "}
          Expires {new Date(offer.expiresAt).toLocaleString()}.
        </p>
      ) : null}
      {offer.status === "claimed" || offer.status === "quoted" || offer.status === "paid" ? (
        <p className="text-sm text-foreground">{offer.claimedByName ?? "A crew"} claimed your job.</p>
      ) : null}
      {offer.status === "expired" ? (
        <p className="text-sm text-amber-200">
          Nobody claimed this in time. Send another request, or book a specific crew from the directory.
        </p>
      ) : null}
      {offer.estimate && total != null ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Quote</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {offer.estimate.lineItems.map((line) => (
              <li key={line.description} className="flex justify-between gap-4">
                <span>{line.description}</span>
                <span>${((line.unitCents * line.quantity) / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          {offer.estimate.notes ? <p className="mt-2 text-sm text-muted-foreground">{offer.estimate.notes}</p> : null}
          <p className="mt-3 text-lg font-semibold text-foreground">${total.toFixed(2)}</p>
          {offer.status === "quoted" ? (
            <Button type="button" onClick={() => void pay()} disabled={paying} className="mt-4">
              {paying ? "Opening checkout…" : "Pay this quote"}
            </Button>
          ) : null}
        </div>
      ) : offer.status === "claimed" ? (
        <p className="text-sm text-muted-foreground">Waiting on the quote from your crew.</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
