"use client";

import { useState } from "react";
import { ArrowUpRight, Check, HelpCircle, Loader2, Search, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/agency-button";
import type { DomainCheck, RegistrarLink } from "@/lib/web/domains";

type DomainResult = DomainCheck & { price: string | null; registrars: RegistrarLink[] };

export function DomainAvailabilitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DomainResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/domain-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: query }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { results: DomainResult[] };
      setResults(data.results);
    } catch {
      setError("Could not check domain availability right now.");
    } finally {
      setBusy(false);
    }
  };

  const available = results?.filter((r) => r.status === "available").length ?? 0;

  return (
    <div data-domain-availability>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="yourbrandname — or a full domain like acme.io" className="w-full rounded-full border border-border py-2.5 pr-4 pl-9 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30" data-da-input />
        </div>
        <Button onClick={search} disabled={busy} data-da-search>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Checked live against the registries (RDAP) — authoritative for .com, .io, .ai, .app, .dev and most TLDs; DNS fallback where a TLD publishes none.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {results && (
        <>
          <p className="mt-6 text-sm font-medium text-foreground">
            {available} of {results.length} available
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {results.map((r) => (
              <li key={r.domain} className="rounded-xl border border-border px-4 py-3 text-sm" data-da-result={r.status}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{r.domain}</span>
                  {r.status === "available" && (
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Check className="h-4 w-4" /> Available
                    </span>
                  )}
                  {r.status === "taken" && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <X className="h-4 w-4" /> Taken
                    </span>
                  )}
                  {r.status === "unknown" && (
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <HelpCircle className="h-4 w-4" /> Unclear
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.status === "taken" && [r.registrar, r.registered && `since ${r.registered.slice(0, 4)}`, r.expires && `expires ${r.expires}`].filter(Boolean).join(" · ")}
                  {r.status === "available" && r.price}
                  {r.status === "unknown" && r.note}
                </p>
                {r.status === "available" && r.registrars.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.registrars.map((link) => (
                      <a key={link.registrar} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                        Buy at {link.registrar.replace(" Registrar", "")} <ArrowUpRight className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-center">
            <LinkButton href={`/tools/domain-purchase?q=${encodeURIComponent(`Brand is "${query.trim()}". Which of these should I buy, and what else should I check?`)}`} variant="secondary" size="sm">
              Get a recommendation and purchase plan →
            </LinkButton>
          </div>
        </>
      )}
    </div>
  );
}
