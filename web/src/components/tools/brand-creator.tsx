"use client";

import { useState } from "react";
import { Check, Globe, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { generateNames, type NameSuggestion } from "@/lib/brand-name-generator";
import { useDeliveryPhase } from "@/components/tools/delivery-run";
import { ApproveGate } from "@/components/tools/approve-gate";

type DomainResult = { domain: string; tld: string; status: "taken" | "likely-available" };

export function BrandCreator() {
  const [seed, setSeed] = useState("");
  const [suggestions, setSuggestions] = useState<NameSuggestion[] | null>(null);
  const [selected, setSelected] = useState<NameSuggestion | null>(null);
  const [domains, setDomains] = useState<DomainResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useDeliveryPhase(checking ? "scan" : selected ? "review" : suggestions ? "scan" : "submit");

  const handleGenerate = () => {
    setSuggestions(generateNames(seed || "your brand"));
    setSelected(null);
    setDomains(null);
  };

  const checkDomains = async (name: string) => {
    setChecking(true);
    setError(null);
    setDomains(null);
    try {
      const res = await fetch("/api/domain-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDomains(data.results);
    } catch {
      setError("Could not check domain availability right now.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Describe your business in a few words (e.g. handmade candle shop)"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
        <Button onClick={handleGenerate}>Generate names</Button>
      </div>

      {suggestions && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((s) => (
            <button
              key={s.name}
              onClick={() => {
                setSelected(s);
                checkDomains(s.name);
              }}
              className={`flex flex-col rounded-2xl border p-5 text-left transition-all ${
                selected?.name === s.name ? "border-indigo-400 shadow-md" : "border-border hover:border-indigo-300"
              }`}
            >
              <div className="flex gap-1.5">
                {s.palette.map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-8 rounded-2xl bg-muted p-6">
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Globe className="h-4 w-4" /> Domain availability for &ldquo;{selected.name}&rdquo;
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Demo check via DNS lookup — wire this into a registrar/reseller API for real,
            purchasable availability and pricing.
          </p>

          {checking && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking…
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {domains && (
            <>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {domains.map((d) => (
                <li
                  key={d.domain}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
                >
                  {d.domain}
                  {d.status === "likely-available" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </li>
              ))}
            </ul>
            <ApproveGate ready={Boolean(domains)} label="Approve this name">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{selected?.name}</span> is approved. Next: register
                the domain or take it into the Brand Identity Kit.
              </p>
            </ApproveGate>
            </>
          )}
        </div>
      )}
    </div>
  );
}
