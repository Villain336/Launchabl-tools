"use client";

import { useState } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { useDeliveryPhase } from "@/components/tools/delivery-run";
import { ApproveGate } from "@/components/tools/approve-gate";

const formats: { value: string; label: string }[] = [
  { value: "ad-headline", label: "Ad headline" },
  { value: "landing-hero", label: "Landing page hero" },
  { value: "product-blurb", label: "Product blurb" },
  { value: "email-subject", label: "Email subject line" },
];

export function Copywriter() {
  const [format, setFormat] = useState(formats[0].value);
  const [brand, setBrand] = useState("");
  const [product, setProduct] = useState("");
  const [tone, setTone] = useState("bold");
  const [variations, setVariations] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  useDeliveryPhase(busy ? "scan" : variations ? "review" : "submit");

  const generate = async () => {
    setBusy(true);
    setVariations(null);
    try {
      const res = await fetch("/api/copywriter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, brand, product, tone }),
      });
      const data = await res.json();
      setVariations(data.variations ?? []);
    } finally {
      setBusy(false);
    }
  };

  return (
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
            placeholder="bold, playful, professional…"
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

      <Button className="mt-5" onClick={generate} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Generate copy
      </Button>

      {variations && (
        <div className="mt-6 space-y-3">
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
          <ApproveGate ready={Boolean(variations?.length)} label="Approve copy">
            <p className="text-sm text-muted-foreground">
              Copy is approved. Use the clipboard icons to export any variant.
            </p>
          </ApproveGate>
          <p className="pt-2 text-xs text-muted-foreground">
            Demo output from a template engine — production swaps this for an LLM call via the
            same API route, with no changes needed to this component.
          </p>
        </div>
      )}
    </div>
  );
}
