/**
 * Golden briefs. One realistic job per high-traffic skill plus two agent
 * chains. Each case says which deliverable tools a correct run must call
 * and what a demanding reviewer should check for. Network-dependent cases
 * point at large, stable sites so results move with our prompts, not with
 * someone's staging server.
 */

export type EvalCase = {
  id: string;
  slug: string;
  prompt: string;
  /** Tools a correct run must call at least once (any of the listed names per entry, `a|b`). */
  expectTools: string[];
  /** What the judge should insist on, beyond the brief itself. */
  rubric: string;
  /** Rough cost class so the admin UI can warn before running the expensive ones. */
  cost: "cheap" | "model" | "media";
};

export const EVAL_CASES: EvalCase[] = [
  {
    id: "variants-saas-hero",
    slug: "ab-copy-variants",
    prompt: "Hero headline for Ledgerly, an invoicing tool for freelancers who bill businesses. Audience: designers and developers with 3–10 clients. Tone: confident, plain. Three variants.",
    expectTools: ["deliverVariants"],
    rubric: "Exactly three variants with distinct persuasion angles; each names the audience implicitly; no hype words (revolutionary, seamless, supercharge); a usable test plan.",
    cost: "model",
  },
  {
    id: "meta-stripe-pricing",
    slug: "meta-tag-generator",
    prompt: "Write meta tags for https://stripe.com/pricing",
    expectTools: ["fetchPage", "deliverMetaTags"],
    rubric: "Title under 60 characters and description under 160; reflects what the page actually says (pricing, per-transaction fees); Open Graph fields present.",
    cost: "cheap",
  },
  {
    id: "audit-vercel",
    slug: "website-audit-report",
    prompt: "Audit https://vercel.com",
    expectTools: ["auditWebsite"],
    rubric: "Findings are specific to the fetched page, prioritised by impact, each with a concrete fix. No generic advice that would apply to any site.",
    cost: "cheap",
  },
  {
    id: "dns-stripe",
    slug: "dns-email-health",
    prompt: "Check email deliverability for stripe.com",
    expectTools: ["checkDnsEmail"],
    rubric: "Reports the real SPF, DKIM and DMARC state; recommendations match what was found (does not tell a domain with p=reject to add DMARC).",
    cost: "cheap",
  },
  {
    id: "subject-lines-launch",
    slug: "subject-line-checker",
    prompt: "Score these subject lines for a product launch email to existing customers: 'We just shipped something big', 'Introducing Ledgerly Payments', 'Your invoices can now collect themselves', 'FREE upgrade inside!!!'",
    expectTools: ["scoreSubjectLines"],
    rubric: "All four lines scored; the spammy one ('FREE … !!!') ranked lowest with the reason; at least one improved rewrite per weak line.",
    cost: "model",
  },
  {
    id: "utm-launch",
    slug: "utm-builder",
    prompt: "UTM links for https://ledgerly.app/launch across a LinkedIn post, a newsletter, and a Product Hunt listing. Campaign: q4 launch.",
    expectTools: ["buildUtmLinks"],
    rubric: "Three links, one per placement; consistent lowercase snake-case campaign; standard utm_medium values (social, email, referral); no spaces in parameters.",
    cost: "cheap",
  },
  {
    id: "personas-b2b",
    slug: "persona-generator",
    prompt: "Personas for Ledgerly, an invoicing tool for freelancers who bill businesses. Priced at $12/month. Competitors: FreshBooks, Bonsai.",
    expectTools: ["deliverPersonas"],
    rubric: "Two to four personas that are actually distinct (different jobs-to-be-done, not the same person with a new name); each has objections and a channel they can be reached on; ties back to the $12 price point.",
    cost: "model",
  },
  {
    id: "newsletter-changelog",
    slug: "email-newsletter-builder",
    prompt: "Monthly newsletter for Ledgerly customers. News: automatic payment reminders shipped; multi-currency invoices in beta; a webinar on getting paid faster on 24 Oct. Tone: friendly, short.",
    expectTools: ["deliverEmail"],
    rubric: "Covers all three items; one clear primary CTA; preview text present; subject line under 50 characters; reads as friendly and short, not corporate.",
    cost: "model",
  },
  {
    id: "repurpose-blog",
    slug: "content-repurposer",
    prompt: "Repurpose this for LinkedIn, an X thread and a newsletter section:\n\nLate payments cost freelancers an average of 20 working days a year. Most of that is chasing: the awkward follow-up, the second reminder, the 'just checking in'. Automating reminders recovers most of that time — invoices with scheduled reminders get paid 11 days sooner on average. The trick is tone: reminders should read like a helpful nudge from a person, not a system notice.",
    expectTools: ["deliverRepurposed"],
    rubric: "Three pieces on the requested channels only; each is native to its channel (thread parts under 280 characters, LinkedIn hook in the first line); uses the source's figures (20 days, 11 days) without inventing new statistics.",
    cost: "model",
  },
  {
    id: "schema-local",
    slug: "schema-generator",
    prompt: "LocalBusiness schema for Bright Smile Dental, 14 High Street, Bristol BS1 4DJ, open Mon–Fri 8:30–18:00, phone 0117 946 0000, https://brightsmilebristol.co.uk",
    expectTools: ["deliverSchema"],
    rubric: "Valid JSON-LD with @type Dentist or LocalBusiness; address, openingHoursSpecification and telephone match the brief exactly; no invented fields like aggregateRating.",
    cost: "cheap",
  },
  {
    id: "press-release-funding",
    slug: "press-release-generator",
    prompt: "Press release: Ledgerly raises $4M seed led by Point Nine to build invoicing for freelancers. Quote from CEO Maya Chen. London, today. Media contact press@ledgerly.app.",
    expectTools: ["deliverPressRelease"],
    rubric: "AP-style dateline; lede answers who/what/when/why in the first sentence; one quote attributed to Maya Chen, CEO; boilerplate and media contact included; no marketing adjectives in the headline.",
    cost: "model",
  },
  {
    id: "calendar-two-weeks",
    slug: "content-campaign-calendar",
    prompt: "Two-week content calendar for Ledgerly's launch on LinkedIn and X. Themes: getting paid faster, freelancer finance tips, product tips. Three posts a week per channel.",
    expectTools: ["deliverCalendar"],
    rubric: "Twelve entries (2 weeks × 2 channels × 3); each has a date, channel, hook and format; themes rotate rather than cluster; no two entries are the same idea reworded.",
    cost: "model",
  },
  {
    id: "qr-review-link",
    slug: "qr-code-generator",
    prompt: "QR code for our Google review link https://g.page/r/brightsmile/review, dark green on white, rounded modules, room for our logo in the middle.",
    expectTools: ["designQr"],
    rubric: "The QR encodes exactly the given URL; foreground is a dark green on a white background; module shape is rounded (or fluid); a logo slot is reserved with error correction H.",
    cost: "cheap",
  },
  {
    id: "agent-launch-chain",
    slug: "agent",
    prompt: "We're launching Ledgerly (invoicing for freelancers who bill businesses) next Tuesday. Give me the hero headline options, a LinkedIn launch post and UTM links for LinkedIn and our newsletter. Landing page: https://ledgerly.app/launch",
    expectTools: ["deliverVariants", "deliverRepurposed|deliverEmail", "buildUtmLinks", "reviewDeliverables"],
    rubric: "All three deliverables produced and consistent with each other (same positioning, same launch date); the review step ran; the closing reply is a short numbered handover, not a restatement.",
    cost: "model",
  },
  {
    id: "agent-health-chain",
    slug: "agent",
    prompt: "Is https://vercel.com healthy and secure? Give me one prioritised list.",
    expectTools: ["auditWebsite|checkSecurityHeaders|checkSsl|auditAccessibility"],
    rubric: "At least two independent checks ran; the reply merges their findings into one prioritised list rather than repeating each tool's output; findings are specific to the site.",
    cost: "cheap",
  },
  {
    id: "domain-brand-pick",
    slug: "domain-purchase",
    prompt: "Brand is \"Northwind Traders\", a B2B analytics startup. Which domain should I buy?",
    expectTools: ["checkDomains", "deliverDomainPlan"],
    rubric: "Availability was actually checked before recommending; the recommendation is a domain marked available; the reasoning covers memorability and what the TLD signals; renewal pricing or a TLD caveat is mentioned; taken domains are not proposed as the pick.",
    cost: "cheap",
  },
  {
    id: "hosting-nextjs-budget",
    slug: "hosting",
    prompt: "Where should I host a Next.js marketing site with a blog for a small business? Domain is acme.com, budget under $25/month, ~3k visits a month.",
    expectTools: ["deliverHostingPlan"],
    rubric: "Recommends a provider suited to Next.js (Vercel or a close alternative) with a specific plan and realistic monthly cost; does not recommend Vercel's Hobby plan for a commercial site without flagging the restriction; alternatives explain when to choose them; the plan includes a launch checklist.",
    cost: "cheap",
  },
];

export function findEvalCase(id: string): EvalCase | undefined {
  return EVAL_CASES.find((c) => c.id === id);
}
