"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cityTradeBoard } from "@/lib/service-business/agency-model";

type Props = {
  city: string;
  trade: string;
  tradeLabel: string;
  cityLabel: string;
  availableCrews: number;
};

export function DispatchForm({ city, trade, tradeLabel, cityLabel, availableCrews }: Props) {
  const router = useRouter();
  const board = cityTradeBoard(availableCrews);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const description = when.trim() ? `${details.trim()}\nWhen: ${when.trim()}` : details;
    try {
      const res = await fetch("/api/marketplace/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          trade,
          name,
          phone: phone || undefined,
          email: email || undefined,
          address: address || undefined,
          description,
          sourcePath: `/nc/${city}/${trade}`,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string; token?: string };
      if (!res.ok || !data.id || !data.token) {
        throw new Error(data.error ?? "Could not send the request.");
      }
      router.push(`/request/${data.id}?token=${encodeURIComponent(data.token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the request.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Get this done — first crew to claim it</p>
      <p className="text-sm text-muted-foreground">
        {board.open
          ? `We ping ${availableCrews} available ${tradeLabel.toLowerCase()} crew${availableCrews === 1 ? "" : "s"} in ${cityLabel} at once. First one to claim owns the job, sends a quote, and you pay on the next page.`
          : `This board is not open yet — ${board.seated} of ${board.needed} claiming crews. You can still send the request; it sits for two hours. Founding listings without a signed-up crew cannot be pinged.`}
      </p>
      <label className="block text-sm">
        <span className="text-muted-foreground">Your name</span>
        <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-muted-foreground">Phone</span>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
        </label>
        <label className="block text-sm">
          <span className="text-muted-foreground">Email</span>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-muted-foreground">Job address</span>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">When do you need this?</span>
        <Input
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          placeholder="Saturday morning, this week, ASAP"
          className="mt-1"
        />
      </label>
      <label className="block text-sm">
        <span className="text-muted-foreground">What needs doing?</span>
        <textarea
          required
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Pinging crews…" : `Ping available ${tradeLabel.toLowerCase()} crews`}
      </Button>
    </form>
  );
}
