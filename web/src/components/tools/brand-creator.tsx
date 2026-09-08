"use client";

import { useState } from "react";
import { Check, Globe, X } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { generateNames, type NameSuggestion } from "@/lib/brand-name-generator";
import { operatorSource, sourcesFromLog, type SkillSource } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

type DomainResult = { domain: string; tld: string; status: "taken" | "likely-available" };

type BrandOutput = {
  selected: NameSuggestion;
  domains: DomainResult[];
  sources: SkillSource[];
};

export function BrandCreator() {
  const run = useDeliveryRunOrThrow();
  const [seed, setSeed] = useState("");
  const packed = (run.output as BrandOutput | null) ?? null;
  const filledSeed = seed || run.brief.trim();
  const source = operatorSource("Business description from this run");

  const start = async () => {
    const suggestions = generateNames(filledSeed || "your brand");
    const picked = suggestions[0];
    if (!picked) throw new Error("Could not generate names.");
    let domains: DomainResult[] = [];
    await run.runScan(
      async (skill) => {
        if (skill.id === "brand.names") {
          return { payload: suggestions, sources: [source], detail: `${suggestions.length} names` };
        }
        if (skill.id === "domain.availability") {
          const res = await fetch("/api/domain-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: picked.name }),
          });
          if (!res.ok) throw new Error("Could not check domain availability right now.");
          const data = await res.json();
          domains = data.results;
          return {
            payload: domains,
            sources: [{ kind: "live fetch" as const, retrievedAt: new Date().toISOString(), note: "DNS availability probe", href: picked.name }],
            detail: picked.name,
          };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Operator brief + DNS probe" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: { selected: picked, domains, sources: sourcesFromLog(log) },
        deliverable: {
          kind: "kit",
          title: picked.name,
          artifacts: [{ name: "name.txt", mime: "text/plain", text: `${picked.name}\n${picked.tagline}` }],
          sources: sourcesFromLog(log),
          warnings: ["Always run a trademark search before committing to a name."],
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={filledSeed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="Describe your business in a few words (e.g. handmade candle shop)"
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <Button onClick={start} disabled={run.scanning}>
            Generate names
          </Button>
        </div>
      }
      review={
        packed ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border p-5">
              <div className="flex gap-1.5">
                {packed.selected.palette.map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{packed.selected.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{packed.selected.tagline}</p>
            </div>
            <div className="rounded-2xl bg-muted p-6">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Globe className="h-4 w-4" /> Domain availability for “{packed.selected.name}”
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {packed.domains.map((d) => (
                  <li key={d.domain} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                    {d.domain}
                    {d.status === "likely-available" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {packed.sources.map((s) => (
                <SourceChip key={`${s.kind}-${s.note}`} source={s} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No name yet.</p>
        )
      }
      exportPanel={
        packed ? (
          <p className="text-sm text-foreground">
            <span className="font-semibold">{packed.selected.name}</span> is approved. Next: register the domain or take it into the Brand Identity Kit.
          </p>
        ) : null
      }
    />
  );
}
