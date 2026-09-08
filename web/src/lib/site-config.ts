export const siteConfig = {
  name: "Launchable",
  tagline: "Unlimited marketing & design. One price. Forever.",
  description:
    "Launchable is the marketing platform where the tools are free forever and the agency is unlimited for life — brand, website, content, and SEO, one flat price, no retainers.",
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

export type ToolCluster = {
  slug: string;
  name: string;
  description: string;
};

export const toolClusters: ToolCluster[] = [
  {
    slug: "launch",
    name: "Launch a brand",
    description:
      "Name it, claim the domain, stand up hosting, and write the copy — the full 0-to-1 stack.",
  },
  {
    slug: "protect",
    name: "Protect & clean your assets",
    description:
      "Watermark, strip hidden metadata, and keep control over how your images travel the web.",
  },
  {
    slug: "get-found",
    name: "Get found",
    description: "Structured data and technical SEO fixes search engines actually reward.",
  },
  {
    slug: "convert-ship",
    name: "Convert & ship",
    description: "Turn files into the format you actually need, in the browser, in seconds.",
  },
  {
    slug: "audits-reports",
    name: "Audits, kits & reports",
    description:
      "Heavier, multi-part deliverables — real audits, brand kits, and reports other free tool sites don't attempt.",
  },
];

export type ToolStatus = "live" | "beta" | "coming-soon";

export type Tool = {
  slug: string;
  name: string;
  shortDescription: string;
  cluster: string;
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
    cluster: "launch",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Need a full brand system, not just a name?",
      body: "Launchable unlimited plan members get a complete visual identity, logo files, and a launch-ready website built around this name — included, forever.",
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
    cluster: "launch",
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
          "This tool is designed to plug into a registrar/reseller API (e.g. a domain-search + registration partner). Purchases route through that partner, not through Launchable directly.",
      },
    ],
  },
  {
    slug: "domain-purchase",
    name: "Domain Purchase",
    shortDescription: "Register the domain you found, with pricing that's transparent up front.",
    cluster: "launch",
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
    cluster: "launch",
    status: "coming-soon",
    processing: "partner",
    upsell: {
      headline: "Hosting is included, not extra.",
      body: "Every unlimited plan includes managed hosting for the site we build you — no separate hosting bill to juggle.",
    },
    faq: [],
  },
  {
    slug: "copywriter",
    name: "AI Copywriter",
    shortDescription:
      "Structured templates for ad copy, landing page heroes, product blurbs, and email subject lines.",
    cluster: "launch",
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
    cluster: "protect",
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
    cluster: "protect",
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
    cluster: "protect",
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
    cluster: "get-found",
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
    cluster: "convert-ship",
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
    cluster: "convert-ship",
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
    shortDescription: "Create a styled, high-resolution QR code for any link in seconds.",
    cluster: "convert-ship",
    status: "live",
    processing: "client",
    upsell: {
      headline: "Static codes are just the start.",
      body: "Unlimited plan members get dynamic QR codes with scan analytics and the ability to change the destination link after printing.",
    },
    faq: [
      {
        question: "Do these QR codes expire?",
        answer:
          "No — these are static codes generated entirely in your browser. They point directly at your link forever, with no tracking or expiry.",
      },
    ],
  },

  // --- Heavy tools: audits, kits & reports ----------------------------------
  {
    slug: "website-audit-report",
    name: "Website Audit Report",
    shortDescription:
      "Fetch a real URL and get a scored, multi-part report across SEO, structured data, and technical basics.",
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
    cluster: "audits-reports",
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
];

export function getToolBySlug(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}

export function getToolsByCluster(clusterSlug: string) {
  return tools.filter((tool) => tool.cluster === clusterSlug);
}

export function getRelatedTools(tool: Tool, limit = 3) {
  return tools.filter((t) => t.cluster === tool.cluster && t.slug !== tool.slug).slice(0, limit);
}
