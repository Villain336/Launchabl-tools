import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getToolBySlug, siteConfig, tools, type Tool } from "@/lib/site-config";
import { MetadataRemover } from "@/components/tools/metadata-remover";
import { ImageConverter } from "@/components/tools/image-converter";
import { WatermarkGenerator } from "@/components/tools/watermark-generator";
import { BrandCreator } from "@/components/tools/brand-creator";
import { DomainAvailabilitySearch } from "@/components/tools/domain-availability-search";
import { WatermarkRemover } from "@/components/tools/watermark-remover";
import { FileConverter } from "@/components/tools/file-converter";
import { ComingSoonTool } from "@/components/tools/coming-soon-tool";
import { DnsEmailHealth } from "@/components/tools/dns-email-health";
import { BrandIdentityKit } from "@/components/tools/brand-identity-kit";
import { AdCreativeResizer } from "@/components/tools/ad-creative-resizer";
import { WhiteLabelReportBuilder } from "@/components/tools/white-label-report-builder";
import { AccessibilityChecker } from "@/components/tools/accessibility-checker";
import { SecurityHeadersChecker } from "@/components/tools/security-headers-checker";
import { SslCertificateChecker } from "@/components/tools/ssl-certificate-checker";
import { EmailFinder } from "@/components/tools/email-finder";
import { BackgroundRemover } from "@/components/tools/background-remover";
import { DemoVideoCreator } from "@/components/tools/demo-video-creator";
import { ToolChat } from "@/components/tools/tool-chat";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  const path = `/tools/${tool.slug}`;
  const title = `${tool.name} — free, no account needed`;
  return {
    title: tool.name,
    description: tool.shortDescription,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, title, description: tool.shortDescription },
    twitter: { card: "summary_large_image", title, description: tool.shortDescription },
    robots: tool.status === "coming-soon" ? { index: false, follow: true } : undefined,
  };
}

/** Schema.org data so search engines and AI answer engines can cite the tool and its FAQ directly. */
function toolJsonLd(tool: Tool) {
  const url = `${siteConfig.url}/tools/${tool.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "SoftwareApplication",
      "@id": `${url}#app`,
      name: tool.name,
      description: tool.shortDescription,
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: siteConfig.name, item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${siteConfig.url}/tools` },
        { "@type": "ListItem", position: 3, name: tool.name, item: url },
      ],
    },
  ];
  if (tool.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: tool.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

const toolUi: Record<string, ReactNode> = {
  "metadata-remover": <MetadataRemover />,
  "image-converter": <ImageConverter />,
  "qr-code-generator": <ToolChat slug="qr-code-generator" />,
  "meta-tag-generator": <ToolChat slug="meta-tag-generator" />,
  "markdown-file-generator": <ToolChat slug="markdown-file-generator" />,
  "agent-skill-generator": <ToolChat slug="agent-skill-generator" />,
  "dataset-builder": <ToolChat slug="dataset-builder" />,
  "watermark-generator": <WatermarkGenerator />,
  "schema-generator": <ToolChat slug="schema-generator" />,
  "brand-creator": <BrandCreator />,
  "domain-availability": <DomainAvailabilitySearch />,
  "ab-copy-variants": <ToolChat slug="ab-copy-variants" />,
  "watermark-remover": <WatermarkRemover />,
  "file-converter": <FileConverter />,
  "website-audit-report": <ToolChat slug="website-audit-report" />,
  "landing-page-grader": <ToolChat slug="landing-page-grader" />,
  "competitor-gap-report": <ToolChat slug="competitor-gap-report" />,
  "dns-email-health": <DnsEmailHealth />,
  "brand-identity-kit": <BrandIdentityKit />,
  "ad-creative-resizer": <AdCreativeResizer />,
  "content-campaign-calendar": <ToolChat slug="content-campaign-calendar" />,
  "local-seo-optimizer": <ToolChat slug="local-seo-optimizer" />,
  "sitemap-robots-generator": <ToolChat slug="sitemap-robots-generator" />,
  "white-label-report-builder": <WhiteLabelReportBuilder />,
  "broken-link-checker": <ToolChat slug="broken-link-checker" />,
  "canonical-tag-detector": <ToolChat slug="canonical-tag-detector" />,
  "page-speed-audit": <ToolChat slug="page-speed-audit" />,
  "backlink-health-check": <ToolChat slug="backlink-health-check" />,
  "voice-search-optimizer": <ToolChat slug="voice-search-optimizer" />,
  "compliance-scanner": <ToolChat slug="compliance-scanner" />,
  "llm-readability-check": <ToolChat slug="llm-readability-check" />,
  "email-newsletter-builder": <ToolChat slug="email-newsletter-builder" />,
  "accessibility-checker": <AccessibilityChecker />,
  "security-headers-checker": <SecurityHeadersChecker />,
  "ssl-certificate-checker": <SslCertificateChecker />,
  "email-finder": <EmailFinder />,
  "background-remover": <BackgroundRemover />,
  "demo-video-creator": <DemoVideoCreator />,
  "domain-purchase": (
    <ComingSoonTool
      architectureNotes={[
        "Route through a registrar/reseller API or affiliate partner rather than becoming a registrar directly.",
        "Reuse the availability check from the Brand Creator / Domain Availability tools as the entry point.",
        "Bundle free with the unlimited plan for the primary domain; à la carte purchase for everyone else.",
      ]}
    />
  ),
  hosting: (
    <ComingSoonTool
      architectureNotes={[
        "Partner with a managed host or reseller panel rather than operating infrastructure from scratch.",
        "Include hosting for the site we build inside the unlimited plan by default.",
        "Offer a low-cost standalone hosting SKU for tool users who aren't plan members yet.",
      ]}
    />
  ),
};

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }} />
      <ToolPageLayout tool={tool} about={<AboutCopy slug={tool.slug} />}>
        {toolUi[tool.slug] ?? (
          <ComingSoonTool architectureNotes={["This tool's build notes are being written — check back soon."]} />
        )}
      </ToolPageLayout>
    </>
  );
}

function AboutCopy({ slug }: { slug: string }) {
  const copy: Record<string, string> = {
    "metadata-remover":
      "Every photo you take carries hidden metadata — camera model, exact GPS coordinates, timestamps, sometimes even the software used to edit it. Sharing that file as-is can leak more than you intend. This tool reads and strips that metadata entirely inside your browser, so nothing about your file (or its metadata) ever touches a server.",
    "image-converter":
      "Different platforms want different image formats: WebP for fast-loading web pages, JPG for broad compatibility, PNG for transparency. This tool re-encodes your image client-side using the Canvas API, so you can move between formats without uploading anything.",
    "qr-code-generator":
      "Most QR generators give you a black square and a colour picker. This one treats the code as a design object: describe the look in plain language — brand colours, rounded or fluid modules, a gradient, room for a logo — and the designer translates it into a style you can still tweak by hand. Every change is scan-tested in your browser, so you know before printing that phones will read it. Export as SVG for print, PNG at up to 2048px, inline SVG or data URL for self-contained embeds, or a hosted image URL that works in emails, Notion, and any CMS.",
    "watermark-generator":
      "Protecting shared images — proofs, previews, social posts — starts with a visible watermark. This tool overlays text watermarks with full control over position, opacity, rotation, and tiling, and never uploads your source image.",
    "schema-generator":
      "Structured data (JSON-LD) tells search engines and AI answer engines exactly what a page is — the business, the product and its price, the article and its author, the questions it answers — instead of leaving them to guess from the text. This tool reads your page, picks the right schema.org types (often several, combined in one @graph), fills every property it can support with facts from the page, and validates the result against the required and recommended properties for each type before handing you a copy-ready script tag. Anything it couldn't know is marked as a placeholder rather than invented.",
    "brand-creator":
      "Naming a brand and checking whether the domain is actually available are usually two disconnected steps. This tool combines both: generate name and tagline ideas, then immediately see which domains are open, so you can move from idea to claimed domain in one sitting.",
    "domain-availability":
      "A fast way to check a name across the most common top-level domains before you commit to it anywhere else — social handles, business registration, or a logo.",
    "meta-tag-generator":
      "Title tags and meta descriptions are the only copy most people see before they decide whether to visit — and most are auto-generated, truncated, or identical across pages. This tool reads your page, writes a title and description grounded in what it actually says, adds the Open Graph and Twitter tags that control how the link looks when shared, and previews both the search result and the share card so you can see the cut-off risk before you publish. You also get three alternative pairs with different angles to test.",
    "markdown-file-generator":
      "Good documentation is mostly structure: the right sections in the right order, real commands in code blocks, tables where data is tabular. This tool takes a description or rough notes — or a URL to read — and produces a complete Markdown file with that structure filled in. It marks anything it can't know (licence, version, contact) as a TODO instead of inventing it, previews the rendered result, and downloads as a ready-to-commit file.",
    "agent-skill-generator":
      "Coding agents work far better with skills: small, procedural instruction files that tell them when a workflow applies, the exact steps, how to verify success, and what to avoid. Writing them well is a craft. This tool turns a plain-language description of a workflow, tool, API, or team convention into a SKILL.md that follows the conventions agents expect — front matter, triggers, prerequisites, numbered steps with commands, verification, pitfalls, examples — ready to drop into your agent's skills folder.",
    "dataset-builder":
      "Demos, seeds, import tests and small training sets all need the same thing: realistic, internally consistent tabular data with proper types. This tool builds it from a description — synthetic rows that hang together, rows extracted from a page you point it at, or messy notes normalised into columns — and gives you a typed table you can inspect, then download as CSV or JSON.",
    "ab-copy-variants":
      "Most A/B tests fail because the variants are synonyms of each other — same promise, different adjectives. This tool forces every variant onto a distinct persuasion angle (outcome, pain relief, social proof, curiosity, urgency, specificity, contrast, identity) so each one is a real hypothesis about what your audience responds to. Paste your current copy, say who it's for, and you get the variants as copyable cards plus a test plan: which metric to judge on, how much traffic you need before trusting the result, and how long to run it.",
    "watermark-remover":
      "Sometimes you need to clean up a watermark you added yourself — an old proof stamp, a placeholder mark from an earlier draft. This tool is intentionally gated behind an ownership attestation so it can't be used to strip protection from content you don't have rights to edit.",
    "file-converter":
      "Format conversion is one of the most common, most annoying small tasks in marketing work. The CSV/JSON conversion below runs entirely in your browser today; heavier document and media conversions are on the public roadmap and will run through server-side workers.",
    "domain-purchase":
      "Once you've found a domain you like, registering it shouldn't require leaving to compare five different registrars. This tool is designed to route directly to a registrar/reseller partner for checkout.",
    hosting:
      "Hosting is the step most 'launch your brand' tools quietly skip. We're building this to be bundled directly into the unlimited plan, with a standalone option for tool-only users.",
    "website-audit-report":
      "Most free 'SEO checkers' run a handful of shallow checks and gate the real results behind a signup wall. This one fetches your page server-side and runs more than twenty real checks — title and description length, heading outline, canonical, indexability, structured-data validity, Open Graph, alt text, internal links, server response time, HTML weight, compression, third-party scripts, security headers, caching — each with why it matters and the exact fix. Then it tells you, in plain language, what to fix first and which of the specialist tools on this site goes deeper on each problem.",
    "landing-page-grader":
      "SEO health and conversion-readiness are different questions. This tool grades a page the way a CRO consultant would: is there one clear promise, one obvious next step, low friction to take it, reasons to believe, and nothing in the way? It reads the headline and subheadline, counts and positions every call to action, measures form length, looks for testimonials, logos, guarantees and social-proof numbers, flags navigation and outbound-link distractions, and checks speed and mobile basics — then rewrites your hero if you ask.",
    "competitor-gap-report":
      "Most tool sites can only tell you about your own site. This one fetches up to four pages — yours and three competitors' — and puts them side by side on identical signals: audit score, content depth and structure, images and alt text, links, title and description, schema types, Open Graph, load time, page weight, scripts, third parties, security headers. It marks the leader on every row, lists where you're behind and where you lead, and surfaces the terms competitors use that your page never does — so the plan writes itself.",
    "dns-email-health":
      "If your SPF, DKIM, or DMARC records aren't configured correctly, a real percentage of your marketing emails are silently landing in spam — invisible unless you go looking. This tool runs the actual DNS lookups a developer would run by hand and explains each result in plain language.",
    "brand-identity-kit":
      "A name and a color aren't a brand kit. This tool procedurally generates a logo mark, a matching favicon, a color palette, and a suggested type pairing from your brand name, then bundles all of it into one downloadable zip — a real starter asset, not just an idea.",
    "ad-creative-resizer":
      "Every ad platform wants a different creative size, and manually cropping one image a dozen times is exactly the kind of busywork this platform exists to eliminate. Upload one master creative and download a zip with every major platform's size, correctly cropped, entirely in your browser.",
    "content-campaign-calendar":
      "A single AI-generated caption doesn't move a business forward — a plan does. This tool turns your business, audience, goal and realistic publishing capacity into a dated, multi-channel calendar built on content pillars and, where it fits, a campaign arc. Every entry has a real hook, a brief with the angle and proof to include, a CTA matched to its funnel stage, and deliberate repurposing across channels. Filter by channel, expand any entry, and export as CSV for Notion or Sheets, ICS for your calendar, or JSON.",
    "local-seo-optimizer":
      "Local SEO is more than one Google Business Profile description. From a short description of the business — or its website — this tool drafts the whole local presence: the GBP description and real category names, services with descriptions, the local search phrases customers type, seeded Q&A, review responses for positive, negative and mixed reviews, a month of GBP posts, review-request SMS and email, LocalBusiness JSON-LD built from the profile, and a ten-step launch checklist. Everything is grounded in what you told it; anything it couldn't know is flagged.",
    "sitemap-robots-generator":
      "A generic sitemap generator gives you a boilerplate file. This one crawls your site from the homepage — following real links, same host only, a couple of levels deep — and leaves out anything that redirects, errors or is marked noindex, so what you submit to Google is what's actually live. The matching robots.txt can exclude whole sections and, if you want, block AI training crawlers while leaving AI search crawlers alone so the site can still be cited. Ask for changes in plain language and it re-crawls with the new rules.",
    "white-label-report-builder":
      "This is the one tool on the platform that's explicitly built to combine the output of the others. Paste in findings from the Website Audit Report, Competitor Gap Report, or your own notes, add your agency's branding, and generate a polished, printable report or proposal — the exact kind of deliverable a freelancer or agency would otherwise pay a designer to lay out.",
    "broken-link-checker":
      "A single dead link can quietly tank a landing page's conversion rate and its SEO. This scans the links on a page you provide and checks each one's live status, so you find the 404s before your customers — or Google — do.",
    "accessibility-checker":
      "Accessibility is treated as an afterthought by most marketing sites, and it's a real legal and reputational risk, not just a nice-to-have. This runs a fast static scan for the most common, most damaging accessibility gaps — missing alt text, skipped heading levels, disabled pinch-to-zoom — and explains why each one matters.",
    "security-headers-checker":
      "HTTP security headers are a five-minute fix that most marketing sites simply never make. This checks whether your site sends the headers that defend against clickjacking, MIME-sniffing attacks, and script injection, and explains exactly what each missing header exposes you to.",
    "ssl-certificate-checker":
      "An expired SSL certificate takes your entire site offline behind a scary browser warning — and it always happens at the worst time. This opens a real TLS connection to your domain, the same way a browser does, and reports the issuer, expiry date, and days remaining.",
    "email-finder":
      "Finding a specific person's work email usually means guessing at a pattern and hoping. This generates every common pattern for a name at a domain, ranks them by how common each convention is, and confirms the domain itself can receive mail — a real research step, not a guarantee.",
    "background-remover":
      "Clean product shots and headshots usually mean a trip to Photoshop or a paid app. This runs a real image-segmentation model entirely on your device — no upload, no account, no watermark — and hands back a transparent PNG in seconds.",
    "demo-video-creator":
      "A raw, unbranded screen recording looks unfinished the moment you share it. This records your screen (and optionally your mic), composites a branded watermark onto every frame in real time, and exports a ready-to-share video file — no separate editing software required.",
  };

  return <p>{copy[slug] ?? "More detail on this tool is coming soon."}</p>;
}
