"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

const categorySuggestionsByIndustry: Record<string, string[]> = {
  restaurant: ["Restaurant", "Caterer", "Take Out Restaurant", "Delivery Restaurant"],
  salon: ["Hair Salon", "Beauty Salon", "Barber Shop", "Nail Salon"],
  legal: ["Law Firm", "Attorney", "Legal Services", "Notary Public"],
  contractor: ["General Contractor", "Home Improvement", "Construction Company", "Handyman"],
  medical: ["Medical Clinic", "Doctor", "Health Consultant", "Wellness Center"],
  retail: ["Retail Store", "Boutique", "Gift Shop", "Shopping"],
  default: ["Local Business", "Professional Service", "Consultant"],
};

const qaTemplates = [
  (b: string) => `Q: Does ${b} offer free consultations?\nA: Reach out through our website or by phone and we'll walk you through pricing and next steps.`,
  (b: string) => `Q: What areas does ${b} serve?\nA: We primarily serve the local area and surrounding communities — contact us to confirm your location.`,
  (b: string) => `Q: How do I book with ${b}?\nA: You can book directly through our website or by calling us during business hours.`,
];

function reviewResponse(tone: "positive" | "negative", brand: string) {
  if (tone === "positive") {
    return `Thank you so much for the kind words! We're thrilled you had a great experience with ${brand}, and we look forward to working with you again.`;
  }
  return `Thank you for the feedback — we're sorry your experience with ${brand} didn't meet expectations. We'd like to make this right; please reach out to us directly so we can help.`;
}

export function LocalSeoOptimizer() {
  const [brand, setBrand] = useState("");
  const [city, setCity] = useState("");
  const [industry, setIndustry] = useState("default");
  const [copied, setCopied] = useState<string | null>(null);

  const b = brand.trim() || "Your Business";
  const c = city.trim() || "your city";

  const description = useMemo(
    () =>
      `${b} proudly serves ${c} and the surrounding area, offering dependable, locally-trusted service. Whether you're a first-time customer or a long-time client, our team is focused on getting it right — every time. Reach out today to see why ${c} chooses ${b}.`,
    [b, c],
  );

  const categories = categorySuggestionsByIndustry[industry] ?? categorySuggestionsByIndustry.default;
  const qas = qaTemplates.map((fn) => fn(b));

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-foreground">Business name</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">City / service area</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            <option value="default">General / other</option>
            <option value="restaurant">Restaurant / food</option>
            <option value="salon">Salon / beauty</option>
            <option value="legal">Legal</option>
            <option value="contractor">Contractor / home services</option>
            <option value="medical">Medical / wellness</option>
            <option value="retail">Retail</option>
          </select>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <Block title="Google Business Profile description" text={description} onCopy={() => copy(description, "desc")} copied={copied === "desc"} />

        <div>
          <p className="text-sm font-semibold text-foreground">Suggested categories</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Suggested Q&A starters</p>
          <div className="mt-2 space-y-3">
            {qas.map((qa, i) => (
              <Block key={i} text={qa} onCopy={() => copy(qa, `qa-${i}`)} copied={copied === `qa-${i}`} mono />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">Review response templates</p>
          <div className="mt-2 space-y-3">
            <Block
              text={reviewResponse("positive", b)}
              onCopy={() => copy(reviewResponse("positive", b), "review-pos")}
              copied={copied === "review-pos"}
            />
            <Block
              text={reviewResponse("negative", b)}
              onCopy={() => copy(reviewResponse("negative", b), "review-neg")}
              copied={copied === "review-neg"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Block({
  title,
  text,
  onCopy,
  copied,
  mono,
}: {
  title?: string;
  text: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      <div className={`mt-2 flex items-start justify-between gap-3 rounded-lg bg-muted p-4 text-sm text-foreground ${mono ? "whitespace-pre-line" : ""}`}>
        <span>{text}</span>
        <button onClick={onCopy} className="flex-shrink-0 text-muted-foreground hover:text-primary">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
