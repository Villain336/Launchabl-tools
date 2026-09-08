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
