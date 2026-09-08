"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { operatorSource, sourcesFromLog } from "@/lib/deliverable";
import { useDeliveryRunOrThrow } from "@/components/tools/delivery-run";
import { AgentDock } from "@/components/tools/agent-dock";
import { SourceChip } from "@/components/tools/source-chip";
import { extractUrls } from "@/lib/studio-triggers";

type SchemaType = "Organization" | "LocalBusiness" | "Product" | "FAQPage" | "Article";

const schemaTypes: { value: SchemaType; label: string }[] = [
  { value: "Organization", label: "Organization" },
  { value: "LocalBusiness", label: "Local Business" },
  { value: "Product", label: "Product" },
  { value: "FAQPage", label: "FAQ Page" },
  { value: "Article", label: "Article" },
];

export function SchemaGenerator() {
  const run = useDeliveryRunOrThrow();
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
  const scriptTag = (run.output as string | null) ?? "";
  const source = operatorSource("Fields entered in this run");
  const filledUrl = url || extractUrls(run.brief)[0] || "";

  const json = useMemo(() => buildJson({ type, name, url: filledUrl, description, logo, phone, address, price, faqs }), [
    type,
    name,
    filledUrl,
    description,
    logo,
    phone,
    address,
    price,
    faqs,
  ]);

  const start = async () => {
    const nextScript = `<script type="application/ld+json">\n${json}\n</script>`;
    await run.runScan(
      async (skill) => {
        if (skill.id === "seo.draft-schema") {
          if (!name.trim() && !faqs.some((f) => f.q.trim())) throw new Error("Add a name or at least one FAQ.");
          return { payload: json, sources: [source], detail: type };
        }
        if (skill.id === "schema-validate") {
          JSON.parse(json);
          return { sources: [source], detail: "Valid JSON-LD" };
        }
        if (skill.id === "cite-source") {
          return { sources: [source], detail: "Operator-provided fields" };
        }
        throw new Error(`Unknown skill ${skill.id}`);
      },
      (log) => ({
        output: nextScript,
        deliverable: {
          kind: "copy",
          title: `${type} schema`,
          artifacts: [{ name: "schema.jsonld", mime: "application/ld+json", text: json }],
          sources: sourcesFromLog(log),
          warnings: [],
          gates: { download: "locked" },
        },
      }),
    );
  };

  return (
    <AgentDock
      intake={
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
                <Field label="Website URL" value={filledUrl} onChange={setUrl} placeholder="https://yourbrand.com" />
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
          <Button onClick={start} disabled={run.scanning}>
            Generate markup
          </Button>
        </div>
      }
      review={
        scriptTag ? (
          <div>
            <SourceChip source={source} />
            <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{scriptTag}</pre>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No markup yet.</p>
        )
      }
      exportPanel={
        scriptTag ? (
          <Button
            onClick={() => {
              navigator.clipboard.writeText(scriptTag);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy markup"}
          </Button>
        ) : null
      }
    />
  );
}

function buildJson(opts: {
  type: SchemaType;
  name: string;
  url: string;
  description: string;
  logo: string;
  phone: string;
  address: string;
  price: string;
  faqs: { q: string; a: string }[];
}) {
  const base: Record<string, unknown> = { "@context": "https://schema.org", "@type": opts.type };
  if (opts.type === "Organization" || opts.type === "LocalBusiness") {
    Object.assign(base, {
      name: opts.name,
      url: opts.url,
      description: opts.description || undefined,
      logo: opts.logo || undefined,
      telephone: opts.phone || undefined,
      address: opts.address ? { "@type": "PostalAddress", streetAddress: opts.address } : undefined,
    });
  }
  if (opts.type === "Product") {
    Object.assign(base, {
      name: opts.name,
      description: opts.description || undefined,
      image: opts.logo || undefined,
      offers: opts.price
        ? { "@type": "Offer", price: opts.price, priceCurrency: "USD", availability: "https://schema.org/InStock" }
        : undefined,
    });
  }
  if (opts.type === "Article") {
    Object.assign(base, {
      headline: opts.name,
      description: opts.description || undefined,
      image: opts.logo || undefined,
      author: { "@type": "Organization", name: opts.name || undefined },
    });
  }
  if (opts.type === "FAQPage") {
    base.mainEntity = opts.faqs
      .filter((f) => f.q.trim())
      .map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      }));
  }
  return JSON.stringify(JSON.parse(JSON.stringify(base)), null, 2);
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
