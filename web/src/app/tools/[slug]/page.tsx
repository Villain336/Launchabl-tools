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
import { BrandIdentityKit } from "@/components/tools/brand-identity-kit";
import { AdCreativeResizer } from "@/components/tools/ad-creative-resizer";
import { WhiteLabelReportBuilder } from "@/components/tools/white-label-report-builder";
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
  const title = `${tool.name} — free, first run without an account`;
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
  "dns-email-health": <ToolChat slug="dns-email-health" />,
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
  "accessibility-checker": <ToolChat slug="accessibility-checker" />,
  "security-headers-checker": <ToolChat slug="security-headers-checker" />,
  "ssl-certificate-checker": <ToolChat slug="ssl-certificate-checker" />,
  "email-finder": <ToolChat slug="email-finder" />,
  "ai-image-generator": <ToolChat slug="ai-image-generator" />,
  "social-card-generator": <ToolChat slug="social-card-generator" />,
  "utm-builder": <ToolChat slug="utm-builder" />,
  "persona-generator": <ToolChat slug="persona-generator" />,
  "subject-line-checker": <ToolChat slug="subject-line-checker" />,
  "press-release-generator": <ToolChat slug="press-release-generator" />,
  "qa-test-plan-generator": <ToolChat slug="qa-test-plan-generator" />,
  "content-repurposer": <ToolChat slug="content-repurposer" />,
  transcriber: <ToolChat slug="transcriber" />,
  "clip-finder": <ToolChat slug="clip-finder" />,
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
      "If SPF, DKIM or DMARC are wrong, a real share of your email lands in spam — silently — and since 2024 Gmail and Yahoo simply reject bulk mail from domains without them. This tool runs the lookups a deliverability engineer would: MX and provider, a single valid SPF with the right qualifier and a lookup count that includes nested includes, DMARC policy, percentage, reporting address and subdomain policy, DKIM across the selectors common providers use (or the one you name), plus MTA-STS, TLS-RPT and BIMI. Then it writes the exact records to publish and the safe path from p=none to p=reject.",
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
      "Accessibility is a legal exposure (ADA, the European Accessibility Act, AODA) and a conversion problem: an unlabeled form field means some visitors literally can't sign up. This runs a WCAG 2.2 A/AA pass over the page's HTML — language and title, blocked zoom, heading outline and landmarks, alt text and its quality, form labels, buttons and links with no accessible name, iframes, media, tab order, removed focus outlines, duplicate ids — and lists the actual offending elements so a developer can fix them today. It's honest about what a static scan can't measure (contrast, focus order, live ARIA state) and tells you how to check those.",
    "security-headers-checker":
      "Most header checkers count which headers exist. This one grades whether they'd actually stop anything: a Content-Security-Policy full of 'unsafe-inline' isn't protection, a 60-day HSTS isn't either. It checks HTTPS and the HTTP redirect, HSTS age and scope, CSP quality and missing directives, framing protection, MIME sniffing, Referrer-Policy value, Permissions-Policy, cross-origin isolation, cookie flags and version leaks — then writes the header configuration for your stack (Next.js, Vercel, Netlify, nginx, Apache, Express, Cloudflare) with CSP rolled out safely as report-only first.",
    "ssl-certificate-checker":
      "An expired or misconfigured certificate puts a full-page warning between you and every visitor, and it always happens at the worst time. This opens a real TLS connection the way a browser does and reports what a browser won't: trust and the exact reason if it fails, days to expiry with Let's Encrypt renewal context, whether the full chain is served, key type and size, which names the certificate covers (including your www or apex twin), the negotiated protocol and cipher, whether TLS 1.0/1.1 are still accepted, and whether HTTP redirects to HTTPS with HSTS.",
    "email-finder":
      "Paid email finders charge per lookup for data that is mostly public. This one generates every common corporate pattern for a name, then reads the company's own homepage, contact, about and team pages to discover the pattern it actually uses and any role addresses it publishes — and confirms the domain has a mail server. Candidates are ranked by confidence with the reason shown. It never claims a mailbox exists; it gives you the best guess, the fallbacks, and a way to verify cheaply.",
    "ai-image-generator":
      "Most image tools hand you a text box and leave the prompt engineering to you. Here an art director sits in between: you describe the job — a hero for a fintech landing page, an ad for a running shoe, a header for a post about remote work — and it writes the full brief (subject, style, lighting, palette, composition for the aspect ratio) before rendering. Images come back in the ratio the channel needs, re-encoded small enough to use as-is, with WebP and PNG downloads and the prompt saved so you can iterate.",
    "social-card-generator":
      "The link preview is the first thing most people see of a page, and most sites ship a blurry logo or nothing. This designs the card as a real layout — headline, subtitle, badge, brand mark and domain typeset exactly, in your colours — and renders it in every size that matters: 1200×630 for og:image, 1600×900 for X, 1080×1080 for feeds, 1080×1920 for stories. Text stays editable in the card, so a fix is a keystroke, not another generation. When a backdrop would help, the image model paints one behind the type.",
    "utm-builder":
      "Most UTM builders tag one link at a time and let you type whatever you like — which is how one campaign becomes 'LinkedIn', 'linkedin' and 'Linkedin' in the report. This one builds the whole set for a campaign at once from the placements you describe, normalises every value to the convention analytics teams enforce (lowercase, underscores, the GA4 medium taxonomy), preserves the query string your destination already has, replaces stale tags, flags duplicates and non-standard mediums that GA4 would file under Unassigned, and gives you a CSV for the shared sheet.",
    "persona-generator":
      "Most persona templates produce a stock photo and a list of hobbies. This one starts with the ideal customer profile — observable firmographics, qualifiers and disqualifiers a salesperson could check — then builds the personas the way buying actually happens at your price point: a self-serve tool has a user who is the buyer; an enterprise platform has a champion, a decision-maker and a budget-holder. Every persona carries the pains in their own words, real buying triggers, objections with honest answers, the channels they trust, the vocabulary to use and avoid, the proof that convinces them, and a success metric. An anti-persona tells you who to turn away, and the notes list what to validate in your next customer interviews.",
    "subject-line-checker":
      "Open rates live or die in about 41 characters on a phone. This scores subject lines deterministically — length and mobile cut-off, word count, all-caps and punctuation runs, emoji, the trigger vocabulary filters and readers have learned to distrust, fake RE:/FWD:, generic phrasing, and whether the preview text extends the promise or repeats it — and shows exactly where the inbox truncates each line. Then the assistant writes alternatives on different mechanisms (benefit, question, curiosity, specific number, personalisation) and scores them too, so you leave with two candidates worth testing rather than a synonym of what you had.",
    "press-release-generator":
      "Journalists delete releases that bury the news, hype the product, and quote executives who are 'excited to announce'. This writes to the standard they expect: a factual headline under 100 characters, a dateline, a lede that answers who, what, when, where and why in three sentences, body paragraphs in descending importance, one to three quotes with a point of view, an About boilerplate, a media contact and the closing ###. The server assembles Markdown and plain text, counts words, and runs newsroom checks — headline length and tone, word count, lede clarity, quote substance, placeholders — before you send it.",
    "qa-test-plan-generator":
      "Shipping without a plan means your customers do the testing. This turns a feature description, a spec or a live URL into a plan anyone can execute today: scenarios grouped by area with stable ids, priorities that mean something (P0 blocks release), imperative steps with specific test data, expected results you can judge pass or fail, negative and edge cases, an accessibility pass, a device and browser matrix, exit criteria and risks with mitigations. It warns when a plan has no P0s or no edge cases, filters by area and priority, and exports to CSV for your tracker or Markdown with pass/fail checkboxes.",
    "content-repurposer":
      "The article took a day; the distribution usually gets ten minutes and a pasted link. This reads the piece — from a URL or pasted text — extracts the argument, key points and quotable lines, and rewrites it natively for each channel: a LinkedIn post whose first line earns the 'see more', an X thread where every tweet stands alone, a newsletter section, an Instagram caption, a YouTube description, a spoken short-video script, quote cards. Every piece is checked against the channel's character limits and reach killers (a link in the LinkedIn body, a tweet over 280), with a suggested visual and posting time, and a copy button per piece.",
    transcriber:
      "Transcription services hand you a wall of text and leave the reading to you. This runs Whisper with segment timestamps, then an editor reads the entire recording — every window of a two-hour webinar, not the first ten minutes — and returns what the team actually needs: a title from the content, a summary, chapters at real topic changes, takeaways in the speaker's words, quotes checked word-for-word against the transcript (and flagged if they aren't), action items when it's a meeting, and the full transcript with [m:ss] markers. Downloads cover TXT, SRT and VTT captions and a Markdown brief. Audio is discarded after transcription.",
    "clip-finder":
      "Clip tools that pick 'viral moments' by keyword produce clips that start mid-sentence and end before the point. This one reads the whole transcript with timestamps and chooses like a producer: self-contained moments with a hook and a payoff, cut on sentence boundaries, sized for the platform. Every clip ships with the exact range, a hook line, a platform-native caption, the words spoken, a re-timed SRT and a lossless ffmpeg command, and the server flags anything too short, too long, overlapping or silent — so the editor can cut the set in minutes instead of scrubbing an hour of tape.",
    "background-remover":
      "Clean product shots and headshots usually mean a trip to Photoshop or a paid app. This runs a real image-segmentation model entirely on your device — no upload, no account, no watermark — and hands back a transparent PNG in seconds.",
    "demo-video-creator":
      "A raw, unbranded screen recording looks unfinished the moment you share it. This records your screen (and optionally your mic), composites a branded watermark onto every frame in real time, and exports a ready-to-share video file — no separate editing software required.",
  };

  return <p>{copy[slug] ?? "More detail on this tool is coming soon."}</p>;
}
