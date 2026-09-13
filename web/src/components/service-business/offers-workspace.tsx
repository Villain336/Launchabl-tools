"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ServiceOffer } from "@/lib/service-business/offer";

type Snapshot = { open: ServiceOffer[]; mine: ServiceOffer[] };

async function loadOffers(): Promise<Snapshot> {
  const res = await fetch("/api/service-business/offers", { credentials: "same-origin", cache: "no-store" });
  const data = (await res.json()) as { open?: ServiceOffer[]; mine?: ServiceOffer[] };
  return { open: data.open ?? [], mine: data.mine ?? [] };
}

function moneyFromDollars(value: string) {
  return Math.round(Number(value) * 100);
}

export function OffersWorkspace() {
  const session = useSession();
  const [open, setOpen] = useState<ServiceOffer[]>([]);
  const [mine, setMine] = useState<ServiceOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<Record<string, string>>({});

  function applySnapshot(snapshot: Snapshot) {
    setOpen(snapshot.open);
    setMine(snapshot.mine);
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadOffers().then(applySnapshot);
  }, [session.status, session.user]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/sign-in" className="underline">
          Sign in
        </a>{" "}
        to claim jobs pinged to your crew.
      </p>
    );
  }

  async function claim(id: string) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/service-business/offers/${encodeURIComponent(id)}/claim`, {
      method: "POST",
      credentials: "same-origin",
    });
    const data = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) setError(data.error ?? "Could not claim that job.");
    else await loadOffers().then(applySnapshot);
  }

  async function quote(id: string) {
    const amountCents = moneyFromDollars(quoteAmount[id] ?? "");
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/service-business/offers/${encodeURIComponent(id)}/quote`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountCents }),
    });
    const data = (await res.json()) as { error?: string };
    setBusyId(null);
    if (!res.ok) setError(data.error ?? "Could not send that quote.");
    else await loadOffers().then(applySnapshot);
  }

  const claimedByUs = mine.filter((offer) => offer.status === "claimed" || offer.status === "quoted" || offer.status === "paid");

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Open jobs in your trade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            First claim owns it. Alerts go to Telegram and email if you turned those on — we do not have carrier SMS yet.
          </p>
          {open.length === 0 ? <p className="text-sm text-muted-foreground">No open pings right now.</p> : null}
          {open.map((offer) => (
            <div key={offer.id} className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">
                {offer.trade} · {offer.city}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {offer.name}
                {offer.address ? ` · ${offer.address}` : ""} · expires {new Date(offer.expiresAt).toLocaleString()}
              </p>
              <Button type="button" className="mt-3" disabled={busyId === offer.id} onClick={() => void claim(offer.id)}>
                {busyId === offer.id ? "Claiming…" : "Claim this job"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Yours — quote and get paid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {claimedByUs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Jobs you claim show up here so you can send a dollar amount.</p>
          ) : null}
          {claimedByUs.map((offer) => (
            <div key={offer.id} className="rounded-lg border border-border p-3">
              <p className="font-medium text-foreground">
                {offer.trade} · {offer.city} · {offer.status}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
              {offer.status === "claimed" ? (
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="text-sm">
                    <span className="text-muted-foreground">Quote (USD)</span>
                    <Input
                      inputMode="decimal"
                      value={quoteAmount[offer.id] ?? ""}
                      onChange={(e) => setQuoteAmount((current) => ({ ...current, [offer.id]: e.target.value }))}
                      className="mt-1 w-36"
                      placeholder="250"
                    />
                  </label>
                  <Button type="button" disabled={busyId === offer.id} onClick={() => void quote(offer.id)}>
                    {busyId === offer.id ? "Sending…" : "Send quote"}
                  </Button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {offer.status === "paid" ? "The homeowner paid." : "Quote sent. They pay on their request page."}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
