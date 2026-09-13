"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OpenSlot } from "@/lib/service-business/booking";

export function BookingForm({
  listingSlug,
  contractorName,
  city,
  trade,
  sourcePath,
  services,
  startingPrice,
  accent,
}: {
  listingSlug: string;
  contractorName: string;
  city: string;
  trade: string;
  sourcePath: string;
  services: { name: string; priceFrom: string }[];
  startingPrice: string | null;
  accent?: string;
}) {
  const [slots, setSlots] = useState<OpenSlot[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [serviceName, setServiceName] = useState(services[0]?.name ?? "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ label: string; onTheBook: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/marketplace/bookings?slug=${encodeURIComponent(listingSlug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { slots?: OpenSlot[] }) => {
        const next = data.slots ?? [];
        setSlots(next);
        setScheduledFor((current) => current || next[0]?.start || "");
      });
  }, [listingSlug]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/marketplace/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingSlug, city, trade, name, phone, email, address, serviceName, scheduledFor, sourcePath }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; scheduledFor?: string; onTheBook?: boolean };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not book that time.");
      return;
    }
    const label = slots.find((slot) => slot.start === (data.scheduledFor ?? scheduledFor))?.label ?? "that time";
    setDone({ label, onTheBook: Boolean(data.onTheBook) });
  }

  if (done) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-foreground">
        You&rsquo;re down for {done.label} with {contractorName}.
        {done.onTheBook ? " It is on their job book." : " They have the time you picked — they will confirm from the details you left."}
      </p>
    );
  }

  const selectedPrice = services.find((service) => service.name === serviceName)?.priceFrom || startingPrice;

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Pick a time this week</p>
      {selectedPrice && <p className="text-xs text-muted-foreground">Starting at {selectedPrice} — not a final quote if the job is bigger than it looks.</p>}
      {services.length > 0 && (
        <select
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {services.map((service) => (
            <option key={service.name} value={service.name}>
              {service.name}
              {service.priceFrom ? ` — from ${service.priceFrom}` : ""}
            </option>
          ))}
        </select>
      )}
      {slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open weekday slots in the next two weeks. Leave a quote request below.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {slots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              onClick={() => setScheduledFor(slot.start)}
              className={`rounded-lg border px-2 py-2 text-left text-xs ${scheduledFor === slot.start ? "border-primary bg-primary/10 font-medium" : "border-border"}`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      )}
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
      <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Job address" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !scheduledFor} className="w-full" style={accent ? { backgroundColor: accent, color: "#fff" } : undefined}>
        {busy ? "Booking…" : "Book this time"}
      </Button>
    </form>
  );
}
