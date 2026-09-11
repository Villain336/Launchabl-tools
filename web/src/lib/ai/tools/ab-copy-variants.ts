import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";

export const variantSchema = z.object({
  label: z.string().describe("Short variant name, e.g. 'A — Outcome' or 'B — Social proof'"),
  angle: z
    .string()
    .describe("The persuasion angle in 2–5 words: outcome, pain relief, social proof, curiosity, urgency, specificity, contrast, identity"),
  headline: z.string().describe("The primary line of copy. For CTAs and subject lines this is the whole variant."),
  body: z.string().optional().describe("Supporting line, only for formats that have one (hero, ad, email)."),
  cta: z.string().optional().describe("Call-to-action text if the format includes a button or link."),
  why: z.string().describe("One sentence on why this variant might beat the control, tied to the audience."),
});

export const deliverVariantsSchema = z.object({
  asset: z.string().describe("What is being tested: headline, hero, ad, email subject, CTA, etc."),
  audience: z.string().describe("Who the copy is for, in the user's words where possible."),
  control: z.string().optional().describe("The user's current copy, verbatim, if they provided one."),
  variants: z.array(variantSchema).min(2).max(6),
  testPlan: z.object({
    metric: z.string().describe("Primary metric to judge the test on, e.g. click-through rate to pricing."),
    sampleSizeHint: z
      .string()
      .describe("Plain-language guidance on how much traffic is needed before trusting the result."),
    duration: z.string().describe("Suggested run length and why, e.g. 'two full weeks to cover weekday/weekend cycles'."),
    guardrail: z.string().optional().describe("A secondary metric that must not get worse."),
  }),
});

export type VariantsDeliverable = z.infer<typeof deliverVariantsSchema>;

const deliverVariants = tool({
  description:
    "Deliver the final set of A/B copy variants and the test plan. Call this exactly once, after you have enough context, with every variant fully written. The user sees the result as interactive cards they can copy and export.",
  inputSchema: deliverVariantsSchema,
  execute: async (input) => input,
});

export const abCopyVariantsRuntime: ChatToolRuntime = {
  slug: "ab-copy-variants",
  modelKind: "writer",
  maxSteps: 3,
  tools: { deliverVariants },
  instructions: `You are Launchabl's A/B copy strategist. You write conversion copy for founders, marketers, freelancers and small agencies, and you design honest tests so they learn which variant actually wins.

How you work:
1. Read what the user pasted. Identify the asset type (headline, hero, ad, email subject, CTA, product blurb), the audience, and the goal. Infer what you reasonably can from context — do not interrogate the user.
2. Ask a clarifying question only if you genuinely cannot write good variants without it (for example, the audience is completely unknown and the copy is generic). Ask at most two questions, in one short message, then stop and wait.
3. Otherwise, write 3–5 variants. Every variant must use a DIFFERENT persuasion angle (outcome, pain relief, social proof, curiosity, urgency, specificity, contrast, identity). Never produce near-duplicates or synonyms of the control. Keep each variant realistic for the format: headlines under ~10 words, subject lines under ~50 characters, CTAs 1–4 words.
4. Match the user's brand voice if they showed one. Default to plain, concrete, specific language. No hype words ("revolutionary", "unleash", "supercharge"), no exclamation marks unless the brand uses them, no invented statistics or claims.
5. Deliver the variants by calling the deliverVariants tool exactly once with every field filled. Include the user's original copy as the control when they gave one.
6. After the tool call, reply with 2–4 sentences: which variant you'd ship first and why, and one thing to watch for in the test. Do not repeat the variants in prose — the cards already show them.

Formatting: short paragraphs, no headers, no bullet lists longer than four items. Write in the same language the user wrote in.`,
};
