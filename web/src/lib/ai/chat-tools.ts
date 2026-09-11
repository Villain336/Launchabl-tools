/**
 * Client-safe metadata for chat-based tools.
 *
 * Anything here ships to the browser. System prompts, tool definitions and
 * model routing live in `chat-runtime.ts`, which is only imported by API
 * routes.
 */

export type ChatToolMeta = {
  slug: string;
  /** Short line shown above the empty conversation. */
  intro: string;
  placeholder: string;
  /** Starter prompts rendered as chips in the empty state. */
  suggestions: string[];
  /** Custom artifact renderers this tool can emit (matched to `tool-<name>` parts). */
  artifacts: string[];
  /** Key of a starter artifact rendered in the empty state, for tools that work without a prompt. */
  starter?: string;
};

const metas: ChatToolMeta[] = [
  {
    slug: "ab-copy-variants",
    intro:
      "Paste the copy you want to test — a headline, hero, ad, email, or CTA — and say who it's for. You'll get distinct variants, each built on a different persuasion angle, plus a plan for how to test them.",
    placeholder: "Paste your current copy and describe the audience…",
    suggestions: [
      "Write 4 headline variants for a landing page selling a $29/mo invoicing app to freelancers. Current: \"Invoicing made simple.\"",
      "A/B test my Google Ads headline: \"Affordable web design for small business\". Audience: local restaurants and salons.",
      "Give me 3 variants of this email subject line for a SaaS onboarding sequence: \"Welcome to Acme — let's get started\"",
      "Rewrite this CTA button for higher clicks: \"Submit\". Context: free trial signup form for a B2B analytics tool.",
    ],
    artifacts: ["deliverVariants"],
  },
  {
    slug: "qr-code-generator",
    intro:
      "Describe the look you want — colours, shapes, a gradient, room for your logo — and I'll design a QR code that still scans. Then download it as SVG or PNG, or embed it anywhere with a hosted link.",
    placeholder: "e.g. A QR for https://mysite.com in our brand orange with rounded dots and space for a logo",
    suggestions: [
      "Make a QR code for https://launchabl.com in Launchabl orange with fluid modules and rounded eyes.",
      "Design a playful QR for my café menu at https://example.com/menu — warm sunset gradient, dot modules, circle eyes.",
      "Minimal black QR code for https://example.com with a small logo space in the centre and generous margins.",
      "I need a QR for a business card: dark navy, leaf-shaped modules, transparent background.",
    ],
    artifacts: ["designQr"],
    starter: "qr",
  },
  {
    slug: "meta-tag-generator",
    intro:
      "Give me a URL or describe the page. I'll read it, write a title and description that earn the click, add the Open Graph and Twitter tags, and show you exactly how it looks in search and when shared.",
    placeholder: "Paste a URL, or describe the page and who it's for…",
    suggestions: [
      "Write meta tags for https://vercel.com/pricing",
      "Meta tags for a pricing page of a $29/mo invoicing app for freelancers. Brand: Ledgerly.",
      "Our blog post title is too long: \"The Complete, Definitive Guide to Local SEO for Restaurants in 2026 and Beyond\". Fix the title and description.",
      "Write tags for a thank-you page after newsletter signup — it shouldn't be indexed.",
    ],
    artifacts: ["deliverMetaTags", "fetchPage"],
  },
  {
    slug: "markdown-file-generator",
    intro:
      "Describe the document — a README, docs page, changelog, llms.txt, one-pager, meeting notes — or paste rough notes and I'll turn them into a complete, well-structured Markdown file you can download.",
    placeholder: "e.g. A README for a CLI that converts CSV to JSON, MIT licence, installs with npm…",
    suggestions: [
      "Write a README.md for a Node CLI called csvkit-lite that converts CSV to JSON and back. Installs with npm, MIT licence.",
      "Turn these notes into a CHANGELOG.md entry for v2.3.0: added dark mode, fixed export crash on Safari, dropped Node 16.",
      "Create an llms.txt for https://vercel.com/docs",
      "Write a CONTRIBUTING.md for a small open-source Next.js project that uses pnpm, Vitest and conventional commits.",
    ],
    artifacts: ["deliverDocument", "fetchPage"],
  },
  {
    slug: "agent-skill-generator",
    intro:
      "Describe a workflow, tool, API or team convention and I'll write a SKILL.md your coding agent can load — when it applies, the exact steps, how to verify, and the pitfalls. Drop the file into your agent's skills folder.",
    placeholder: "e.g. A skill for deploying our Next.js app to Vercel with preview URLs and env checks…",
    suggestions: [
      "Write a skill for adding a new shadcn/ui component to a Next.js 16 project and wiring it into Tailwind v4 tokens.",
      "A skill for triaging a failing GitHub Actions run: read logs, classify flaky vs real, propose a fix, re-run.",
      "Create a skill that teaches an agent our commit convention: conventional commits, one logical change per commit, no amend, PR body template.",
      "Skill for using the Stripe CLI to test webhooks locally: https://docs.stripe.com/stripe-cli",
    ],
    artifacts: ["deliverDocument", "fetchPage"],
  },
  {
    slug: "dataset-builder",
    intro:
      "Tell me what each row should represent and what it's for — a demo dashboard, a database seed, an import test, a small training set — and I'll build a typed table you can download as CSV or JSON.",
    placeholder: "e.g. 30 fake SaaS customers with plan, MRR, signup date, churn risk…",
    suggestions: [
      "Build 25 synthetic customers for a B2B SaaS demo: company, industry, plan (starter/pro/enterprise), MRR, signup date, seats, churn risk score.",
      "Make a 20-row product catalogue for a coffee roaster: SKU, name, origin, roast level, price per 250g, tasting notes, in stock.",
      "Extract the plans on https://vercel.com/pricing into a dataset with plan, price, and included features.",
      "Create a labelled dataset of 30 customer support messages with intent (billing, bug, feature request, cancellation) and sentiment.",
    ],
    artifacts: ["deliverDataset", "fetchPage"],
  },
  {
    slug: "canonical-tag-detector",
    intro:
      "Give me a URL and I'll find every canonical it declares — in the HTML and the HTTP headers — check that it's single, absolute, secure and pointing somewhere live, then tell you exactly what to change and why it matters for rankings.",
    placeholder: "Paste a page URL, e.g. https://example.com/blog/post?utm_source=x",
    suggestions: [
      "Check the canonical on https://vercel.com/pricing",
      "Does https://www.example.com/products/shoes/ have the right canonical? We also serve it without www.",
      "Audit canonicals on these three pages: https://example.com, https://example.com/?ref=home, https://example.com/index.html",
      "Our blog posts show a different Google-selected canonical in Search Console. Check https://example.com/blog/first-post",
    ],
    artifacts: ["analyzeCanonical"],
  },
  {
    slug: "broken-link-checker",
    intro:
      "Paste a page URL. I'll check every link on it, flag the dead and redirecting ones, try the most likely repairs, and hand you a find-and-replace list you can act on in minutes.",
    placeholder: "Paste the page to scan, e.g. https://example.com/resources",
    suggestions: [
      "Scan https://vercel.com/docs for broken links",
      "Check the links on https://example.com/blog/older-post and suggest replacements for anything broken",
      "Find redirecting links on https://example.com and give me a find-and-replace list",
      "Our footer links might be dead after a redesign. Check https://example.com",
    ],
    artifacts: ["checkLinks", "fetchPage"],
  },
  {
    slug: "page-speed-audit",
    intro:
      "Give me a URL and I'll audit how the page is delivered — server response, compression, render-blocking scripts, JavaScript weight, images, fonts and third-party tags — then tell you the two or three fixes that will actually move Core Web Vitals.",
    placeholder: "Paste a page URL and, if you like, your stack (Next.js, WordPress, Shopify…)",
    suggestions: [
      "Audit https://vercel.com for performance",
      "Why does https://example.com feel slow on mobile? It's a WordPress site.",
      "Check https://example.com/landing for render-blocking scripts and heavy JavaScript",
      "Audit https://example.com and tell me what to fix first for LCP",
    ],
    artifacts: ["auditPerformance"],
  },
  {
    slug: "backlink-health-check",
    intro:
      "Tell me your page or domain and paste the pages that should link to it. I'll verify each link is still there, whether it passes authority (follow vs nofollow), what the anchor says and whether the referring page can even be indexed — then help you recover what's missing.",
    placeholder: "Target: https://example.com — then paste referring page URLs, one per line",
    suggestions: [
      "Check that https://github.com/vercel/next.js still links to https://nextjs.org",
      "Target: https://example.com. Referrers: https://partner-site.com/resources, https://blog.example.org/tools-we-love",
      "Where can I get a list of pages linking to my site for free?",
      "Verify these backlinks to example.com and draft an outreach email for any that were removed: https://site-a.com/post, https://site-b.com/links",
    ],
    artifacts: ["checkBacklinks"],
  },
];

const bySlug = new Map(metas.map((meta) => [meta.slug, meta]));

export function getChatTool(slug: string): ChatToolMeta | undefined {
  return bySlug.get(slug);
}

export function listChatTools(): ChatToolMeta[] {
  return metas;
}
