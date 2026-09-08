import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import PricingBlock from "@/components/blocks/pricing-3";
import FeaturesBlock from "@/components/blocks/features-3";
import ComparisonBlock from "@/components/blocks/comparison-2";
import FaqsBlock from "@/components/blocks/faqs-1";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${siteConfig.price} one time for unlimited marketing and design requests. No retainer, no monthly fee.`,
};

const faqs = [
  {
    question: 'What does "unlimited" actually mean?',
    answer:
      "Unlimited requests over the life of your plan, worked one at a time in a visible queue. This keeps every request getting full attention instead of everything happening at once, badly.",
  },
  {
    question: "Is this really a one-time price?",
    answer:
      "Yes — you pay once for lifetime access to the request queue. Hosting has a small pass-through cost at scale, which we'll always disclose up front.",
  },
  {
    question: "What if I only need the free tools?",
    answer:
      "Great — the tools in our toolbox are free to use with no account required, whether or not you ever upgrade.",
  },
  {
    question: "Is there a guarantee?",
    answer: "If your first three requests don't meet the brief after revisions, we'll refund the plan in full.",
  },
];

export default function PricingPage() {
  return (
    <>
      <PricingBlock />
      <ComparisonBlock />
      <FeaturesBlock />
      <FaqsBlock
        items={faqs}
        title="Frequently asked questions"
        description="Answers about the unlimited plan and how billing works."
      />
    </>
  );
}
