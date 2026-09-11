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
];

const bySlug = new Map(metas.map((meta) => [meta.slug, meta]));

export function getChatTool(slug: string): ChatToolMeta | undefined {
  return bySlug.get(slug);
}

export function listChatTools(): ChatToolMeta[] {
  return metas;
}
