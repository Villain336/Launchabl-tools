"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { useDeliveryPhase } from "@/components/tools/delivery-run";
import { ApproveGate } from "@/components/tools/approve-gate";

type SchemaType = "Organization" | "LocalBusiness" | "Product" | "FAQPage" | "Article";

const schemaTypes: { value: SchemaType; label: string }[] = [
  { value: "Organization", label: "Organization" },
  { value: "LocalBusiness", label: "Local Business" },
  { value: "Product", label: "Product" },
  { value: "FAQPage", label: "FAQ Page" },
  { value: "Article", label: "Article" },
];

export function SchemaGenerator() {
  const [type, setType] = useState<SchemaType>("Organization");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [faqs, setFaqs] = useState([{ q: "", a: "" }]);
  const [copied, setCopied] = useState(false);
  useDeliveryPhase(name.trim() || faqs.some((f) => f.q.trim()) ? "review" : "submit");

  const json = useMemo(() => {
    const base: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": type,
    };

    if (type === "Organization" || type === "LocalBusiness") {
      Object.assign(base, {
        name,
        url,
        description: description || undefined,
        logo: logo || undefined,
        telephone: phone || undefined,
        address: address ? { "@type": "PostalAddress", streetAddress: address } : undefined,
      });
    }

    if (type === "Product") {
      Object.assign(base, {
        name,
        description: description || undefined,
        image: logo || undefined,
        offers: price
          ? { "@type": "Offer", price, priceCurrency: "USD", availability: "https://schema.org/InStock" }
          : undefined,
      });
    }

    if (type === "Article") {
      Object.assign(base, {
        headline: name,
        description: description || undefined,
        image: logo || undefined,
        author: { "@type": "Organization", name: name || undefined },
      });
    }

    if (type === "FAQPage") {
      base.mainEntity = faqs
        .filter((f) => f.q.trim())
        .map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        }));
    }

    const clean = JSON.parse(JSON.stringify(base));
    return JSON.stringify(clean, null, 2);
  }, [type, name, url, description, logo, phone, address, price, faqs]);

  const scriptTag = `<script type="application/ld+json">\n${json}\n</script>`;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground">Schema type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SchemaType)}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {schemaTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {type !== "FAQPage" && (
          <>
            <Field label={type === "Article" ? "Headline" : "Name"} value={name} onChange={setName} />
            {(type === "Organization" || type === "LocalBusiness") && (
              <Field label="Website URL" value={url} onChange={setUrl} placeholder="https://yourbrand.com" />
            )}
            <Field label="Description" value={description} onChange={setDescription} textarea />
            <Field label="Logo / image URL" value={logo} onChange={setLogo} placeholder="https://yourbrand.com/logo.png" />
            {type === "LocalBusiness" && (
              <>
                <Field label="Phone" value={phone} onChange={setPhone} />
                <Field label="Street address" value={address} onChange={setAddress} />
              </>
            )}
            {type === "Product" && <Field label="Price (USD)" value={price} onChange={setPrice} placeholder="49.00" />}
          </>
        )}

        {type === "FAQPage" && (
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-lg border border-border p-3">
                <input
                  value={faq.q}
                  placeholder="Question"
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i].q = e.target.value;
                    setFaqs(next);
                  }}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-ring"
                />
                <textarea
                  value={faq.a}
                  placeholder="Answer"
                  onChange={(e) => {
                    const next = [...faqs];
                    next[i].a = e.target.value;
                    setFaqs(next);
                  }}
                  className="mt-2 w-full rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-ring"
                />
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={() => setFaqs([...faqs, { q: "", a: "" }])}>
              Add question
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Generated JSON-LD</label>
          <ApproveGate ready={Boolean(name.trim() || faqs.some((f) => f.q.trim()))} label="Approve markup">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(scriptTag);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </ApproveGate>
        </div>
        <pre className="mt-2 max-h-[420px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
          {scriptTag}
        </pre>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      )}
    </div>
  );
}
