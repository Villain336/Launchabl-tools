import type { Metadata } from "next";
import { CheckCircle2, XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${siteConfig.price} one time for unlimited marketing and design requests. No retainer, no monthly fee.`,
};

const included = [
  "Unlimited design & marketing requests, queued one at a time",
  "Brand identity, website design, and ongoing site edits",
  "Copywriting for ads, email, and landing pages",
  "Technical SEO and structured data across your whole site",
  "Domain registration and managed hosting for your primary site",
  "Unlimited revisions on any request until you're happy",
];

const notIncluded = [
  "Custom software / app development",
  "Paid ad spend (we design the ads, you fund the media budget)",
  "More than one active request in the queue at a time",
  "Rush delivery outside the standard queue (available as an add-on)",
];

const faqs = [
  {
    q: "What does \"unlimited\" actually mean?",
    a: "Unlimited requests over the life of your plan, worked one at a time in a visible queue. This keeps every request getting full attention instead of everything happening at once, badly.",
  },
  {
    q: "Is this really a one-time price?",
    a: "Yes — you pay once for lifetime access to the request queue. Hosting has a small pass-through cost at scale, which we'll always disclose up front.",
  },
  {
    q: "What if I only need the free tools?",
    a: "Great — the tools in our toolbox are free to use with no account required, whether or not you ever upgrade.",
  },
  {
    q: "Is there a guarantee?",
    a: "If your first three requests don't meet the brief after revisions, we'll refund the plan in full.",
  },
];

export default function PricingPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="One price. No retainer. No surprises."
        description="Everything you need to launch and grow, for a single flat fee."
        className="mx-auto"
      />

      <div className="mx-auto mt-12 max-w-lg rounded-3xl border-2 border-indigo-600 p-10 text-center shadow-xl shadow-indigo-100">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Unlimited plan</p>
        <p className="mt-4 text-5xl font-extrabold text-slate-900">{siteConfig.price}</p>
        <p className="mt-1 text-sm text-slate-500">{siteConfig.priceNote}</p>
        <LinkButton href="/solutions" size="lg" className="mt-8 w-full justify-center">
          Get started
        </LinkButton>
        <p className="mt-4 text-xs text-slate-500">30-day results guarantee. Cancel anytime — there&apos;s nothing to cancel.</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-10 sm:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">What&apos;s included</h3>
          <ul className="mt-4 space-y-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">What&apos;s not included</h3>
          <ul className="mt-4 space-y-3">
            {notIncluded.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-3xl">
        <h3 className="text-xl font-bold text-slate-900">Frequently asked questions</h3>
        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-slate-200 pb-6">
              <p className="font-semibold text-slate-900">{faq.q}</p>
              <p className="mt-2 text-sm text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
