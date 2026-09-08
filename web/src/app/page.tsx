import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { ToolStatusBadge } from "@/components/ui/badge";
import { siteConfig, toolClusters, tools } from "@/lib/site-config";

const featuredToolSlugs = [
  "brand-creator",
  "metadata-remover",
  "schema-generator",
  "qr-code-generator",
  "watermark-generator",
  "image-converter",
];

const heavyToolSlugs = [
  "website-audit-report",
  "competitor-gap-report",
  "dns-email-health",
  "brand-identity-kit",
  "ad-creative-resizer",
  "white-label-report-builder",
];

const proof = [
  { stat: "12+", label: "flagship tools, and growing every month" },
  { stat: "1", label: "flat price — no retainers, no surprise invoices" },
  { stat: "0", label: "files ever leave your browser on client-side tools" },
];

export default function Home() {
  const featured = tools.filter((t) => featuredToolSlugs.includes(t.slug));
  const heavy = tools.filter((t) => heavyToolSlugs.includes(t.slug));

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
        <Container className="py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700">
              <Sparkles className="h-4 w-4" /> Free tools. Unlimited agency. One price.
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
              The marketing platform with a free toolbox and an unlimited agency behind it
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              {siteConfig.description}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <LinkButton href="/tools" size="lg">
                Try a free tool <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/pricing" variant="secondary" size="lg">
                See the unlimited plan
              </LinkButton>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No account required to use the tools. No credit card to look around.
            </p>
          </div>

          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
            {proof.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <dt className="text-3xl font-bold text-indigo-600">{item.stat}</dt>
                <dd className="mt-2 text-sm text-slate-600">{item.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="border-t border-slate-100 bg-white py-20">
        <Container>
          <SectionHeading
            eyebrow="The toolbox"
            title="Flagship tools, organized by what you're actually trying to do"
            description="Not a dumping ground of 40 unrelated converters — every tool lives inside one of four outcome clusters, and every tool ends with a next step, not a dead end."
          />

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-200 p-6 transition-all hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">{tool.name}</h3>
                  <ToolStatusBadge status={tool.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{tool.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                  Open tool <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <LinkButton href="/tools" variant="secondary">
              See all tools
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-100 bg-slate-900 py-20 text-white">
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">
              Tools other sites won&apos;t build
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Real audits, kits, and reports — not another file converter
            </h2>
            <p className="mt-4 text-lg text-slate-300">
              Anyone can clone a QR generator. A tool that fetches a real URL, applies judgment,
              and hands back a scored, multi-part deliverable is a different kind of product —
              and it&apos;s the exact expertise the unlimited plan is built on.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {heavy.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group flex flex-col rounded-2xl border border-slate-700 bg-slate-800/50 p-6 transition-all hover:border-indigo-400 hover:bg-slate-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white group-hover:text-indigo-300">{tool.name}</h3>
                  <ToolStatusBadge status={tool.status} />
                </div>
                <p className="mt-2 text-sm text-slate-300">{tool.shortDescription}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-300">
                  Open tool <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <LinkButton href="/tools#audits-reports" variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100">
              See all audits, kits & reports
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-100 bg-slate-50 py-20">
        <Container>
          <SectionHeading
            eyebrow="How it's organized"
            title="Four clusters. One connective thread."
            description="Every tool in a cluster feeds the next step in the same job — and every job connects back to what our unlimited plan handles end-to-end."
          />
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {toolClusters.map((cluster) => (
              <div key={cluster.slug} id={cluster.slug} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">{cluster.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{cluster.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-100 bg-white py-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="The unlimited plan"
              title="One flat price. Unlimited marketing requests. No retainer."
              description={`${siteConfig.price} once — ${siteConfig.priceNote}. Submit as many requests as you want; we work through them one at a time so quality never drops.`}
            />
            <ul className="mt-8 space-y-3">
              {[
                "Brand, web, and content design requests — unlimited, queued transparently",
                "Domain + hosting included for your primary site",
                "Technical SEO fixes across your whole site, not just one page",
                "Cancel isn't a thing you need — it's a one-time price",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <LinkButton href="/pricing" size="lg">
                See what&apos;s included <ArrowRight className="h-4 w-4" />
              </LinkButton>
            </div>
          </div>
          <div className="rounded-3xl bg-slate-900 p-10 text-white">
            <p className="text-sm font-medium text-indigo-300">Why unlimited works</p>
            <p className="mt-4 text-xl font-semibold leading-relaxed">
              &ldquo;One request in the queue at a time keeps quality high. A flat price up front
              keeps trust high. That combination is the entire business model.&rdquo;
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-300 hover:text-indigo-200">
              Read our philosophy <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
