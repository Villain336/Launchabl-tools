export const siteConfig = {
  name: "Launchabl",
  tagline: "Unlimited marketing & design. One price. Forever.",
  description:
    "Launchabl is the marketing platform where the tools are free forever and the agency is unlimited for life — brand, website, content, and SEO, one flat price, no retainers.",
  price: "$3,997",
  priceNote: "one-time · lifetime access · no monthly retainer",
};

export type NavLink = {
  label: string;
  href: string;
};

export const primaryNav: NavLink[] = [
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
    shortDescription: "Search a name across dozens of TLDs and see what's open to register.",
    status: "beta",
    processing: "partner",
    upsell: {
      headline: "We'll handle the whole setup.",
      body: "Unlimited plan members get domain registration, DNS, and hosting configured for them — zero technical setup required.",
    },
    faq: [
      {
        question: "Who do you register domains through?",
        answer:
          "This tool is designed to plug into a registrar/reseller API (e.g. a domain-search + registration partner). Purchases route through that partner, not through Launchabl directly.",
      },
    ],
  },
  {
    slug: "domain-purchase",
    name: "Domain Purchase",
    shortDescription: "Register the domain you found, with pricing that's transparent up front.",
    status: "coming-soon",
    processing: "partner",
    upsell: {
      headline: "Included free with the unlimited plan.",
      body: "Domain registration and renewal for your primary domain is included for the life of your plan.",
    },
    faq: [],
  },
  {
    slug: "hosting",
    name: "Hosting",
    shortDescription: "Fast, managed hosting for your new site — no server admin required.",
    status: "coming-soon",
    processing: "partner",
    upsell: {
      headline: "Hosting is included, not extra.",
      body: "Every unlimited plan includes managed hosting for the site we build you — no separate hosting bill to juggle.",
    },
    faq: [],
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
    slug: "copywriter",
    name: "AI Copywriter",
    shortDescription:
      "Structured templates for ad copy, landing page heroes, product blurbs, and email subject lines.",
    status: "beta",
    processing: "server",
    upsell: {
      headline: "Great copy still needs a great strategist.",
      body: "Unlimited plan members get human copywriters who write and test full campaigns — not just a first draft.",
    },
    faq: [
      {
        question: "Is the output guaranteed original / plagiarism-free?",
        answer:
          "No AI writing tool can guarantee full originality. Always run generated copy through your own plagiarism/fact check before publishing.",
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
    shortDescription: "Remove a watermark you own the rights to, using AI-assisted inpainting.",
    status: "coming-soon",
    processing: "server",
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
    shortDescription: "Generate valid JSON-LD structured data for Organization, Product, FAQ, and more.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "One snippet is a start. Full technical SEO is the win.",
      body: "Unlimited plan members get a full technical SEO audit and every page on their site fitted with the right schema — not just one snippet.",
    },
    faq: [
      {
        question: "Where do I put the generated code?",
        answer:
          "Paste the JSON-LD output inside a <script type=\"application/ld+json\"> tag in your page's <head>, or use your CMS's structured data field.",
      },
      {
        question: "How do I know if it's valid?",
        answer:
          "Test it with Google's Rich Results Test or Schema.org's validator before publishing.",
      },
    ],
  },
  {
    slug: "file-converter",
    name: "File Converter",
    shortDescription: "Convert documents, spreadsheets, and presentations between common formats.",
    status: "coming-soon",
    processing: "server",
    upsell: {
      headline: "Batch conversions, zero limits.",
      body: "Unlimited plan members get bulk conversion with no file-count or file-size caps.",
    },
    faq: [],
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
      "Fetch a real URL and get a scored, multi-part report across SEO, structured data, and technical basics.",
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
          "This tool reads the raw HTML response, so content injected client-side by JavaScript frameworks after load may not appear in the audit. A production crawler would add headless-browser rendering to catch this.",
      },
    ],
  },
  {
    slug: "landing-page-grader",
    name: "Landing Page Conversion Grader",
    shortDescription:
      "Score a landing page against real conversion best practices — CTAs, forms, trust signals, and speed.",
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
          "Same underlying fetch, a completely different scoring lens — this one weighs conversion signals (calls to action, forms, phone numbers, trust signals) instead of general SEO health.",
      },
    ],
  },
  {
    slug: "competitor-gap-report",
    name: "Competitor Gap Report",
    shortDescription: "Compare your site against up to three competitors, side by side, on the same signals.",
    status: "beta",
    processing: "server",
    upsell: {
      headline: "Seeing the gap is easy. Closing it is the work.",
      body: "Unlimited plan members get a full strategy built around exactly where they're behind — and stay ahead as competitors change.",
    },
    faq: [
      {
        question: "How many competitors can I compare?",
        answer: "Up to three competitor URLs against your own, four total, in a single report.",
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
          "DKIM selectors aren't discoverable via DNS alone, so this checks a list of common selectors. If your provider uses a custom one, ask your unlimited plan team to verify it directly.",
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
    shortDescription: "Generate a 30-day, multi-channel content plan tailored to your business and goal, exportable as CSV.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "A plan is a start. Execution is the hard part.",
      body: "Unlimited plan members get every piece of content on this calendar actually written and designed.",
    },
    faq: [],
  },
  {
    slug: "local-seo-optimizer",
    name: "Local SEO / Google Business Profile Optimizer",
    shortDescription: "Generate a full local-presence package: GBP description, categories, Q&A, and review responses.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Copy is one piece of local SEO.",
      body: "Unlimited plan members get citations, review generation, and ongoing local SEO work handled end to end.",
    },
    faq: [],
  },
  {
    slug: "sitemap-robots-generator",
    name: "Sitemap & Robots.txt Generator",
    shortDescription: "Turn a real list of your site's URLs into a validated sitemap.xml and robots.txt pair.",
    status: "live",
    processing: "client",
    upsell: {
      headline: "A sitemap is table stakes. Indexing is the goal.",
      body: "Unlimited plan members get their whole site's technical SEO — including sitemaps, robots, and canonical tags — managed continuously.",
    },
    faq: [
      {
        question: "Can this crawl my site for me?",
        answer:
          "Not yet — paste in the URLs you want included. Live crawling is on the roadmap and would run server-side.",
      },
    ],
  },
  {
    slug: "white-label-report-builder",
    name: "White-Label Client Report Builder",
    shortDescription: "Combine audit findings, brand kit details, and competitor gaps into one polished, brandable report.",
    status: "beta",
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
    name: "B2B Email Finder & Verifier",
    shortDescription: "Guess the likely business email pattern for a person at a company, and confirm the domain accepts mail.",
    status: "beta",
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
          "Not yet — v1 is record-and-export only. Trimming and auto-captions (via the upcoming Transcriber tool) are on the roadmap.",
      },
    ],
  },
];

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

