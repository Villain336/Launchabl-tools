import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getToolBySlug, tools } from "@/lib/site-config";
import { MetadataRemover } from "@/components/tools/metadata-remover";
import { ImageConverter } from "@/components/tools/image-converter";
import { WatermarkGenerator } from "@/components/tools/watermark-generator";
import { SchemaGenerator } from "@/components/tools/schema-generator";
import { BrandCreator } from "@/components/tools/brand-creator";
import { DomainAvailabilitySearch } from "@/components/tools/domain-availability-search";
import { Copywriter } from "@/components/tools/copywriter";
import { WatermarkRemover } from "@/components/tools/watermark-remover";
import { FileConverter } from "@/components/tools/file-converter";
import { ComingSoonTool } from "@/components/tools/coming-soon-tool";
import { WebsiteAuditReport } from "@/components/tools/website-audit-report";
import { LandingPageGrader } from "@/components/tools/landing-page-grader";
import { CompetitorGapReport } from "@/components/tools/competitor-gap-report";
import { DnsEmailHealth } from "@/components/tools/dns-email-health";
import { BrandIdentityKit } from "@/components/tools/brand-identity-kit";
import { AdCreativeResizer } from "@/components/tools/ad-creative-resizer";
import { ContentCampaignCalendar } from "@/components/tools/content-campaign-calendar";
import { LocalSeoOptimizer } from "@/components/tools/local-seo-optimizer";
import { SitemapRobotsGenerator } from "@/components/tools/sitemap-robots-generator";
import { WhiteLabelReportBuilder } from "@/components/tools/white-label-report-builder";
import { BrokenLinkChecker } from "@/components/tools/broken-link-checker";
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
  return { title: tool.name, description: tool.shortDescription };
}

const toolUi: Record<string, ReactNode> = {
  "metadata-remover": <MetadataRemover />,
  "image-converter": <ImageConverter />,
  "qr-code-generator": <ToolChat slug="qr-code-generator" />,
  "watermark-generator": <WatermarkGenerator />,
  "schema-generator": <SchemaGenerator />,
  "brand-creator": <BrandCreator />,
  "domain-availability": <DomainAvailabilitySearch />,
  "ab-copy-variants": <ToolChat slug="ab-copy-variants" />,
  copywriter: <Copywriter />,
  "watermark-remover": <WatermarkRemover />,
  "file-converter": <FileConverter />,
  "website-audit-report": <WebsiteAuditReport />,
  "landing-page-grader": <LandingPageGrader />,
  "competitor-gap-report": <CompetitorGapReport />,
  "dns-email-health": <DnsEmailHealth />,
  "brand-identity-kit": <BrandIdentityKit />,
  "ad-creative-resizer": <AdCreativeResizer />,
  "content-campaign-calendar": <ContentCampaignCalendar />,
  "local-seo-optimizer": <LocalSeoOptimizer />,
  "sitemap-robots-generator": <SitemapRobotsGenerator />,
  "white-label-report-builder": <WhiteLabelReportBuilder />,
  "broken-link-checker": <BrokenLinkChecker />,
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
    <ToolPageLayout tool={tool} about={<AboutCopy slug={tool.slug} />}>
      {toolUi[tool.slug] ?? (
        <ComingSoonTool architectureNotes={["This tool's build notes are being written — check back soon."]} />
      )}
    </ToolPageLayout>
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
      "Structured data (JSON-LD) tells search engines exactly what's on your page — your business details, your product pricing, your FAQ content — in a format they can parse with certainty instead of guessing from page text. This generator builds valid schema for the most common page types.",
    "brand-creator":
      "Naming a brand and checking whether the domain is actually available are usually two disconnected steps. This tool combines both: generate name and tagline ideas, then immediately see which domains are open, so you can move from idea to claimed domain in one sitting.",
    "domain-availability":
      "A fast way to check a name across the most common top-level domains before you commit to it anywhere else — social handles, business registration, or a logo.",
    "ab-copy-variants":
      "Most A/B tests fail because the variants are synonyms of each other — same promise, different adjectives. This tool forces every variant onto a distinct persuasion angle (outcome, pain relief, social proof, curiosity, urgency, specificity, contrast, identity) so each one is a real hypothesis about what your audience responds to. Paste your current copy, say who it's for, and you get the variants as copyable cards plus a test plan: which metric to judge on, how much traffic you need before trusting the result, and how long to run it.",
    copywriter:
      "Structured copy templates for the formats marketers write over and over: ad headlines, landing page heroes, product blurbs, and email subject lines. Pick a format, describe your brand and offer, and get several usable variations back instantly.",
    "watermark-remover":
      "Sometimes you need to clean up a watermark you added yourself — an old proof stamp, a placeholder mark from an earlier draft. This tool is intentionally gated behind an ownership attestation so it can't be used to strip protection from content you don't have rights to edit.",
    "file-converter":
      "Format conversion is one of the most common, most annoying small tasks in marketing work. The CSV/JSON conversion below runs entirely in your browser today; heavier document and media conversions are on the public roadmap and will run through server-side workers.",
    "domain-purchase":
      "Once you've found a domain you like, registering it shouldn't require leaving to compare five different registrars. This tool is designed to route directly to a registrar/reseller partner for checkout.",
    hosting:
      "Hosting is the step most 'launch your brand' tools quietly skip. We're building this to be bundled directly into the unlimited plan, with a standalone option for tool-only users.",
    "website-audit-report":
      "Most free 'SEO checkers' run a handful of shallow checks and gate the real results behind a signup wall. This one fetches your actual page server-side and scores it across ten real technical and SEO signals — title, meta description, mobile viewport, structured data, image accessibility, and more — with a full explanation for every result, free.",
    "landing-page-grader":
      "SEO health and conversion-readiness are different questions. This tool reuses the same fetch as the Website Audit Report but grades a completely different set of signals — calls to action, lead-capture forms, trust signals, and page speed — because a page can rank fine and still fail to convert a single visitor.",
    "competitor-gap-report":
      "Most tool sites can only tell you about your own site. This one holds up to four sites — yours and three competitors' — side by side on the same signals, so you can see exactly where you're ahead and where you're behind, at a glance.",
    "dns-email-health":
      "If your SPF, DKIM, or DMARC records aren't configured correctly, a real percentage of your marketing emails are silently landing in spam — invisible unless you go looking. This tool runs the actual DNS lookups a developer would run by hand and explains each result in plain language.",
    "brand-identity-kit":
      "A name and a color aren't a brand kit. This tool procedurally generates a logo mark, a matching favicon, a color palette, and a suggested type pairing from your brand name, then bundles all of it into one downloadable zip — a real starter asset, not just an idea.",
    "ad-creative-resizer":
      "Every ad platform wants a different creative size, and manually cropping one image a dozen times is exactly the kind of busywork this platform exists to eliminate. Upload one master creative and download a zip with every major platform's size, correctly cropped, entirely in your browser.",
    "content-campaign-calendar":
      "A single AI-generated caption doesn't move a business forward — a plan does. This tool generates a full multi-week, multi-channel content calendar tailored to your stated goal, exportable as a CSV that drops straight into whatever planning tool you already use.",
    "local-seo-optimizer":
      "Local SEO is more than one Google Business Profile description. This tool generates the full first draft of a local presence: your GBP description, suggested categories for your industry, common Q&A starters, and review response templates for both positive and negative reviews.",
    "sitemap-robots-generator":
      "A generic sitemap generator gives you a boilerplate file. This one builds a real `sitemap.xml` and matching `robots.txt` from the actual list of URLs on your site, so what you submit to Google is what's actually live.",
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
