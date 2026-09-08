"use client";

import { useState } from "react";
import { Check, Loader2, Search, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/agency-button";

type DomainResult = { domain: string; tld: string; status: "taken" | "likely-available" };

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
      const data = await res.json();
      setResults(data.results);
    } catch {
      setError("Could not check domain availability right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="yourbrandname"
            className="w-full rounded-full border border-border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Button onClick={search} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Demo check via DNS lookup — production wires this into a registrar/reseller API for
        real-time, purchasable availability and pricing.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {results && (
        <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {results.map((r) => (
            <li
              key={r.domain}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm"
            >
              <span className="font-medium text-foreground">{r.domain}</span>
              {r.status === "likely-available" ? (
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <Check className="h-4 w-4" /> Likely available
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <X className="h-4 w-4" /> Taken
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {results && (
        <div className="mt-6 flex justify-center">
          <LinkButton href="/tools/domain-purchase" variant="secondary" size="sm">
            Ready to register one? See domain purchase →
          </LinkButton>
        </div>
      )}
    </div>
  );
}
