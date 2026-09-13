"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth/use-session";
import { FOUNDING_LISTINGS } from "@/lib/marketplace/founding";
import { listingPath, type PublicListing } from "@/lib/marketplace/listing";
import { STOREFRONT_THEMES, type Storefront, type StorefrontService } from "@/lib/service-business/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StorefrontView } from "./storefront-view";

type EditorState = Storefront & { name: string; phone: string; address: string };

function fromListing(listing: PublicListing): EditorState {
  return {
    ...listing.storefront,
    name: listing.name,
    phone: listing.phone,
    address: listing.address,
  };
}

function asListing(slug: string, state: EditorState, cities: string[], trades: PublicListing["trades"]): PublicListing {
  const { name, phone, address, ...storefront } = state;
  return {
    slug,
    name,
    orgId: null,
    trades,
    cities,
    phone,
    address,
    licensed: false,
    insured: false,
    bonded: false,
    websiteUrl: null,
    gbpUrl: null,
    placeholder: false,
    storefront,
    proof: { completedJobs: 0, reviews: [] },
  };
}

export function StorefrontEditor() {
  const session = useSession();
  const [foundingSlug, setFoundingSlug] = useState(FOUNDING_LISTINGS[0]?.slug ?? "");
  const [listing, setListing] = useState<PublicListing | null>(null);
  const [orgStorefront, setOrgStorefront] = useState<Storefront | null>(null);
  const [mode, setMode] = useState<"founding" | "org">("founding");
  const [draft, setDraft] = useState<EditorState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadFounding(slug: string): Promise<{ listing: PublicListing; draft: EditorState } | null> {
    const res = await fetch(`/api/service-business/storefront?founding=${encodeURIComponent(slug)}`, { credentials: "same-origin", cache: "no-store" });
    const data = (await res.json()) as { listing?: PublicListing };
    if (!data.listing) return null;
    return { listing: data.listing, draft: fromListing(data.listing) };
  }

  function applyFounding(snapshot: { listing: PublicListing; draft: EditorState }) {
    setListing(snapshot.listing);
    setDraft(snapshot.draft);
    setMode("founding");
  }

  async function loadOrg() {
    const res = await fetch("/api/service-business/storefront", { credentials: "same-origin", cache: "no-store" });
    const data = (await res.json()) as { storefront?: Storefront | null; org?: { name: string } | null };
    if (data.storefront && data.org) {
      setOrgStorefront(data.storefront);
      setDraft({ ...data.storefront, name: data.org.name, phone: "", address: "" });
      setListing(null);
      setMode("org");
    }
  }

  useEffect(() => {
    if (session.status === "ready" && session.user) void loadFounding(foundingSlug).then((snapshot) => { if (snapshot) applyFounding(snapshot); });
  }, [session.status, session.user, foundingSlug]);

  const preview = useMemo(() => {
    if (!draft) return null;
    if (mode === "founding" && listing) {
      return asListing(listing.slug, draft, listing.cities, listing.trades);
    }
    if (mode === "org" && orgStorefront) {
      return asListing("preview", draft, ["greensboro"], ["lawn-care"]);
    }
    return null;
  }, [draft, listing, mode, orgStorefront]);

  if (session.status !== "ready") return null;
  if (!session.user) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/sign-in" className="underline">
          Sign in
        </a>{" "}
        to customize a storefront.
      </p>
    );
  }
  if (!draft) return <p className="text-sm text-muted-foreground">Loading storefront…</p>;

  function patch<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function patchService(index: number, field: keyof StorefrontService, value: string) {
    setDraft((current) => {
      if (!current) return current;
      const services = current.services.map((service, i) => (i === index ? { ...service, [field]: value } : service));
      return { ...current, services };
    });
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const url = mode === "founding" ? `/api/service-business/storefront?founding=${encodeURIComponent(foundingSlug)}` : "/api/service-business/storefront";
    const res = await fetch(url, { method: "PUT", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setNotice("Saved. The public page uses this theme, colors, and copy immediately.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {FOUNDING_LISTINGS.map((item) => (
            <Button key={item.slug} type="button" size="sm" variant={foundingSlug === item.slug && mode === "founding" ? "default" : "outline"} onClick={() => { setFoundingSlug(item.slug); void loadFounding(item.slug).then((snapshot) => { if (snapshot) applyFounding(snapshot); }); }}>
              {item.slug === "atlas-lot-care" ? "Atlas Lot Care" : item.name}
            </Button>
          ))}
          <Button type="button" size="sm" variant={mode === "org" ? "default" : "outline"} onClick={() => void loadOrg()}>
            My business
          </Button>
        </div>
        <Input value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder="Business name" />
        <Input value={draft.tagline} onChange={(e) => patch("tagline", e.target.value)} placeholder="Tagline" />
        <Textarea value={draft.about} onChange={(e) => patch("about", e.target.value)} placeholder="About" rows={5} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Theme
            <select value={draft.theme} onChange={(e) => patch("theme", e.target.value as Storefront["theme"])} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground">
              {STOREFRONT_THEMES.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Accent
            <Input value={draft.accent} onChange={(e) => patch("accent", e.target.value)} />
          </label>
        </div>
        <Input value={draft.hours} onChange={(e) => patch("hours", e.target.value)} placeholder="Hours" />
        <Input value={draft.ctaLabel} onChange={(e) => patch("ctaLabel", e.target.value)} placeholder="Quote button label" />
        <Input value={draft.logoUrl ?? ""} onChange={(e) => patch("logoUrl", e.target.value || null)} placeholder="Logo URL" />
        <Input value={draft.coverUrl ?? ""} onChange={(e) => patch("coverUrl", e.target.value || null)} placeholder="Cover photo URL" />
        <Input value={draft.phone} onChange={(e) => patch("phone", e.target.value)} placeholder="Phone" />
        <Input value={draft.address} onChange={(e) => patch("address", e.target.value)} placeholder="Address" />
        <div className="flex flex-wrap gap-3 text-sm">
          {(["showLeadForm", "showServices", "showGallery", "showHours", "published"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={draft[key]} onChange={(e) => patch(key, e.target.checked)} />
              {key.replace("show", "").replace("published", "Published")}
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services</p>
          {draft.services.map((service, index) => (
            <div key={`${service.name}-${index}`} className="grid gap-2 rounded-lg border border-border p-2">
              <Input value={service.name} onChange={(e) => patchService(index, "name", e.target.value)} placeholder="Service name" />
              <Input value={service.description} onChange={(e) => patchService(index, "description", e.target.value)} placeholder="Description" />
              <Input value={service.priceFrom} onChange={(e) => patchService(index, "priceFrom", e.target.value)} placeholder="From (optional)" />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => patch("services", [...draft.services, { name: "", description: "", priceFrom: "" }])}>
            Add service
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notice && <p className="text-sm text-foreground">{notice}</p>}
        <Button type="button" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Publish storefront"}
        </Button>
        {mode === "founding" && listing && (
          <a href={listingPath(listing)} className="block text-sm underline">
            View public page
          </a>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        {preview && (
          <StorefrontView
            listing={preview}
            city={preview.cities[0] ?? "greensboro"}
            trade={preview.trades[0] ?? "lawn-care"}
            sourcePath="/os/storefront"
          />
        )}
        {!preview && <div className="p-8 text-sm text-muted-foreground">Preview appears here.</div>}
      </div>
    </div>
  );
}
