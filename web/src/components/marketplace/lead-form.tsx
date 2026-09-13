"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeadForm({
  listingSlug,
  contractorName,
  city,
  trade,
  sourcePath,
  ctaLabel = "Request a quote",
  accent,
}: {
  listingSlug: string;
  contractorName?: string;
  city: string;
  trade: string;
  sourcePath: string;
  ctaLabel?: string;
  accent?: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState("soon");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/marketplace/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingSlug, city, trade, name, phone, email, description, urgency, sourcePath }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not send that request.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-xl border border-border bg-card p-4 text-sm text-foreground">
        Request sent to {contractorName || "this contractor"} only. We do not sell it to anyone else. They&rsquo;ll follow up from the details you left.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
      <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you need done?" rows={4} />
      <select
        value={urgency}
        onChange={(e) => setUrgency(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="flexible">Flexible timing</option>
        <option value="soon">This week</option>
        <option value="asap">ASAP</option>
      </select>
      <p className="text-xs text-muted-foreground">
        Exclusive: this goes only to {contractorName || "this contractor"}. We do not auction the same request to other companies the way Angi or Thumbtack do.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full" style={accent ? { backgroundColor: accent, color: "#fff" } : undefined}>
        {busy ? "Sending…" : ctaLabel}
      </Button>
    </form>
  );
}
