import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import PricingBlock from "@/components/blocks/pricing-3";
import ToolsProPricing from "@/components/blocks/tools-pro-pricing";
import FeaturesBlock from "@/components/blocks/features-3";
import ComparisonBlock from "@/components/blocks/comparison-2";
import FaqsBlock from "@/components/blocks/faqs-1";

const title = `Pricing — Free Audit, Then ${siteConfig.price} Unlimited`;
const description = `Start with a free 20+ point website audit, no account required. When you're ready, ${siteConfig.price} one time unlocks unlimited marketing and design requests for life. No retainer, no monthly fee.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing" },
  openGraph: { type: "website", url: "/pricing", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const faqs = [
  {
    question: "How does the free audit work?",
    answer:
      "Paste your URL into the Website Audit Report tool and get a scored, 20+ point technical and on-page SEO audit back in under a minute — no account, no credit card. It's the same real audit engine the agency uses internally, not a stripped-down teaser.",
  },
  {
    question: 'What does "unlimited" actually mean?',
    answer:
      "Unlimited requests over the life of your plan, worked one at a time in a visible queue. This keeps every request getting full attention instead of everything happening at once, badly.",
  },
  {
    question: "Is this really a one-time price?",
    answer:
      `Yes — you pay ${siteConfig.price} once for lifetime access to the request queue. Hosting has a small pass-through cost at scale, which we'll always disclose up front.`,
  },
  {
    question: "What if I only need the free tools?",
    answer:
      "Great — the tools in our toolbox, including the free audit, are free to use (your first run needs no account), whether or not you ever upgrade.",
  },
  {
    question: "What does Tools Pro unlock?",
    answer:
      "Unlimited use of the three tools that cost real compute per call: the AI Image Generator, Transcriber and Clip Finder. Every other tool in the toolbox stays free either way — Tools Pro just removes the daily limits on those three.",
  },
  {
    question: "Is there a guarantee?",
    answer: siteConfig.guarantee,
  },
];

/** Schema.org data so search engines and AI answer engines can cite the offer and its FAQ directly. */
function pricingJsonLd() {
  const url = `${siteConfig.url}/pricing`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: `${siteConfig.name} unlimited marketing & design plan`,
      description,
      url,
      provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
      offers: [
        {
          "@type": "Offer",
          "@id": `${url}#free-audit`,
          name: siteConfig.freeAudit.name,
          price: "0",
          priceCurrency: "USD",
          description: siteConfig.freeAudit.description,
          url: `${siteConfig.url}${siteConfig.freeAudit.href}`,
        },
        {
          "@type": "Offer",
          "@id": `${url}#unlimited-plan`,
          name: "Unlimited marketing & design plan",
          price: siteConfig.priceNumeric,
          priceCurrency: "USD",
          description: "One-time payment for unlimited, lifetime marketing and design requests — no retainer.",
          url,
        },
        {
          "@type": "Offer",
          "@id": `${url}#tools-pro`,
          name: "Tools Pro subscription",
          price: "17",
          priceCurrency: "USD",
          description: "Monthly subscription for unlimited AI image generation, transcription and clip-finding across the free toolbox.",
          url,
        },
      ],
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Pricing", item: url },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

export default function PricingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd()) }} />
      <PricingBlock />
      <ToolsProPricing />
      <ComparisonBlock />
      <FeaturesBlock />
      <FaqsBlock
        items={faqs}
        title="Frequently asked questions"
        description="Answers about the free audit, the unlimited plan, and how billing works."
      />
    </>
  );
}
