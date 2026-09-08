"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { operatorSource, sourcesFromLog } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";

const formats: { value: string; label: string }[] = [
  { value: "ad-headline", label: "Ad headline" },
  { value: "landing-hero", label: "Landing page hero" },
  { value: "product-blurb", label: "Product blurb" },
  { value: "email-subject", label: "Email subject line" },
];

export function Copywriter() {
  const run = useDeliveryRunOrThrow();
  const [format, setFormat] = useState(formats[0].value);
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState("bold");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const variations = (run.output as string[] | null) ?? null;
  const source = operatorSource("Brief provided in this run");

  const start = async () => {
    let next: string[] = [];
    await run.runScan(
      async (skill) => {
        if (skill.id === "copy.structured") {
          const res = await fetch("/api/copywriter", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ format, brand, product, tone }),
          });
          const data = await res.json();
          next = data.variations ?? [];
          if (next.length === 0) throw new Error("No copy came back.");
          return { payload: next, sources: [source], detail: `${next.length} variants` };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Operator brief" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: next,
        deliverable: {
          kind: "copy",
          title: "Copy variants",
          artifacts: [{ name: "copy.txt", mime: "text/plain", text: next.join("\n") }],
          sources: sourcesFromLog(log),
          warnings: ["Template demo — not guaranteed original. Fact-check before publishing."],
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                {formats.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Tone</label>
              <input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Brand name</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Product / offer</label>
              <input
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="unlimited marketing help"
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
          <Button className="mt-5" onClick={start} disabled={run.scanning}>
            Generate copy
          </Button>
        </div>
      }
      review={
        variations ? (
          <div className="space-y-3">
            {variations.map((v) => (
              <div key={v} className="rounded-lg bg-muted px-4 py-3 text-sm">
                {v}
              </div>
            ))}
            <SourceChip source={source} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No copy yet.</p>
        )
      }
      exportPanel={
        variations ? (
          <div className="space-y-3">
            {variations.map((v, i) => (
              <div key={v} className="flex items-center justify-between gap-3 rounded-lg bg-muted px-4 py-3 text-sm">
                <span>{v}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(v);
                    setCopiedIndex(i);
                    setTimeout(() => setCopiedIndex(null), 1200);
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  {copiedIndex === i ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        ) : null
      }
    />
  );
}
