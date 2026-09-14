"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NC_CITIES } from "@/lib/marketplace/cities";
import { FOUNDING_REFERRAL } from "@/lib/service-business/agency-model";
import { TRADE_LABELS, TRADES } from "@/lib/service-business/profile";

type ReferralRow = { id: string; city: string; trade: string; referredSlug: string; creditUsd: number };

export function FoundingReferralCard() {
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("greensboro");
  const [trade, setTrade] = useState("appliance-repair");
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/service-business/referrals", { credentials: "same-origin", cache: "no-store" })
      .then((res) => res.json())
      .then((data: { referrals?: ReferralRow[] }) => setRows(data.referrals ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/service-business/referrals", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ referredSlug: slug, city, trade }),
    });
    const data = (await res.json()) as { error?: string; referral?: ReferralRow };
    setBusy(false);
    if (!res.ok || !data.referral) {
      setError(data.error ?? "Could not credit that crew.");
      return;
    }
    setNotice(`Credited $${FOUNDING_REFERRAL.creditUsd} — one month of Network.`);
    setSlug("");
    setRows((current) => [data.referral!, ...current]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bring the next founding crew</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Seated on a board that is still short of three? Bring crew two or three and we credit one month of Network (${FOUNDING_REFERRAL.creditUsd}). They must already have a published Network or Run seat.
        </p>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-3">
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Their listing slug" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {NC_CITIES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
            <select value={trade} onChange={(e) => setTrade(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {TRADES.map((item) => (
                <option key={item} value={item}>
                  {TRADE_LABELS[item]}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-foreground">{notice}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Checking…" : "Credit this crew"}
          </Button>
        </form>
        {rows.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {rows.map((row) => (
              <li key={row.id}>
                {row.referredSlug} · {row.city} · {row.trade} · ${row.creditUsd}
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
