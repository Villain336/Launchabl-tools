/**
 * Agent job templates: end-to-end workflows with a business outcome, not
 * single tool runs. Each prompt is written the way a good client brief
 * reads, with [bracketed] slots the person fills in before sending.
 */

export type AgentTemplate = {
  id: string;
  title: string;
  outcome: string;
  category: "launch" | "traffic" | "email" | "trust" | "sales" | "content" | "ads" | "local" | "ai";
  /** Skills the agent will typically chain, shown as chips. */
  skills: string[];
  /** Roughly how long the run takes, to set expectations. */
  minutes: number;
  prompt: string;
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "launch-page",
    title: "Launch a page the right way",
    outcome: "Audit, conversion grade, meta tags, schema and a link-preview card — fixed before anyone sees it.",
    category: "launch",
    skills: ["Website audit", "Landing page grade", "Meta tags", "Schema", "Social card"],
    minutes: 4,
    prompt:
      "We're launching this page: [URL]. Run the full pre-launch pass: audit it, grade it for conversion, write the meta tags and schema it should ship with, and design the Open Graph card. Then give me the fix-first list ordered by impact, and tell me what to change in the hero if it's weak.",
  },
  {
    id: "fix-email",
    title: "Stop our email landing in spam",
    outcome: "SPF, DKIM, DMARC diagnosed with the exact records to publish and a safe path to enforcement.",
    category: "email",
    skills: ["DNS & email health", "Records to publish", "DMARC rollout plan"],
    minutes: 2,
    prompt:
      "Our emails from [domain] are landing in spam or bouncing. Check the domain's email authentication, tell me exactly what's wrong in plain language, give me the exact DNS records to publish for our provider, and lay out the safe path from where we are to DMARC p=reject with what to watch each week.",
  },
  {
    id: "beat-competitor",
    title: "Outrank a competitor",
    outcome: "Side-by-side gap report, the terms they own that you don't, and a 30-day content plan to close the gap.",
    category: "traffic",
    skills: ["Competitor gap report", "Content calendar", "Meta tags"],
    minutes: 5,
    prompt:
      "Our page: [our URL]. Competitors: [competitor URL 1], [competitor URL 2]. Compare us on every signal, tell me where we're behind and where we lead, list the terms they use that we don't, then turn the gaps into a 30-day content and on-page plan I can start Monday. Rewrite our title and description if theirs are stronger.",
  },
  {
    id: "site-health",
    title: "Full site health & security sweep",
    outcome: "Audit, security headers, certificate, accessibility and broken links in one prioritised fix list.",
    category: "trust",
    skills: ["Website audit", "Security headers", "SSL/TLS", "Accessibility", "Broken links"],
    minutes: 4,
    prompt:
      "Run a complete health and security sweep on [URL]: the technical audit, security headers, TLS certificate, accessibility, and broken links. Merge everything into one prioritised list — what's a risk today, what costs us conversions, what's cosmetic — with the exact fix for each and the header configuration for our stack ([Next.js / WordPress / nginx / other]).",
  },
  {
    id: "announce",
    title: "Launch announcement kit",
    outcome: "Hero copy variants, the announcement email, a social card and a hero visual — ready to schedule.",
    category: "launch",
    skills: ["Copy variants", "Press release", "Email", "Subject lines", "Social card", "UTM links"],
    minutes: 6,
    prompt:
      "We're announcing [what you're launching] for [who it's for] on [date]. Brand: [brand name, site, colour if you have one]. Write three hero headline + subheadline variants on different angles, the press release (quote from [name, title]), and the announcement email to our list with its subject line scored against alternatives. Design the social card for the launch post and build tracked links for [LinkedIn, X, newsletter, Product Hunt]. Keep the tone [confident / playful / technical].",
  },
  {
    id: "local",
    title: "Get a local business found",
    outcome: "Google Business Profile kit, local schema, review responses, GBP posts and a review QR code.",
    category: "local",
    skills: ["Local SEO kit", "LocalBusiness schema", "QR code"],
    minutes: 4,
    prompt:
      "Local business: [name], [what it does], in [city/area]. Website: [URL or 'none yet']. Build the full local presence: the GBP description and categories, services, the phrases customers actually search, seeded Q&A, review responses, a month of posts, and LocalBusiness schema. Then make a QR code that opens our Google review link: [review link or 'use a placeholder'].",
  },
  {
    id: "outreach",
    title: "Cold outreach that gets replies",
    outcome: "The prospect's likely email, their company's context, and a short outreach sequence with subject-line options.",
    category: "sales",
    skills: ["Email finder", "Page read", "Subject lines"],
    minutes: 3,
    prompt:
      "I want to reach [full name], [role] at [company domain]. We sell [what you sell] and the reason they should care is [the one thing]. Find their most likely work email, read their company's site for context I can reference, then write a 3-touch outreach sequence (day 0, 3, 7) under 90 words each, with four subject-line options for the first email scored so I know which to send.",
  },
  {
    id: "positioning",
    title: "Who to sell to, and how",
    outcome: "Ideal customer profile, buyer personas with objections and messaging, then hero copy for the primary persona.",
    category: "sales",
    skills: ["ICP & personas", "Page read", "Copy variants"],
    minutes: 4,
    prompt:
      "Product: [what it is, price]. Site: [URL or 'none yet']. Define our ideal customer profile and the buyer personas behind it — goals, pains, buying triggers, objections with answers, where they hang out, the words they use — plus the anti-persona to turn away. Then write three hero headline + subheadline variants aimed at the primary persona, in their vocabulary.",
  },
  {
    id: "distribute",
    title: "Distribute an article everywhere",
    outcome: "Native posts for every channel, tracked links for each placement, and a schedule for the week.",
    category: "content",
    skills: ["Content repurposer", "UTM links", "Content calendar"],
    minutes: 4,
    prompt:
      "Repurpose this piece: [article URL or paste the text]. Channels: [LinkedIn, X thread, newsletter, Instagram, YouTube, short video]. Rewrite it natively for each, build a tracked link for every placement (campaign: [campaign name]), and lay the pieces out on a 7-day schedule starting [date]. Voice: [ours / the author's], audience: [who].",
  },
  {
    id: "content-engine",
    title: "90-day content engine",
    outcome: "A dated multi-channel calendar built on pillars, with link-preview cards for the first posts.",
    category: "content",
    skills: ["Content calendar", "Meta tags", "Social cards"],
    minutes: 5,
    prompt:
      "Business: [what you do] for [audience]. Goal for the next 90 days: [leads / signups / launches / authority]. Channels we can realistically sustain: [e.g. blog weekly, LinkedIn 3×/week, newsletter monthly]. Site: [URL]. Build the 90-day calendar on 3–4 content pillars with real hooks and briefs, then design the social card for the first two posts so we can start publishing today.",
  },
  {
    id: "ad-sprint",
    title: "Ad creative sprint",
    outcome: "Copy variants on distinct angles plus matching creatives in feed, story and landscape sizes.",
    category: "ads",
    skills: ["Copy variants", "Image generation"],
    minutes: 5,
    prompt:
      "Product: [what it is and the price]. Audience: [who]. Platform: [Meta / Google / LinkedIn / TikTok]. Current best ad copy, if any: [paste or 'none']. Write five ad copy variants on different persuasion angles with a test plan, then generate creatives for the top two angles in 4:5 and 9:16. Brand palette: [colours or 'infer from the site URL].",
  },
  {
    id: "ai-ready",
    title: "Make the site AI-search ready",
    outcome: "LLM readability and voice-search fixes, FAQ schema, and an llms.txt file ready to deploy.",
    category: "ai",
    skills: ["LLM readability", "Voice search", "FAQ schema", "llms.txt"],
    minutes: 4,
    prompt:
      "Make [URL] easy for ChatGPT, Perplexity, Google AI Overviews and voice assistants to understand and cite. Check how readable it is for LLMs and for voice queries, fix what's blocking us, write FAQ schema from the questions our customers actually ask about [topic], and produce an llms.txt file for the site.",
  },
];

export const CATEGORY_LABEL: Record<AgentTemplate["category"], string> = {
  launch: "Launch",
  traffic: "Traffic",
  email: "Email",
  trust: "Trust & security",
  sales: "Sales",
  content: "Content",
  ads: "Ads",
  local: "Local",
  ai: "AI search",
};
