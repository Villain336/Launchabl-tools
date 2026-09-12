export const siteConfig = {
  name: "Launchabl",
  url: "https://launchabl.io",
  tagline: "Free website audit. Unlimited marketing & design for $1,200. Forever.",
  description:
    "Launchabl is the marketing platform where the tools are free forever, every plan starts with a free website audit, and the agency is unlimited for life — brand, website, content, and SEO — for a single $1,200 flat fee, no retainers.",
  price: "$1,200",
  /** Numeric form for structured data (schema.org Offer.price expects a bare number string). */
  priceNumeric: "1200",
  priceNote: "one-time · lifetime access · no monthly retainer",
  /** The lead-in offer ahead of the paid plan — a real audit from the tool already built, not a lead-gen gimmick. */
  freeAudit: {
    name: "Free Website Audit",
    price: "$0",
    note: "no account required for your first run",
    description:
      "A 20+ point technical and on-page SEO audit, scored and explained, with the exact fix for every issue — see precisely what's costing you rankings and conversions before you spend a dollar.",
    href: "/tools/website-audit-report",
    cta: "Get your free audit",
  },
  guarantee: "30-day money-back guarantee if your first three requests don't land after revisions.",
};

export type NavLink = {
  label: string;
  href: string;
};

export const primaryNav: NavLink[] = [
  { label: "Agent", href: "/agent" },
  { label: "Tools", href: "/tools" },
  { label: "Solutions", href: "/solutions" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export type ToolStatus = "live" | "beta" | "coming-soon";

export type Tool = {
  slug: string;
  name: string;
  shortDescription: string;
  status: ToolStatus;
  processing: "client" | "server" | "partner";
  upsell: {
    headline: string;
    body: string;
  };
  faq: { question: string; answer: string }[];
};

export const tools: Tool[] = [
  {
    slug: "brand-creator",
    name: "Brand Creator",
    shortDescription:
      "Generate name ideas, a starter palette, and check domain availability in one flow.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Need a full brand system, not just a name?",
      body: "Launchabl unlimited plan members get a complete visual identity, logo files, and a launch-ready website built around this name — included, forever.",
    },
    faq: [
      {
        question: "Does the domain check show real availability?",
        answer:
          "The demo check runs a lightweight lookup so you can try the flow. Production wires this into a registrar/reseller API for real-time, purchasable availability — see the tool architecture notes in the code.",
      },
      {
        question: "Can I trust the name suggestions are unique?",
        answer:
          "Always run a trademark search before committing to a name. This tool is a starting point for ideation, not legal clearance.",
      },
    ],
  },
  {
    slug: "domain-availability",
    name: "Domain Availability",
    shortDescription: "Search a name across the common TLDs and see, from the registries themselves, what's open to register.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "We'll handle the whole setup.",
      body: "Unlimited plan members get domain registration, DNS, and hosting configured for them — zero technical setup required.",
    },
    faq: [
      {
        question: "Who do you register domains through?",
        answer:
          "Availability comes from the registries via RDAP. When a name is open, you get direct checkout links to cost-plus registrars (Cloudflare Registrar, Porkbun) — purchases go through them, not through Launchabl. The Domain Purchase tool adds a recommendation, pricing and the post-purchase checklist.",
      },
    ],
  },
  {
    slug: "domain-purchase",
    name: "Domain Purchase",
    shortDescription: "Check candidates live against the registries, get a recommendation with pricing, registrar checkout links and the post-purchase setup checklist.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Included free with the unlimited plan.",
      body: "Domain registration and renewal for your primary domain is included for the life of your plan.",
    },
    faq: [
      {
        question: "Do you sell domains directly?",
        answer:
          "Not yet. The tool checks availability against the registries (RDAP) and links you to checkout at cost-plus registrars — Cloudflare, Porkbun, Namecheap, Squarespace — so you pay wholesale-ish prices with no markup from us. Unlimited plan members get their primary domain registered and managed for them.",
      },
      {
        question: "How accurate is the availability check?",
        answer:
          "For TLDs that publish RDAP (.com, .net, .org, .io, .ai, .app, .dev and most others) the answer comes straight from the registry and is authoritative at the moment of checking. A handful of country-code TLDs don't publish RDAP; for those the tool falls back to DNS and tells you it's a heuristic.",
      },
      {
        question: "Are the prices exact?",
        answer:
          "They're typical first-year and renewal ranges at cost-plus registrars, maintained by us. Registrars change promos often, and premium names carry registry-set prices, so confirm at checkout.",
      },
    ],
  },
  {
    slug: "hosting",
    name: "Hosting",
    shortDescription: "Get a hosting recommendation for your stack, traffic and budget — plan, cost, deploy steps and paste-ready DNS records.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Hosting is included, not extra.",
      body: "Every unlimited plan includes managed hosting for the site we build you — no separate hosting bill to juggle.",
    },
    faq: [
      {
        question: "Do you host sites yourselves?",
        answer:
          "For unlimited plan members, yes — hosting for the site we build is included. For everyone else this tool recommends the right provider from a curated catalog (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Render, Railway, Fly, DigitalOcean, Hetzner + Coolify, Kinsta, WP Engine, Hostinger, Webflow, Framer, Squarespace, Shopify) and gives you everything needed to set it up.",
      },
      {
        question: "Can it look at my existing site?",
        answer:
          "Yes. Give it the URL and it reads the response headers and HTML to detect the framework, CMS, current host and CDN, then recommends with a migration path that avoids downtime.",
      },
      {
        question: "Where do the DNS records come from?",
        answer:
          "From a maintained knowledge base of each provider's documented records, filled in with your domain. Values shown in braces — like a server IP or project subdomain — come from the provider's dashboard after you create the project.",
      },
    ],
  },
  {
    slug: "ab-copy-variants",
    name: "A/B Copy Variant Generator",
    shortDescription:
      "Paste a headline, hero, ad, or CTA and get distinct variants — each on a different persuasion angle — with a plan to test them.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Want someone to run the test for you?",
      body: "Unlimited plan members get a conversion strategist who sets up the experiment, watches the numbers, and ships the winner.",
    },
    faq: [
      {
        question: "How is this different from asking a generic chatbot?",
        answer:
          "Every variant is forced onto a different persuasion angle (outcome, social proof, urgency, specificity…) so you're testing real hypotheses instead of synonyms. You also get a test plan with the metric, traffic guidance, and run length.",
      },
      {
        question: "Do I need an account?",
        answer:
          "No. The tool is free with a fair-use limit per visitor. Nothing you paste is stored after the response is generated.",
      },
      {
        question: "Which AI model powers it?",
        answer:
          "Requests route through Vercel AI Gateway to the best available model for copywriting, with automatic fallback if a model is busy. The model that answered is shown under each response.",
      },
    ],
  },
  {
    slug: "watermark-generator",
    name: "Watermark Generator",
    shortDescription: "Stamp a text or logo watermark onto your images with full control.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Protecting one image at a time?",
      body: "Unlimited plan members get automatic watermarking across their entire media library, plus a licensed usage policy drafted for their site.",
    },
    faq: [
      {
        question: "Do my images get uploaded anywhere?",
        answer:
          "No. Watermarking happens entirely in your browser using the Canvas API — your files never leave your device.",
      },
    ],
  },
  {
    slug: "watermark-remover",
    name: "Watermark Remover",
    shortDescription: "Remove a watermark you own the rights to — box it, pick smooth fill, blur or pixelate, done in your browser.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "For your own assets, done right.",
      body: "This tool is intentionally limited to content you attest you own or have explicit rights to edit — see our Acceptable Use Policy. Unlimited plan members can send us original source files for a clean re-export instead.",
    },
    faq: [
      {
        question: "Can I use this to remove a stock photo's watermark?",
        answer:
          "No. This tool requires an ownership attestation and is intended only for content you created or control. Using it on licensed stock or third-party copyrighted content violates our Acceptable Use Policy and likely the law.",
      },
      {
        question: "How does the removal work?",
        answer:
          "You drag a box over each mark. Smooth fill runs a multi-scale diffusion inpaint that blends surrounding colour into the box — near-perfect on flat backgrounds, skies and gradients. Blur and pixelate are there for marks over detailed textures where a smeared fill would look worse than an honest censor block. Everything happens in your browser via the Canvas API.",
      },
    ],
  },
  {
    slug: "metadata-remover",
    name: "Metadata Remover",
    shortDescription: "Strip EXIF, GPS, and hidden metadata from your images before you share them.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "One file is easy. A whole site is the hard part.",
      body: "Unlimited plan members get a full privacy/data-leak audit of their site and marketing assets, not just one file at a time.",
    },
    faq: [
      {
        question: "Do you ever see or store my files?",
        answer:
          "No. Metadata is read and stripped entirely in your browser. Nothing is uploaded to a server.",
      },
      {
        question: "What metadata actually gets removed?",
        answer:
          "EXIF (camera model, GPS coordinates, timestamps), IPTC, and XMP blocks embedded in the image file. Pixel data is untouched.",
      },
    ],
  },
  {
    slug: "schema-generator",
    name: "Schema Markup Generator",
    shortDescription: "Paste a URL and get validated JSON-LD for the page — Organization, LocalBusiness, Product, Article, FAQ, Event and more.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "One snippet is a start. Full technical SEO is the win.",
      body: "Unlimited plan members get a full technical SEO audit and every page on their site fitted with the right schema — not just one snippet.",
    },
    faq: [
      {
        question: "Where do I put the generated code?",
        answer:
          "Copy the <script type=\"application/ld+json\"> snippet and paste it inside your page's <head> (or anywhere in the body), or use your CMS's structured data field. One script per page is fine, even with several types combined in @graph.",
      },
      {
        question: "How do I know if it's valid?",
        answer:
          "The tool parses the JSON and checks the required and recommended properties for every schema.org type it generated, flagging placeholders and relative URLs. Confirm eligibility for rich results with Google's Rich Results Test before publishing.",
      },
      {
        question: "Does it invent details?",
        answer:
          "No. It uses facts from the page you give it or from your description. Anything it can't know — a phone number, a date, a price — is inserted as a clearly marked placeholder and listed for you to replace.",
      },
    ],
  },
  {
    slug: "file-converter",
    name: "File Converter",
    shortDescription:
      "Convert data files (CSV, TSV, JSON, YAML, Markdown, HTML tables), re-encode images, extract audio and turn Markdown into a styled HTML page — all in your browser.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Batch conversions, zero limits.",
      body: "Unlimited plan members get bulk conversion with no file-count or file-size caps.",
    },
    faq: [
      {
        question: "Do my files get uploaded?",
        answer:
          "No. Every conversion runs in your browser — data files are parsed in memory, images are re-encoded with the Canvas API and audio is decoded with the Web Audio API. Nothing is sent to a server.",
      },
      {
        question: "Which formats are supported?",
        answer:
          "Data: CSV, TSV, JSON, NDJSON, Markdown tables, YAML and HTML tables in any direction. Images: PNG, JPEG and WebP with resizing. Audio/video: extract the audio track from an MP4, WebM, MP3 or WAV file as WAV. Text: Markdown to a standalone HTML page.",
      },
      {
        question: "What about Word, Excel and PowerPoint?",
        answer:
          "Export to CSV, Markdown or HTML from those apps and convert here. Native .docx/.xlsx/.pptx conversion is on the roadmap.",
      },
    ],
  },
  {
    slug: "image-converter",
    name: "Image Converter",
    shortDescription: "Convert between PNG, JPG, and WebP right in your browser — no upload required.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Need every image on your site optimized?",
      body: "Unlimited plan members get automated image optimization across their entire site as part of ongoing performance work.",
    },
    faq: [
      {
        question: "Is there a file size limit?",
        answer:
          "Conversion happens in your browser, so the practical limit is your device's memory rather than a server-side cap.",
      },
    ],
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortDescription:
      "Describe the look you want and get a styled QR code that still scans — shapes, gradients, logo space, then SVG, PNG, or a hosted embed.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Static codes are just the start.",
      body: "Unlimited plan members get dynamic QR codes with scan analytics and the ability to change the destination link after printing.",
    },
    faq: [
      {
        question: "Do these QR codes expire?",
        answer:
          "No — these are static codes. They point directly at your link forever, with no tracking, no redirect, and no expiry. The hosted embed link re-renders the same static code on request.",
      },
      {
        question: "Will a styled code still scan?",
        answer:
          "Every design is run through a scan check in your browser before you download it, and the designer warns about low contrast, oversized logos, or missing quiet zones. Codes use error correction level H by default so a logo can cover the centre.",
      },
      {
        question: "What happens to my link and logo?",
        answer:
          "Your description and link go to our AI model to pick a style; the code itself is rendered in your browser. Your logo never leaves your device — it's composited locally and isn't part of the hosted embed.",
      },
    ],
  },

  {
    slug: "meta-tag-generator",
    name: "Meta Tag Generator",
    shortDescription:
      "Paste a URL and get a click-worthy title, description, and full Open Graph / Twitter tag set — with search and share previews.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Tags are one page. Rankings are the whole site.",
      body: "Unlimited plan members get a full technical SEO pass — every page's tags, schema, canonicals and internal links — done and deployed.",
    },
    faq: [
      {
        question: "Does it read my page?",
        answer:
          "Yes. Give it a URL and it fetches the public HTML, reads the headings and existing tags, and writes new ones grounded in what the page actually says. JavaScript-only pages may come back sparse — describe the page instead.",
      },
      {
        question: "Why 60 characters for titles?",
        answer:
          "Google truncates titles around 600 pixels, roughly 55–65 characters. The preview shows the cut-off risk so you can trim before publishing.",
      },
    ],
  },
  {
    slug: "markdown-file-generator",
    name: "Markdown File Generator",
    shortDescription:
      "Turn a description or rough notes into a complete README, docs page, changelog, or llms.txt — previewed, formatted, and ready to download.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Need the whole docs site?",
      body: "Unlimited plan members get a documentation site designed, written and deployed alongside their product.",
    },
    faq: [
      {
        question: "Can it write from a URL?",
        answer: "Yes. Point it at a product page or repo site and it reads the public content to ground the document.",
      },
    ],
  },
  {
    slug: "agent-skill-generator",
    name: "Agent Skill Generator",
    shortDescription:
      "Describe a workflow or tool and get a SKILL.md your coding agent can load — triggers, exact steps, verification, and pitfalls.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "We build agent workflows, too.",
      body: "Unlimited plan members get custom agent skills and automations wired into their repo and CI — not just the file.",
    },
    faq: [
      {
        question: "Which agents use SKILL.md files?",
        answer:
          "Cursor, Claude Code, Codex and most agent frameworks read Markdown skills with a name/description front matter. Drop the file into your agent's skills folder (for Cursor: .cursor/skills/<name>/SKILL.md).",
      },
    ],
  },
  {
    slug: "dataset-builder",
    name: "Dataset Builder",
    shortDescription:
      "Describe the rows you need and get a typed, realistic dataset — synthetic, extracted from a page, or cleaned from your notes — as CSV or JSON.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Real data pipelines, not just seeds.",
      body: "Unlimited plan members get analytics set up end to end — tracking, warehouse, dashboards — by people who've done it before.",
    },
    faq: [
      {
        question: "Is the synthetic data safe to use?",
        answer:
          "It's generated, not scraped — no real people's details. Emails use example.com. Treat it as demo or test data, not as facts about the world.",
      },
      {
        question: "How many rows can it make?",
        answer: "Up to 60 per request. For more, ask for the next batch with different ranges, or extend the CSV in a spreadsheet.",
      },
    ],
  },

  // --- Heavy tools: audits, kits & reports ----------------------------------
  {
    slug: "website-audit-report",
    name: "Website Audit Report",
    shortDescription:
      "Paste a URL and get a scored, 20+ point technical and on-page SEO audit with the exact fix for every issue — and which tool goes deeper.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A score is a start. Fixing it is the plan.",
      body: "Unlimited plan members get every issue in this report actually fixed across their whole site, not just flagged.",
    },
    faq: [
      {
        question: "Does this crawl my whole site?",
        answer:
          "No — this audits a single URL you provide. It fetches the live page server-side and scores it; nothing is stored beyond the request.",
      },
      {
        question: "Why didn't it detect content rendered by JavaScript?",
        answer:
          "This tool reads the raw HTML response, so content injected client-side by JavaScript frameworks after load may not appear in the audit. That's also what search engines index first — if the audit sees an empty page, so do they until the render queue catches up.",
      },
      {
        question: "What does it check?",
        answer:
          "Title and description length, H1 count and heading outline, canonical, indexability, language, structured-data validity and types, Open Graph and Twitter cards, favicon, word count, alt-text coverage, internal links, lazy loading, HTTPS, mobile viewport, server response time, HTML weight, compression, external scripts and third parties, security headers, and Cache-Control.",
      },
    ],
  },
  {
    slug: "landing-page-grader",
    name: "Landing Page Conversion Grader",
    shortDescription:
      "Grade a landing page for conversion — headline, calls to action, form friction, trust signals, distractions and speed — then get the hero rewritten.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A grade tells you what's wrong. We fix it.",
      body: "Unlimited plan members get the page rebuilt and A/B tested, not just graded.",
    },
    faq: [
      {
        question: "How is this different from the Website Audit Report?",
        answer:
          "Same underlying fetch, a completely different scoring lens — this one weighs conversion signals (headline clarity, calls to action and their wording, form length, testimonials and social proof, navigation distractions) instead of general SEO health.",
      },
      {
        question: "Can it tell me what to change, not just what's wrong?",
        answer:
          "Yes. Every failing check comes with a concrete fix, and the assistant will write three alternative heroes (headline, subheadline, button) grounded in what your page already says. Pair it with the A/B Copy Variant Generator to turn the rewrite into a test plan.",
      },
    ],
  },
  {
    slug: "competitor-gap-report",
    name: "Competitor Gap Report",
    shortDescription: "Compare your page against up to three competitors on identical signals — see where you're behind, where you lead, and the terms they use that you don't.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Seeing the gap is easy. Closing it is the work.",
      body: "Unlimited plan members get a full strategy built around exactly where they're behind — and stay ahead as competitors change.",
    },
    faq: [
      {
        question: "How many competitors can I compare?",
        answer: "Up to three competitor URLs against your own, four total, in a single report. Compare like with like — homepage against homepage, pricing page against pricing page — for a fair read.",
      },
      {
        question: "What gets compared?",
        answer:
          "Audit score and failing checks, visible words, H2 sections, images and alt coverage, internal and outbound links, title and description length, H1 count, schema types, Open Graph image, HTML load time and weight, external scripts, third-party hosts, security headers and HTTPS — plus each page's most frequent terms.",
      },
    ],
  },
  {
    slug: "dns-email-health",
    name: "DNS & Email Deliverability Health Check",
    shortDescription: "Real SPF, DKIM, DMARC, and MX checks for your domain — the kind you'd normally ask a developer for.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Failing checks here means real emails land in spam.",
      body: "Unlimited plan members get their entire email infrastructure configured correctly, once, by someone who's done it before.",
    },
    faq: [
      {
        question: "Can this check my exact DKIM selector?",
        answer:
          "Yes. DKIM selectors aren't discoverable from DNS alone, so by default it probes the ~40 selectors common providers use (google, selector1/2, k1, s1/s2…). Tell it your selector — or which tools send your mail — and it checks that record exactly.",
      },
      {
        question: "Does it show inbox placement or blacklists?",
        answer:
          "No. It reads public DNS, which is what receivers evaluate for authentication. Placement and reputation need sending data — Google Postmaster Tools is the free source for that.",
      },
      {
        question: "Do you store my domain or results?",
        answer: "No — the check runs on demand and nothing is persisted.",
      },
    ],
  },
  {
    slug: "brand-identity-kit",
    name: "Full Brand Identity Kit",
    shortDescription: "Generate a monogram mark, favicon, palette, and type pairing — bundled as a downloadable kit.",
    status: "beta",
    processing: "client",
    upsell: {
      headline: "A starter kit vs. a full identity system.",
      body: "Unlimited plan members get a professionally designed identity system, not a procedurally generated placeholder — including a custom logo, not just a monogram.",
    },
    faq: [
      {
        question: "Can I use the generated logo as my real logo?",
        answer:
          "It's a solid placeholder for early validation, not a substitute for custom design work — especially for trademark purposes. Treat it as a starting point.",
      },
    ],
  },
  {
    slug: "ad-creative-resizer",
    name: "Ad Creative Resizer",
    shortDescription: "Upload one creative, download a full zip of correctly sized variants for every major ad platform.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Resizing one creative is easy. A full campaign isn't.",
      body: "Unlimited plan members get original creative designed and produced for every platform, not just resized.",
    },
    faq: [
      {
        question: "Does this upload my image anywhere?",
        answer: "No — resizing and zipping both happen entirely in your browser.",
      },
    ],
  },
  {
    slug: "content-campaign-calendar",
    name: "Content & Campaign Calendar Generator",
    shortDescription: "Plan a dated, multi-channel content calendar where every piece has a real hook and brief — export as CSV, ICS or JSON.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A plan is a start. Execution is the hard part.",
      body: "Unlimited plan members get every piece of content on this calendar actually written and designed.",
    },
    faq: [
      {
        question: "How long a plan can it make?",
        answer: "From one week to a quarter (7–90 days). It defaults to 30 days starting next Monday and to a cadence a small team can actually sustain.",
      },
      {
        question: "Is every entry just 'post about your product'?",
        answer:
          "No. Each entry has a specific hook, a brief with the angle and the proof to include, a CTA matched to its funnel stage, and a content pillar. Blog posts are deliberately repurposed into threads, carousels and newsletter sections on later days.",
      },
    ],
  },
  {
    slug: "local-seo-optimizer",
    name: "Local SEO / Google Business Profile Optimizer",
    shortDescription: "Get the full local-search kit: GBP description and categories, services, keywords, Q&A, review responses, posts, schema and a launch checklist.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Copy is one piece of local SEO.",
      body: "Unlimited plan members get citations, review generation, and ongoing local SEO work handled end to end.",
    },
    faq: [
      {
        question: "What do I need to give it?",
        answer: "What the business does and where it is — or just its website URL, and it will read the services, address, phone and tone from the page.",
      },
      {
        question: "Are the categories real Google Business Profile categories?",
        answer: "It uses real GBP category names, but availability varies by country. Check the suggested categories exist in your GBP dashboard before saving.",
      },
    ],
  },
  {
    slug: "sitemap-robots-generator",
    name: "Sitemap & Robots.txt Generator",
    shortDescription: "Crawl your site and get a sitemap.xml built from what's actually linked, plus a robots.txt with optional AI-crawler rules.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A sitemap is table stakes. Indexing is the goal.",
      body: "Unlimited plan members get their whole site's technical SEO — including sitemaps, robots, and canonical tags — managed continuously.",
    },
    faq: [
      {
        question: "Can this crawl my site for me?",
        answer:
          "Yes. Give it your homepage and it follows internal links up to a few levels deep and up to 150 pages, skipping redirects, errors, noindex pages and any path prefixes you exclude.",
      },
      {
        question: "Should I block AI crawlers?",
        answer:
          "Blocking training crawlers (GPTBot, CCBot, Google-Extended) doesn't affect whether ChatGPT, Perplexity or Claude can cite you — blocking their search agents does. The tool can write either rule set; it recommends blocking training only unless you want out of AI search entirely.",
      },
    ],
  },
  {
    slug: "white-label-report-builder",
    name: "White-Label Client Report Builder",
    shortDescription: "Combine audit findings, brand kit details, and competitor gaps into one polished, brandable report.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "This is what the unlimited plan feels like, compounding.",
      body: "This report builder previews what the free Brand Vault becomes once accounts exist — every tool's output, composed into one deliverable. Unlimited plan members get it maintained and re-sent automatically as things change.",
    },
    faq: [
      {
        question: "Can I white-label this with my own agency's branding?",
        answer: "Yes — set your brand name and accent color before generating the report or proposal.",
      },
    ],
  },

  // --- Phase 1 additions: extends the audit engine + zero-dependency wins --
  {
    slug: "broken-link-checker",
    name: "Broken Link Repair Assistant",
    shortDescription: "Scan a page, find every dead or redirecting link, and get verified replacements plus a find-and-replace list.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "One page is easy. Your whole site is the job.",
      body: "Unlimited plan members get every page on their site crawled and every broken link fixed, on an ongoing basis.",
    },
    faq: [
      {
        question: "Does this check my whole site?",
        answer:
          "It checks the links found on the page you give it (up to 60 per page). Point it at your sitemap page, footer-heavy pages or old blog posts to cover the most ground.",
      },
      {
        question: "How are replacements suggested?",
        answer:
          "For internal links it tries common URL fixes (trailing slash, https, lowercase, .html) and looks for a similar live page on your site, and marks anything it confirmed with a request. External fixes are suggestions to verify.",
      },
    ],
  },
  {
    slug: "canonical-tag-detector",
    name: "Canonical Tag Detector",
    shortDescription: "Find every canonical a page declares, catch conflicts, chains and tracking parameters, and get the exact tag to ship.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Canonicals are one signal. We manage all of them.",
      body: "Unlimited plan members get their whole site's technical SEO — canonicals, redirects, sitemaps, structured data — handled continuously.",
    },
    faq: [
      {
        question: "What does it check?",
        answer:
          "Presence, duplicates and conflicts between HTML and HTTP header canonicals, absolute vs relative URLs, http vs https, www variants, self-referencing vs cross-page, tracking parameters, fragments, og:url and robots consistency, and whether the canonical target is live, redirecting or part of a chain.",
      },
      {
        question: "Why does Search Console show a different canonical than mine?",
        answer:
          "Google treats your tag as a strong hint, not a rule. If the target redirects, is in a chain, conflicts with a header, or is on a noindexed page, Google may pick its own. The audit flags exactly those cases.",
      },
    ],
  },
  {
    slug: "page-speed-audit",
    name: "Page Speed Audit",
    shortDescription: "A prioritised delivery audit — server response, blocking scripts, JavaScript weight, images, fonts and third parties — with the fixes that move Core Web Vitals.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "We'll make the fixes, not just list them.",
      body: "Unlimited plan members get performance work shipped — bundle splitting, image pipelines, caching — measured against real-user data.",
    },
    faq: [
      {
        question: "Is this the same as PageSpeed Insights?",
        answer:
          "No. This is a static read of how the page is delivered: response time, compression, blocking resources, measured script and stylesheet sizes, image and font hints. It doesn't run a browser, so it can't measure LCP, CLS or INP directly — use it to know what to fix, then confirm with PageSpeed Insights.",
      },
      {
        question: "What is the score?",
        answer: "A heuristic from the findings' severity, useful for tracking progress between runs. It is not a Lighthouse score.",
      },
    ],
  },
  {
    slug: "backlink-health-check",
    name: "Backlink Health Check",
    shortDescription: "Paste the pages that should link to you and verify each link is live, follow, deep-linked and on an indexable page.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Links that stay live are earned, not checked.",
      body: "Unlimited plan members get ongoing digital PR and link reclamation — we find the mentions, win the links, and keep them.",
    },
    faq: [
      {
        question: "Can it find my backlinks for me?",
        answer:
          "Not yet — there's no free, reliable public index of the web's links. Export your list from Google Search Console (Links → Top linking pages), Bing Webmaster Tools or Ahrefs Webmaster Tools, paste it in, and this verifies every one. Up to 20 pages per check.",
      },
      {
        question: "What does 'domain only' mean?",
        answer: "The page links to your homepage or another page on your domain, but not the URL you asked about. Worth a polite request to deep-link.",
      },
    ],
  },
  {
    slug: "voice-search-optimizer",
    name: "Voice Search Optimizer",
    shortDescription: "Score a page for spoken answers — question headings, snippet-length answers, FAQ schema, speed — and get the FAQ section and JSON-LD written for you.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Being the answer is a content strategy, not a checklist.",
      body: "Unlimited plan members get question-led content written, marked up and measured across their whole site.",
    },
    faq: [
      {
        question: "What makes a page voice-search friendly?",
        answer:
          "Assistants read one short answer aloud. Pages that win are fast, secure, mobile-ready, phrase headings as the questions people say, answer each in 30–50 plain words directly underneath, and mark the pairs up as FAQPage schema. The checklist tests exactly those things.",
      },
      {
        question: "Can it write the FAQ for me?",
        answer: "Yes — after the audit, ask for it. You'll get spoken-style questions and answers based on the page, plus the HTML section and FAQPage JSON-LD to paste in.",
      },
    ],
  },
  {
    slug: "compliance-scanner",
    name: "Compliance Scanner",
    shortDescription: "Find the GDPR, cookie-consent, CCPA, accessibility and security gaps a regulator or a privacy-minded visitor would spot first — with the fix for each.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A scan finds the gaps. We close them.",
      body: "Unlimited plan members get consent management, policies and security headers implemented and kept current as the law changes.",
    },
    faq: [
      {
        question: "Is this legal advice?",
        answer:
          "No. It's a technical scan of the page's HTML and response headers for signals — trackers loading without a consent manager, missing policy links, insecure cookies, absent security headers, accessibility basics. Use it to know what to ask your lawyer or developer about.",
      },
      {
        question: "What can't it see?",
        answer:
          "Anything that happens after the page loads in a browser: whether the cookie banner actually blocks scripts until you accept, cookie lifetimes set by JavaScript, or what your processors do with the data. It tells you how to check those by hand.",
      },
    ],
  },
  {
    slug: "llm-readability-check",
    name: "LLM Readability Check",
    shortDescription: "See whether ChatGPT, Perplexity, Claude and AI Overviews can read and cite your page — crawler access, llms.txt, structure, schema — and get the fixes drafted.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "AI search is the new front page. We'll get you cited.",
      body: "Unlimited plan members get their content restructured, marked up and monitored for citations across AI answer engines.",
    },
    faq: [
      {
        question: "What does it check?",
        answer:
          "Three things: access (which AI crawlers robots.txt allows or blocks, noindex/nosnippet, whether content is JavaScript-only, /llms.txt), clarity (a definitional opening, clean headings, question sections, lists and tables, text-to-markup ratio) and machine-readable signals (JSON-LD, dates, author, canonical, semantic landmarks).",
      },
      {
        question: "Should I block AI crawlers?",
        answer:
          "Blocking training bots (GPTBot, Google-Extended, CCBot) keeps you out of training data and has no effect on being cited. Blocking search and user-fetch bots (OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot) removes you from AI answers. The report separates the two so you can choose deliberately.",
      },
    ],
  },
  {
    slug: "email-newsletter-builder",
    name: "Email Newsletter Builder",
    shortDescription: "Describe the update or paste a link and get a complete, inbox-safe newsletter — subject, preheader, table-based HTML, plain text — previewed on desktop and mobile.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "One email is easy. A programme that converts is the job.",
      body: "Unlimited plan members get their email calendar written, designed, tested and sent — with the automations behind it.",
    },
    faq: [
      {
        question: "Will it render in Outlook and Gmail?",
        answer:
          "The HTML follows the rules that make email render reliably: nested tables, all CSS inline, a 600px container, no JavaScript or external stylesheets, images with widths and alt text. Always send yourself a test from your email platform before a real send.",
      },
      {
        question: "Can I use it with Mailchimp, Klaviyo, HubSpot…?",
        answer:
          "Yes. Download the .html and import it as a custom-coded template, or paste it into your platform's HTML editor. Merge tags and the unsubscribe link are left as {{placeholders}} for your platform to fill.",
      },
    ],
  },
  {
    slug: "accessibility-checker",
    name: "Accessibility Checker",
    shortDescription: "A fast, free WCAG-lite scan — missing alt text, skipped headings, blocked zoom, and more.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "This catches the obvious gaps. A real audit catches the rest.",
      body: "Unlimited plan members get a full accessibility remediation pass — including the things a static scan can't see, like color contrast and keyboard navigation.",
    },
    faq: [
      {
        question: "Is this a full WCAG compliance audit?",
        answer:
          "No — this is a fast static-HTML heuristic scan, not a substitute for a full audit (which needs a rendered-DOM tool and manual keyboard/screen-reader testing). Treat a passing score here as a starting point, not a compliance certification.",
      },
    ],
  },
  {
    slug: "security-headers-checker",
    name: "Security Headers Checker",
    shortDescription: "Check whether your site sends the HTTP security headers that protect against common attacks.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Headers are one layer. Full hardening is the job.",
      body: "Unlimited plan members get their entire security posture reviewed and fixed, not just one header check.",
    },
    faq: [],
  },
  {
    slug: "ssl-certificate-checker",
    name: "SSL/TLS Certificate Checker",
    shortDescription: "Check a domain's SSL certificate — issuer, expiry date, and days remaining — in seconds.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "An expired certificate takes your whole site down.",
      body: "Unlimited plan members get certificate renewal monitored and handled automatically — never an unplanned outage.",
    },
    faq: [
      {
        question: "How does this check the certificate?",
        answer:
          "It opens a real TLS connection to your domain on port 443 and reads the certificate the server presents — the same thing a browser does when you visit the site.",
      },
    ],
  },
  {
    slug: "email-finder",
    name: "B2B Email Finder",
    shortDescription: "Find a person's likely work email from the pattern their company actually uses, ranked by confidence.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A guess is a start. A real list is the job.",
      body: "Unlimited plan members get outreach lists built and verified for them at scale, not one lookup at a time.",
    },
    faq: [
      {
        question: "Does this guarantee the email is real?",
        answer:
          "No — this ranks likely patterns and confirms the domain can receive mail (MX lookup). It does not perform mailbox-level SMTP verification, which is unreliable to run from most servers and easy to abuse. Always confirm before sending anything important.",
      },
      {
        question: "Is this okay to use for cold outreach?",
        answer:
          "Use it responsibly and in line with applicable anti-spam law (e.g. CAN-SPAM, GDPR) — this tool finds a likely address, it doesn't grant permission to email anyone about anything.",
      },
    ],
  },
  {
    slug: "ai-image-generator",
    name: "AI Image Generator",
    shortDescription: "Describe the visual you need — hero, ad creative, blog header, product scene, icon — and get finished images in the right aspect ratio, ready to download.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "One image is a start. A campaign is the job.",
      body: "Unlimited plan members get full creative production: on-brand image systems, ad sets across every platform size, and a designer who fixes what the model can't.",
    },
    faq: [
      {
        question: "Which model makes the images?",
        answer:
          "OpenAI's gpt-image model by default, routed through our gateway with automatic fallback to other image models if it's unavailable. The assistant writes a full art-direction prompt from your brief first, which is where most of the quality comes from.",
      },
      {
        question: "Can I use the images commercially?",
        answer:
          "Yes. Images you generate are yours to use, including commercially. Avoid asking for real people, trademarks or other companies' logos — the model refuses some of those and the rest can create legal exposure for you.",
      },
      {
        question: "Where are my images stored?",
        answer:
          "In your browser's history for this tool only — we don't keep a copy on our servers. Download the files you want to keep; if a conversation grows large the oldest pixels are trimmed and you can regenerate from the saved prompt.",
      },
    ],
  },
  {
    slug: "social-card-generator",
    name: "OG & Social Card Generator",
    shortDescription: "Turn a page or announcement into a link-preview card and social post images — exact text, brand colours, optional generated art — in every size, as PNG.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Every page deserves a preview that earns the click.",
      body: "Unlimited plan members get a full social template system in their brand and automated og:image generation for every page of their site.",
    },
    faq: [
      {
        question: "Why not just generate the whole card with an image model?",
        answer:
          "Image models still misspell and misplace text. Here the card is a real vector layout — the headline, subtitle and brand are typeset exactly — and the image model is only used, optionally, for the backdrop art behind it.",
      },
      {
        question: "Which size do I upload where?",
        answer:
          "1200×630 is the og:image for Facebook, LinkedIn, Slack and iMessage previews; 1600×900 for X's summary_large_image; 1080×1080 for Instagram feed and LinkedIn posts; 1080×1920 for stories and Reels covers. The card offers all four.",
      },
    ],
  },
  {
    slug: "utm-builder",
    name: "UTM Link Builder",
    shortDescription: "Build a consistent set of tracked campaign links across every placement — normalised names, GA4 medium taxonomy, duplicate and fragmentation warnings, CSV export.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Tracked links are step one. Attribution is the job.",
      body: "Unlimited plan members get their analytics set up end to end — GA4 events, conversions, dashboards — and campaigns reported on weekly.",
    },
    faq: [
      {
        question: "Why does it change my capitalisation?",
        answer:
          "GA4 and most analytics tools treat 'LinkedIn', 'linkedin' and 'Linkedin' as three different sources, so one campaign turns into three report rows. Lowercase-with-underscores is the convention that keeps reports clean, and the tool applies it to every value.",
      },
      {
        question: "Should I UTM links inside my own site?",
        answer: "No. Tagging internal links resets the visitor's session source to whatever the tag says and destroys attribution. Only tag links that bring people to your site from somewhere else.",
      },
    ],
  },
  {
    slug: "persona-generator",
    name: "ICP & Persona Generator",
    shortDescription: "Define your ideal customer profile and buyer personas — goals, pains, triggers, objections, channels, messaging, proof — from a product description or your site.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Personas on paper are a hypothesis. Validated positioning is the job.",
      body: "Unlimited plan members get customer interviews, message testing and a positioning document their whole team writes from.",
    },
    faq: [
      {
        question: "Aren't AI personas just made up?",
        answer:
          "They're structured hypotheses, grounded in what you tell it and what your site says, built on how buying actually works at your price point. The notes list every assumption so you know exactly what to validate in your next five customer conversations — which is the point: a persona you can test beats no persona at all.",
      },
    ],
  },
  {
    slug: "subject-line-checker",
    name: "Subject Line Checker",
    shortDescription: "Score email subject lines and preview text for deliverability and open-rate risk — length, shouting, trigger words, fake replies, generic phrasing — then get stronger alternatives, scored.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A better subject line lifts opens. A better program lifts revenue.",
      body: "Unlimited plan members get their whole email program run — segments, sequences, deliverability, testing — with results reported monthly.",
    },
    faq: [
      {
        question: "Does the score predict my open rate?",
        answer:
          "No tool can — your audience and sender reputation matter far more. The score is a deterministic risk-and-clarity check: it catches the patterns that filters and readers reliably punish. Use it to remove obvious problems, then A/B test the top two candidates on real subscribers.",
      },
    ],
  },
  {
    slug: "press-release-generator",
    name: "Press Release Generator",
    shortDescription: "Write an AP-style press release journalists can run — headline, dateline, lede, body, attributed quotes, boilerplate, media contact — with newsroom checks and Markdown/text export.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A release is written. Coverage is earned.",
      body: "Unlimited plan members get the pitch list, the personal outreach, and the follow-up handled — not just the document.",
    },
    faq: [
      {
        question: "Will it invent quotes for real people?",
        answer:
          "It drafts quotes for the people you name and flags in the notes that they need approval. It won't attribute quotes to real people you didn't mention, and it won't invent customers, investors or metrics — anything unknown becomes a marked placeholder.",
      },
    ],
  },
  {
    slug: "qa-test-plan-generator",
    name: "QA Test Plan Generator",
    shortDescription: "Turn a feature, release or page into a prioritised test plan — scenarios with steps, test data and expected results, negative and edge cases, accessibility, device matrix, exit criteria — as CSV or Markdown.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "A plan finds the bugs. Someone still has to fix them.",
      body: "Unlimited plan members get their site and funnels tested before every release and the fixes shipped by the same team that built it.",
    },
    faq: [
      {
        question: "Can it run the tests?",
        answer:
          "Not yet — it writes the plan a person or an automation engineer executes. Ask it to turn the P0 scenarios into Playwright test outlines and you'll have a head start on automation.",
      },
    ],
  },
  {
    slug: "content-repurposer",
    name: "Content Repurposer",
    shortDescription: "Turn one blog post, transcript or case study into native posts for LinkedIn, X, Instagram, YouTube, newsletter, short video and more — checked against each channel's limits.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "One piece, ten posts. Every week, forever, is the job.",
      body: "Unlimited plan members get their content engine run for them — long-form written, repurposed, scheduled and reported across every channel.",
    },
    faq: [
      {
        question: "Does it just shorten the article?",
        answer:
          "No — each version is rewritten in the channel's own grammar: a LinkedIn hook that shows before 'see more', a thread where every tweet stands alone, a script meant to be spoken. It keeps your facts and claims; it doesn't add statistics or examples that weren't in the source.",
      },
    ],
  },
  {
    slug: "transcriber",
    name: "Transcriber",
    shortDescription: "Transcribe a podcast, webinar, call or voice memo with timestamps, then get a brief — summary, chapters, quotes, action items — and SRT/VTT captions.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Every episode transcribed, briefed and published — without you.",
      body: "Unlimited plan members get their recordings turned into show notes, blog posts, newsletters and clips on a schedule, every week.",
    },
    faq: [
      {
        question: "How long can the recording be?",
        answer:
          "Up to 25 MB per file (about 45 minutes of MP3 at 64 kbps, longer for M4A), and 120 minutes of audio a day on a free account. Export voice at a lower bitrate for long episodes — speech transcribes just as well at 48–64 kbps.",
      },
      {
        question: "Is the audio kept?",
        answer:
          "No. The file is transcribed and discarded; only the transcript is stored, for seven days, under an unguessable id so the conversation can refer back to it.",
      },
    ],
  },
  {
    slug: "clip-finder",
    name: "Clip Finder",
    shortDescription: "Find the most clippable moments in a long recording — exact timestamps, hook, caption, spoken words, per-clip captions and ffmpeg cut commands for TikTok, Reels, Shorts, LinkedIn and X.",
    status: "live",
    processing: "server",
    upsell: {
      headline: "Finding the clips is half the job. Cutting and posting is the other half.",
      body: "Unlimited plan members get clips cut, captioned, branded and scheduled from every recording they publish.",
    },
    faq: [
      {
        question: "Does it cut the video for me?",
        answer:
          "It gives you everything an editor needs: precise start and end times on sentence boundaries, the words in each clip, an SRT re-timed for the clip and a lossless ffmpeg command per clip. Paste the commands, or type the timestamps into CapCut, Descript or Premiere.",
      },
    ],
  },
  {
    slug: "background-remover",
    name: "Background Remover",
    shortDescription: "Remove the background from a photo — product shots, headshots, or social images — right in your browser.",
    status: "beta",
    processing: "client",
    upsell: {
      headline: "One photo is easy. A whole catalog isn't.",
      body: "Unlimited plan members get batch background removal and full product photo editing for their whole catalog.",
    },
    faq: [
      {
        question: "Does this upload my photo anywhere?",
        answer:
          "No — background removal runs entirely in your browser using an on-device ML model. Your image never leaves your device.",
      },
      {
        question: "Why did it take a few seconds to load the first time?",
        answer:
          "The first use downloads a small ML model to your browser so processing can run locally. It's cached after that, so it's instant on repeat use.",
      },
    ],
  },
  {
    slug: "demo-video-creator",
    name: "Demo Video Creator",
    shortDescription: "Record your screen with a branded watermark overlay and export a ready-to-share demo video.",
    status: "beta",
    processing: "client",
    upsell: {
      headline: "A raw recording is a start. A produced demo converts.",
      body: "Unlimited plan members get real demo videos scripted, recorded, edited, and captioned for them — not just a raw screen capture.",
    },
    faq: [
      {
        question: "Does this upload my recording anywhere?",
        answer: "No — recording, watermarking, and export all happen locally in your browser.",
      },
      {
        question: "Can I trim or edit the recording afterward?",
        answer:
          "Trimming isn't built in yet. For captions, drop the exported file into the Transcriber tool — it returns SRT/VTT you can attach on upload.",
      },
    ],
  },
];

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

