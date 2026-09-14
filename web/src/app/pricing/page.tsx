import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import PricingBlock from "@/components/blocks/pricing-3";
import ToolsProPricing from "@/components/blocks/tools-pro-pricing";
import { CreditPacksSection } from "@/components/blocks/credit-packs-section";
import FeaturesBlock from "@/components/blocks/features-3";
import ComparisonBlock from "@/components/blocks/comparison-2";
import FaqsBlock from "@/components/blocks/faqs-1";
import { MarketplacePricing } from "@/components/blocks/marketplace-pricing";

const title = "Pricing — Build $1,200 · Network $99/mo · Run $497/mo";
const description =
  "We build and run local businesses. Build is $1,200 and includes 90 days of Network. Then Network is $99/month. Run is $497/month and includes Network. Tools Pro and credit packs stay for the compute-heavy tools.";

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
    question: "What does Network cost, and is it a fee per ping?",
    answer:
      "Build includes 90 days of Network. After that, Network is $99/month to stay on the DoorDash board — city-wide jobs, first claim owns them. We do not charge per ping or sell shared Angi-style leads. Run at $497/month includes Network. A free listing is a brochure and cannot claim.",
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
    answer: `${siteConfig.agencyGuarantee} Tools on the unlimited design plan: ${siteConfig.guarantee}`,
  },
];

/** Schema.org data so search engines and AI answer engines can cite the offer and its FAQ directly. */
function pricingJsonLd() {
  const url = `${siteConfig.url}/pricing`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Service",
      "@id": `${url}#service`,
      name: `${siteConfig.name} Build, Network, and Run`,
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
          name: "Build",
          price: siteConfig.priceNumeric,
          priceCurrency: "USD",
          description: "One-time stand-up: brand, site, booking, OS, live network profile, and 90 days of Network. Live in 14 days or Build is refunded.",
          url,
        },
        {
          "@type": "Offer",
          "@id": `${url}#network`,
          name: "Network",
          price: "99",
          priceCurrency: "USD",
          description: "Monthly DoorDash seat — city-wide pings, first claim owns the job. Not a fee per ping.",
          url,
        },
        {
          "@type": "Offer",
          "@id": `${url}#run`,
          name: "Run",
          price: "497",
          priceCurrency: "USD",
          description: "We run the front door. Network is included.",
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
      <MarketplacePricing />
      <PricingBlock />
      <ToolsProPricing />
      <CreditPacksSection />
      <ComparisonBlock />
      <FeaturesBlock />
      <FaqsBlock
        items={faqs}
        title="Frequently asked questions"
        description="Answers about Build, Network, Run, the free audit, and Tools Pro."
      />
    </>
  );
}
