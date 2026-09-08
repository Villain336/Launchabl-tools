import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { LinkButton } from "@/components/ui/agency-button";

export const metadata: Metadata = {
  title: "Solutions",
  description: "Everything included in the Launchable unlimited marketing & design plan.",
};

const solutions = [
  {
    name: "Brand & identity",
    summary: "Logo, visual system, brand guidelines, and voice — built once, refined as often as you need.",
    deliverables: ["Logo & mark", "Color + type system", "Brand guidelines doc", "Social profile kit"],
  },
  {
    name: "Website design & build",
    summary: "A conversion-focused site, hosted and maintained, with ongoing edits included.",
    deliverables: ["Landing pages", "Full site builds", "Ongoing edits & new pages", "Hosting included"],
  },
  {
    name: "Content & copywriting",
    summary: "Ad copy, email sequences, landing page copy, and blog content that's actually on-brand.",
    deliverables: ["Ad & landing copy", "Email sequences", "Blog & SEO content", "Product descriptions"],
  },
  {
    name: "SEO & technical marketing",
    summary: "The unglamorous fixes that actually move rankings — schema, site speed, technical audits.",
    deliverables: ["Structured data across your site", "Technical SEO audits", "Site speed fixes", "Local SEO setup"],
  },
  {
    name: "Social & campaign design",
    summary: "On-brand social templates, campaign creative, and ad variations, delivered on a queue.",
    deliverables: ["Social templates", "Ad creative variations", "Launch campaign kits", "Presentation design"],
  },
  {
    name: "Domain, hosting & setup",
    summary: "The technical setup most agencies punt back to you — we just handle it.",
    deliverables: ["Domain registration", "DNS & email setup", "Managed hosting", "SSL & security basics"],
  },
];

export default function SolutionsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="Solutions"
        title="Everything the unlimited plan covers"
        description="One flat price, one active request at a time, unlimited requests over the life of your plan. No hourly billing, no scope negotiations."
      />

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {solutions.map((solution) => (
          <div key={solution.name} className="rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900">{solution.name}</h3>
            <p className="mt-2 text-sm text-slate-600">{solution.summary}</p>
            <ul className="mt-4 space-y-2">
              {solution.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-indigo-600 p-10 text-center text-white">
        <h3 className="text-2xl font-bold">Want to try before you commit?</h3>
        <p className="mt-2 text-indigo-100">
          Every solution above has a free tool version in our toolbox — start there, no account needed.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <LinkButton href="/tools" variant="secondary">
            Explore free tools
          </LinkButton>
          <LinkButton href="/pricing" className="bg-white text-indigo-700 hover:bg-indigo-50">
            See pricing
          </LinkButton>
        </div>
      </div>
    </Container>
  );
}
