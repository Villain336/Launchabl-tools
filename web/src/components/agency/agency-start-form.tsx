"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AGENCY_INTAKE_OFFERS, AGENCY_INTAKE_VERTICALS } from "@/lib/service-business/agency-model";

const OFFER_LABELS: Record<(typeof AGENCY_INTAKE_OFFERS)[number], string> = {
  build: "Build — $1,200, 90 days of Network included",
  network: "Network only — $99/month after I already have a page",
  run: "Run — $497/month, you sit on the front door",
  "not-sure": "Not sure yet — start with the audit",
};

export function AgencyStartForm() {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Greensboro");
  const [vertical, setVertical] = useState("appliance-repair");
  const [website, setWebsite] = useState("");
  const [offer, setOffer] = useState<(typeof AGENCY_INTAKE_OFFERS)[number]>("build");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/agency/intake", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, businessName, email, phone, city, vertical, website, offer, notes }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send that. Email hello@launchabl.io.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-lg font-semibold text-foreground">We have it.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          A person reads this — not a drip sequence. If Build is the right next step we will say so, including when we will not sell Run because we cannot sit on that city and trade yet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agency-name">Your name</Label>
          <Input id="agency-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency-business">Business name</Label>
          <Input id="agency-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agency-email">Email</Label>
          <Input id="agency-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency-phone">Phone</Label>
          <Input id="agency-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agency-city">City we should sit in</Label>
          <Input id="agency-city" value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agency-vertical">Trade</Label>
          <select
            id="agency-vertical"
            value={vertical}
            onChange={(e) => setVertical(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {AGENCY_INTAKE_VERTICALS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="agency-website">Website if you have one</Label>
        <Input id="agency-website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="agency-offer">What you think you need</Label>
        <select
          id="agency-offer"
          value={offer}
          onChange={(e) => setOffer(e.target.value as (typeof AGENCY_INTAKE_OFFERS)[number])}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {AGENCY_INTAKE_OFFERS.map((id) => (
            <option key={id} value={id}>
              {OFFER_LABELS[id]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="agency-notes">How work shows up today</Label>
        <Textarea
          id="agency-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Nextdoor threads, missed calls, a friend of a friend…"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Free audit first if you want it. We will not invent a crew on your city page. Kitchen hoods and clinics stay off the public directory until a real operator writes Build.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full" size="lg">
        {busy ? "Sending…" : "Send this to a person"}
      </Button>
    </form>
  );
}
