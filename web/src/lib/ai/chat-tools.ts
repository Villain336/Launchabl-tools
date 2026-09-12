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
  /** Render the starter under the intro text instead of above it. */
  starterBelowIntro?: boolean;
};

const metas: ChatToolMeta[] = [
  {
    slug: "ab-copy-variants",
    intro:
      "Paste the copy you want to test — a headline, hero, ad, product blurb, email subject or CTA — or describe the offer and audience if you're starting from nothing. You'll get distinct variants, each built on a different persuasion angle, plus a plan for how to test them.",
    placeholder: "Paste your current copy (or describe the offer) and say who it's for…",
    suggestions: [
      "Write 4 headline variants for a landing page selling a $29/mo invoicing app to freelancers. Current: \"Invoicing made simple.\"",
      "A/B test my Google Ads headline: \"Affordable web design for small business\". Audience: local restaurants and salons.",
      "Give me 3 variants of this email subject line for a SaaS onboarding sequence: \"Welcome to Acme — let's get started\"",
      "Write a landing-page hero (headline + subheadline + button) from scratch for a meal-prep delivery service for busy parents in Chicago.",
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
      "Make a QR code for https://launchabl.io in Launchabl orange with fluid modules and rounded eyes.",
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
  {
    slug: "voice-search-optimizer",
    intro:
      "Give me a URL and I'll score how ready the page is to be read aloud by Google Assistant, Siri and Alexa — question headings, snippet-length answers, FAQ schema, speed — then write the FAQ section and JSON-LD that gets you chosen as the answer.",
    placeholder: "Paste a page URL, e.g. https://example.com/pricing",
    suggestions: [
      "How voice-search ready is https://vercel.com/pricing?",
      "Audit https://example.com/services for voice search and write the FAQ schema",
      "We're a local plumber. Check https://example.com and tell me what to add for “near me” searches",
      "Turn the questions on https://example.com/faq into FAQPage JSON-LD",
    ],
    artifacts: ["analyzeVoiceSearch", "deliverFaqSchema", "fetchPage"],
  },
  {
    slug: "compliance-scanner",
    intro:
      "Paste a URL and I'll scan it the way a privacy regulator or a cautious visitor would: trackers firing before consent, missing privacy or cookie policies, insecure cookies, weak security headers, accessibility basics — then tell you what to fix first and how.",
    placeholder: "Paste a page URL — the homepage or a signup/checkout page is best",
    suggestions: [
      "Scan https://vercel.com for compliance issues",
      "Is https://example.com GDPR compliant? Our customers are mostly in Germany and France.",
      "Check https://example.com/signup — we collect emails and run Meta ads",
      "Which laws apply to my site if I sell to the US and the EU?",
    ],
    artifacts: ["scanCompliance"],
  },
  {
    slug: "llm-readability-check",
    intro:
      "Give me a URL and I'll check whether ChatGPT, Perplexity, Claude and Google's AI Overviews can reach, read and cite it — which AI crawlers your robots.txt allows, whether you have an llms.txt, how clearly the page states what it is, and what structured data it carries. Then I'll draft what's missing.",
    placeholder: "Paste a page URL, e.g. https://example.com/docs",
    suggestions: [
      "How readable is https://vercel.com/docs for AI search engines?",
      "Check https://example.com and tell me which AI crawlers we're blocking",
      "Draft an llms.txt for https://example.com",
      "Make https://example.com/blog/our-guide easier for ChatGPT to cite",
    ],
    artifacts: ["analyzeLlmReadability", "deliverDocument", "fetchPage"],
  },
  {
    slug: "email-newsletter-builder",
    intro:
      "Tell me what the email is about — a product update, a promotion, a monthly digest — and who it's for, or paste a link to the announcement. You'll get a subject line, preheader, a table-based HTML email that renders everywhere, and a plain-text version, previewed on desktop and mobile.",
    placeholder: "e.g. Monthly update for our 4,000 SaaS customers: new dashboard, 2 integrations, webinar on the 21st…",
    suggestions: [
      "Write a product-update newsletter announcing our new analytics dashboard, Slack integration and a webinar next Thursday. Brand: Ledgerly, navy and mint.",
      "Turn https://vercel.com/blog into a weekly digest email for developers with three highlights and one CTA.",
      "A re-engagement email for customers who haven't logged in for 60 days. Friendly, short, one button back to the app.",
      "Black Friday promo: 30% off annual plans until Monday. Urgent but not shouty, one CTA, dark theme.",
    ],
    artifacts: ["deliverEmail", "fetchPage"],
  },
  {
    slug: "website-audit-report",
    intro:
      "Paste a URL and I'll audit the page the way a technical SEO would — title and description, headings, canonical, indexability, structured data, Open Graph, alt text, speed, security headers and more — then tell you what to fix first and which of our tools goes deeper on each problem.",
    placeholder: "Paste a page URL, e.g. https://example.com",
    suggestions: [
      "Audit https://vercel.com",
      "Run a full SEO audit on https://example.com/pricing and tell me what to fix first",
      "Why isn't https://example.com/blog/our-post showing a preview when shared on LinkedIn?",
      "Audit https://example.com — we're a WordPress site and it feels slow",
    ],
    artifacts: ["auditWebsite"],
  },
  {
    slug: "landing-page-grader",
    intro:
      "Give me a landing page URL — and, if you like, who lands on it and from where — and I'll grade it for conversion: headline clarity, calls to action, form friction, trust signals, distractions and speed. Then I'll rewrite the hero if you want.",
    placeholder: "Paste a landing page URL and say what the visitor should do…",
    suggestions: [
      "Grade https://vercel.com/pricing for conversion",
      "Grade https://example.com/free-trial — visitors come from Google Ads for “invoicing software”",
      "Why isn't https://example.com/webinar converting? Rewrite the hero.",
      "Compare the CTAs on https://example.com and tell me which one to keep",
    ],
    artifacts: ["gradeLandingPage", "fetchPage"],
  },
  {
    slug: "competitor-gap-report",
    intro:
      "Give me your page and one to three competitors' equivalent pages. I'll fetch them all, compare them on identical signals — content depth, structure, schema, speed, security, sharing — and show you exactly where you're behind, where you lead, and which terms they use that you don't.",
    placeholder: "Your URL first, then competitors: https://mysite.com, https://competitor.com…",
    suggestions: [
      "Compare https://vercel.com with https://netlify.com and https://render.com",
      "My site is https://example.com — compare it to https://competitor-a.com and https://competitor-b.com",
      "Compare our pricing page https://example.com/pricing against https://competitor.com/pricing",
      "Where is https://example.com behind https://competitor.com on technical SEO?",
    ],
    artifacts: ["compareSites", "fetchPage"],
  },
  {
    slug: "sitemap-robots-generator",
    intro:
      "Give me your homepage and I'll crawl the site — following real links, skipping redirects, errors and noindex pages — then build a sitemap.xml and a matching robots.txt you can download. Tell me what to leave out, or whether to block AI training crawlers.",
    placeholder: "Paste your homepage, e.g. https://example.com",
    suggestions: [
      "Generate a sitemap and robots.txt for https://vercel.com/docs",
      "Crawl https://example.com and build the sitemap, but leave out /tag/ and /author/ pages",
      "Sitemap for https://example.com and a robots.txt that blocks AI training crawlers but keeps AI search",
      "Does https://example.com already have a sitemap? Compare it with what's actually linked.",
    ],
    artifacts: ["generateSitemap"],
  },
  {
    slug: "schema-generator",
    intro:
      "Paste a URL and I'll read the page and write the right schema.org JSON-LD for it — Organization, LocalBusiness, Product, Article, FAQ, Event, JobPosting and more — validated against the required properties, with a copy-ready script tag. Or describe the business and I'll build it from that.",
    placeholder: "Paste a page URL, or describe the page and business…",
    suggestions: [
      "Write schema markup for https://vercel.com/pricing",
      "Generate LocalBusiness schema for a dental clinic in Austin, TX: Bright Smile Dental, 512-555-0100, open Mon–Fri 8–5",
      "Turn the questions on https://example.com/faq into FAQPage JSON-LD",
      "Product schema for https://example.com/products/blue-widget with price and availability",
    ],
    artifacts: ["deliverSchema", "fetchPage"],
  },
  {
    slug: "local-seo-optimizer",
    intro:
      "Tell me about the business — what it does and where, or just paste its website — and I'll build the full local-search kit: Google Business Profile description and categories, services, local keywords, Q&A, review responses, a month of posts, review-request messages, LocalBusiness schema and a launch checklist.",
    placeholder: "e.g. Family-run plumbing company in Leeds, 24h emergency callouts, 15 years…",
    suggestions: [
      "Build a local SEO kit for a family-run plumber in Leeds, UK: 24-hour emergency callouts, boiler repairs, 15 years in business",
      "Local SEO kit from this website: https://example.com",
      "Google Business Profile description and categories for a vegan bakery in Portland, Oregon",
      "Write review responses for a dental clinic — including one for a 2-star review about waiting times",
    ],
    artifacts: ["deliverLocalSeoKit", "fetchPage"],
  },
  {
    slug: "content-campaign-calendar",
    intro:
      "Tell me what you sell, who it's for, the goal and how much you can publish — or paste your site — and I'll plan a dated, multi-channel content calendar where every piece has a real angle and brief. Filter by channel, expand any entry, download as CSV, ICS or JSON.",
    placeholder: "e.g. 30-day plan for a B2B invoicing app, goal: trials, channels: LinkedIn + blog + newsletter…",
    suggestions: [
      "30-day content calendar for Ledgerly, a $29/mo invoicing app for freelancers. Goal: free-trial signups. Channels: LinkedIn, blog, newsletter. Solo founder.",
      "Plan a 6-week product launch campaign for https://vercel.com/blog across X, LinkedIn and email",
      "Two-week Instagram and TikTok plan for a Portland coffee roaster — goal: foot traffic and online orders",
      "Quarterly (90-day) thought-leadership plan for a B2B cybersecurity consultancy: LinkedIn 3×/week, one blog a week, monthly webinar",
    ],
    artifacts: ["deliverCalendar", "fetchPage"],
  },
  {
    slug: "dns-email-health",
    intro:
      "Give me your sending domain and I'll read its DNS the way Gmail and Microsoft do — MX, SPF (including the 10-lookup budget), DMARC policy and reporting, DKIM across the selectors common providers use, MTA-STS and BIMI — then write the exact records to publish.",
    placeholder: "Paste a domain, e.g. example.com — and your DKIM selector or sending tools if you know them",
    suggestions: [
      "Check email deliverability for vercel.com",
      "Why are our emails from example.com landing in spam? We send from Google Workspace and HubSpot.",
      "Audit example.com's DMARC and tell me how to move from p=none to reject safely",
      "Check DKIM for example.com — our selector is selector1 (Microsoft 365)",
    ],
    artifacts: ["checkDnsEmail"],
  },
  {
    slug: "security-headers-checker",
    intro:
      "Paste a URL and I'll grade its HTTP security posture — HTTPS and HSTS, Content-Security-Policy quality, framing, MIME sniffing, referrer and permissions policies, cookie flags, version leaks — then write the header config for your stack.",
    placeholder: "Paste a page URL and, if you like, your stack (Next.js, nginx, Cloudflare, WordPress…)",
    suggestions: [
      "Grade the security headers on https://vercel.com",
      "Check https://example.com and write the headers for a Next.js app on Vercel",
      "Is our CSP any good? https://example.com — we use Google Tag Manager and Stripe",
      "Audit https://example.com and give me the nginx config to fix it",
    ],
    artifacts: ["checkSecurityHeaders"],
  },
  {
    slug: "accessibility-checker",
    intro:
      "Give me a URL and I'll run a WCAG 2.2 scan of the HTML — language, zoom, headings and landmarks, alt text and its quality, form labels, nameless buttons and links, iframes, media, focus and tab order — and list the exact elements to fix.",
    placeholder: "Paste a page URL, e.g. https://example.com/signup",
    suggestions: [
      "Check accessibility on https://vercel.com",
      "Scan https://example.com/signup — a customer said the form doesn't work with a screen reader",
      "Audit https://example.com for WCAG 2.2 AA and tell me what a lawsuit would cite first",
      "Which images on https://example.com/products are missing alt text?",
    ],
    artifacts: ["auditAccessibility"],
  },
  {
    slug: "ssl-certificate-checker",
    intro:
      "Tell me a domain and I'll open a real TLS connection — trust and chain, expiry, key strength, which names the certificate covers, protocol and cipher, whether TLS 1.0/1.1 are still on, and whether HTTP redirects to HTTPS with HSTS.",
    placeholder: "Paste a domain, e.g. example.com",
    suggestions: [
      "Check the SSL certificate for vercel.com",
      "Is example.com's certificate about to expire? Check both example.com and www.example.com",
      "Visitors see a certificate warning on https://example.com — what's wrong?",
      "Audit TLS on example.com for a PCI scan — protocols and ciphers too",
    ],
    artifacts: ["checkSsl"],
  },
  {
    slug: "email-finder",
    intro:
      "Give me a name and a company and I'll work out the most likely work email — from the address pattern the company actually uses on its own site, the common conventions, and whether the domain accepts mail — then help you write a message worth answering.",
    placeholder: "e.g. Jane Doe at acme.com",
    suggestions: [
      "Find the work email for Guillermo Rauch at vercel.com",
      "Likely emails for Jane Doe and Sam Lee at acme.com — we want to pitch a partnership",
      "What email pattern does example.com use?",
      "Find Jane Doe's email at acme.com and draft a 100-word intro about our analytics tool",
    ],
    artifacts: ["findEmail"],
  },
  {
    slug: "ai-image-generator",
    intro:
      "Tell me what the image is for and what should be in it. I'll write the art direction — style, lighting, palette, composition for the channel — and render it in the right aspect ratio. Then ask for a different style, a variation set, or another size.",
    placeholder: "e.g. Hero image for a fintech landing page: calm, editorial, soft light, no people, 16:9",
    suggestions: [
      "Hero image for a landing page selling a meal-prep service to busy parents — warm, natural light, real kitchen, 16:9",
      "Instagram ad for a matte-black insulated water bottle on a wet stone, dramatic side light, 4:5",
      "Blog header for an article about remote-team rituals: flat illustration, Launchabl orange and cream, 3:2",
      "App icon concept for a habit tracker: a single bold glyph, soft gradient, 1:1 — give me 3 options",
      "Link-preview background for a webinar on SaaS pricing: abstract, dark navy, no text, 1.91:1",
    ],
    artifacts: ["generateImage"],
  },
  {
    slug: "social-card-generator",
    intro:
      "Give me the page or announcement — a URL, a title, a few lines — plus your brand name and colour if you have one. I'll design the link-preview card and social versions with the text set exactly, and you can edit the copy, switch theme or layout, and download PNGs in every size.",
    placeholder: "e.g. OG card for our guide 'Local SEO for restaurants' — brand Launchabl, orange, dark theme",
    suggestions: [
      "OG card for https://vercel.com/pricing",
      "Launch card: 'Introducing Ledgerly 2.0 — invoicing that chases the money for you'. Brand Ledgerly, #2563EB, centred, with generated abstract art.",
      "Editorial card for a blog post 'Why your DMARC policy is still p=none' by Sam Lee, Head of Deliverability. Brand: Launchabl.",
      "Event card: 'Webinar · Sep 30 · Pricing pages that convert' for Acme Analytics, light theme, split layout.",
    ],
    artifacts: ["designSocialCard", "generateImage"],
  },
  {
    slug: "utm-builder",
    intro:
      "Give me the destination and the places the link will live — LinkedIn post, newsletter, Google Ads, a partner mention, a QR on print — and I'll build the full set of tracked links with one clean naming convention, flag anything that would fragment your reports, and hand you a CSV.",
    placeholder: "e.g. https://example.com/pricing for our Q4 launch: LinkedIn, X, newsletter, Google Ads (keyword: invoicing software)",
    suggestions: [
      "UTM links for https://launchabl.io/tools — campaign: 2026_q4_agent_launch — LinkedIn post, X thread, newsletter, Product Hunt",
      "Build tracked links for a Black Friday sale at https://example.com/sale across Meta ads (3 creatives), Google Ads, email, and SMS",
      "One link per partner for https://example.com/partners: Notion, Zapier, Webflow — referral traffic",
      "Fix these: https://example.com/?utm_source=LinkedIn&utm_medium=Social%20Media&utm_campaign=Spring Launch",
    ],
    artifacts: ["buildUtmLinks"],
  },
  {
    slug: "persona-generator",
    intro:
      "Describe what you sell and roughly what it costs — or paste your site — and I'll define the ideal customer profile and the two to four buyer personas behind it: goals, pains, buying triggers, objections with answers, where they hang out, the words they use, the proof they need, and the anti-persona to say no to.",
    placeholder: "e.g. $49/mo scheduling software for independent physiotherapy clinics, sold self-serve…",
    suggestions: [
      "ICP and personas for Ledgerly, a $29/mo invoicing app for freelancers that chases late payments automatically",
      "Personas from this site: https://vercel.com",
      "Buyer personas for a $40k/year compliance platform sold to fintech startups — who's the champion, who signs, who blocks?",
      "Who is the ideal customer for a Portland coffee roaster's wholesale program, and who isn't?",
    ],
    artifacts: ["deliverPersonas", "fetchPage"],
  },
  {
    slug: "subject-line-checker",
    intro:
      "Paste your subject lines (and preview text if you have it). I'll score each one for what filters and inboxes punish — length and mobile cut-off, shouting, trigger words, fake replies, generic phrasing, weak preview text — then write stronger alternatives and prove they score higher.",
    placeholder: "Paste one or more subject lines, one per line — add preview text after a dash if you have it…",
    suggestions: [
      "Score: \"FREE trial — act now!!! Limited time offer\" and \"Our monthly newsletter\"",
      "Check this subject and preview: \"Your invoice is overdue\" — \"Pay now to avoid late fees\"",
      "Rewrite \"Introducing our new dashboard\" for a product-update email to 4,000 SaaS customers",
      "Five subject lines for a re-engagement email to customers who haven't logged in for 60 days",
    ],
    artifacts: ["scoreSubjectLines"],
  },
  {
    slug: "press-release-generator",
    intro:
      "Tell me the news — a launch, funding, partnership, hire, milestone — with the company, date and who's quoted, or paste the company's site. I'll write an AP-style release journalists can run: headline, dateline, lede, body, attributed quotes, boilerplate and media contact, checked against newsroom standards.",
    placeholder: "e.g. Ledgerly launches automatic payment reminders on Oct 1, Austin TX, quote from CEO Jane Doe…",
    suggestions: [
      "Press release: Ledgerly launches Ledgerly 2.0 with automatic payment chasing, Oct 1 2026, Austin, Texas. CEO Jane Doe quoted. Customers: 12,000 freelancers.",
      "Funding announcement: Acme Analytics raises $4M seed led by Example Ventures to expand into Europe. Quotes from CEO and lead investor.",
      "Partnership release for https://vercel.com with a fictional design agency — I'll fill in names",
      "We hired a new VP of Sales, Sam Lee, from Big Corp. Write the release for a Series A B2B startup in London.",
    ],
    artifacts: ["deliverPressRelease", "fetchPage"],
  },
  {
    slug: "qa-test-plan-generator",
    intro:
      "Describe the feature, release or flow — or paste the page URL — and I'll write a test plan someone can run today: prioritised scenarios with exact steps, test data and expected results, negative and edge cases, an accessibility pass, a device matrix, exit criteria and risks. Filter by area or priority; export CSV or Markdown.",
    placeholder: "e.g. New checkout with Stripe, promo codes and guest checkout — web, mobile Safari matters…",
    suggestions: [
      "Test plan for a new sign-up flow: email + password, Google OAuth, email verification, on web and mobile web",
      "QA plan for the pricing page at https://vercel.com/pricing before a redesign ships",
      "Regression plan for a Shopify checkout after adding promo codes and Apple Pay",
      "Test plan for a REST API: POST /invoices with validation, auth, rate limits and idempotency",
    ],
    artifacts: ["deliverTestPlan", "fetchPage"],
  },
  {
    slug: "content-repurposer",
    intro:
      "Paste a blog post, transcript or case study — or its URL — and I'll rewrite it natively for each channel: a LinkedIn post with a real hook, an X thread in tweets, a newsletter section, an Instagram caption, a YouTube description, a short-video script, quote cards. Each checked against the channel's limits, with copy buttons.",
    placeholder: "Paste the article or a URL, and name the channels if you have preferences…",
    suggestions: [
      "Repurpose https://vercel.com/blog for LinkedIn, an X thread and our newsletter",
      "Turn this case study into a LinkedIn post, 5 quote cards and a 45-second video script: [paste]",
      "Make a week of posts (LinkedIn, X, Instagram) from our launch notes: [paste]",
      "Repurpose this podcast transcript into a newsletter section, a YouTube description and a Reddit post with no pitch: [paste]",
    ],
    artifacts: ["deliverRepurposed", "fetchPage"],
  },
  {
    slug: "agent",
    intro:
      "Every Launchabl skill in one conversation. Describe the job — launch this page, fix our email, beat this competitor, get us clients — and I'll chain the audits, checks, copy, design and files it takes, then hand over the deliverables.",
    placeholder: "Describe the job and paste any URLs. e.g. Launch https://example.com/pricing properly — audit, meta tags, schema, OG card, fix list.",
    suggestions: [
      "Audit https://vercel.com, check its security headers and certificate, and give me one prioritised fix list.",
      "Our emails from example.com go to spam. Diagnose it and give me the exact records to publish.",
      "Compare https://linear.app against https://asana.com and https://monday.com and tell me what they own that Linear doesn't.",
      "Write three hero variants and an OG card for a $29/mo invoicing app for freelancers called Ledgerly.",
    ],
    artifacts: [],
    starter: "agent",
    starterBelowIntro: true,
  },
];

const bySlug = new Map(metas.map((meta) => [meta.slug, meta]));

export function getChatTool(slug: string): ChatToolMeta | undefined {
  return bySlug.get(slug);
}

export function listChatTools(): ChatToolMeta[] {
  return metas;
}
