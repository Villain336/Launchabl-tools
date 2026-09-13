import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Subprocessors" };

type Subprocessor = {
  name: string;
  purpose: string;
  dataProcessed: string;
  location: string;
};

const subprocessors: Subprocessor[] = [
  {
    name: "Vercel",
    purpose: "Application hosting, edge network, Blob object storage, and the Postgres database backing the audit log and billing ledger.",
    dataProcessed: "All request/response data in transit; uploaded files (Blob); billing and audit records (Postgres).",
    location: "United States (with a global edge network for request routing).",
  },
  {
    name: "Upstash",
    purpose: "Redis-compatible key-value store used for sessions, rate limiting, usage accounting, and account/project records.",
    dataProcessed: "Session tokens, account records (email, name, plan status), project/Vault content, usage counters.",
    location: "United States.",
  },
  {
    name: "Stripe",
    purpose: "Payment processing for the Tools Pro subscription and credit packs.",
    dataProcessed: "Payment card data (Stripe never shares raw card numbers with us), billing name/email, subscription and invoice state.",
    location: "United States (Stripe is PCI-DSS Level 1 certified).",
  },
  {
    name: "Resend",
    purpose: "Transactional email delivery for sign-in codes and account notifications.",
    dataProcessed: "Recipient email address, email subject/body content we generate (e.g. a sign-in code).",
    location: "United States.",
  },
  {
    name: "Anthropic, OpenAI, and Google (via Vercel AI Gateway)",
    purpose: "Underlying large-language-model providers for AI-powered tools and the unified agent.",
    dataProcessed: "Prompt text and any file/URL content included in a tool request, for the duration of generating a response.",
    location: "United States (model inference; see each provider's own data-processing terms for their infrastructure specifics).",
  },
  {
    name: "ByteDance, Black Forest Labs, and Meta (via Vercel AI Gateway)",
    purpose: "Specialist image-generation model providers used as fallbacks in the image-generation model chain.",
    dataProcessed: "Image-generation prompt text, for the duration of generating a response.",
    location: "Varies by provider; routed through the same Vercel AI Gateway as the primary model providers.",
  },
];

export default function SubprocessorsPage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Subprocessors</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last reviewed: {new Date().toISOString().slice(0, 10)}. This is the complete, current
        list of third parties that can process customer data on our behalf. We&apos;ll update
        this page — not just an internal doc — whenever that list changes. See also our{" "}
        <Link href="/security" className="underline">
          security &amp; data-handling overview
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-semibold text-foreground">Subprocessor</th>
              <th className="py-2 pr-4 font-semibold text-foreground">Purpose</th>
              <th className="py-2 pr-4 font-semibold text-foreground">Data processed</th>
              <th className="py-2 font-semibold text-foreground">Location</th>
            </tr>
          </thead>
          <tbody>
            {subprocessors.map((sp) => (
              <tr key={sp.name} className="border-b border-border align-top">
                <td className="py-3 pr-4 font-medium whitespace-nowrap text-foreground">{sp.name}</td>
                <td className="py-3 pr-4 text-muted-foreground">{sp.purpose}</td>
                <td className="py-3 pr-4 text-muted-foreground">{sp.dataProcessed}</td>
                <td className="py-3 text-muted-foreground">{sp.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 space-y-4 text-sm text-foreground">
        <p>
          We&apos;ll notify enterprise customers who have signed our{" "}
          <Link href="/legal/dpa" className="underline">
            DPA
          </Link>{" "}
          before adding a new subprocessor that would process their data, consistent with the
          notice period stated in that agreement.
        </p>
        <p>
          Questions about a specific subprocessor or its data-handling terms:{" "}
          <a href="mailto:security@launchabl.io" className="underline">
            security@launchabl.io
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
