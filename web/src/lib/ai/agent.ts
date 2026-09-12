import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { getToolBySlug } from "@/lib/site-config";

/**
 * The unified agent: every skill from every tool in one conversation.
 *
 * Function tools are merged by name (they're shared module instances, so a
 * collision is the same tool). Each tool's own description tells the model
 * what it does; the compact catalog below tells it which skill to reach for
 * and what it needs. Full per-skill playbooks (the specialist system
 * prompts) are loaded on demand through `loadSkillGuide` so the base prompt
 * stays small while the agent still gets the specialist's judgement when it
 * actually uses a skill.
 */

export const AGENT_SLUG = "agent";

export type SkillCatalogEntry = { slug: string; name: string; summary: string; tools: string[]; needs: string[]; cost: string };

export function skillCatalog(runtimes: ChatToolRuntime[]): SkillCatalogEntry[] {
  return runtimes
    .filter((r) => r.slug !== AGENT_SLUG && r.tools && Object.keys(r.tools).length > 0)
    .map((r) => {
      const site = getToolBySlug(r.slug);
      return {
        slug: r.slug,
        name: site?.name ?? r.slug,
        summary: r.skill?.summary ?? site?.shortDescription ?? "",
        tools: Object.keys(r.tools ?? {}).filter((t) => t !== "fetchPage"),
        needs: r.skill?.needs ?? [],
        cost: r.skill?.cost ?? "model",
      };
    });
}

function mergeTools(runtimes: ChatToolRuntime[]): ToolSet {
  const merged: ToolSet = {};
  for (const runtime of runtimes) {
    for (const [name, def] of Object.entries(runtime.tools ?? {})) {
      if (merged[name] && merged[name] !== def && process.env.NODE_ENV !== "production") {
        console.warn(`[agent] tool name collision for "${name}" between runtimes; keeping the first`);
        continue;
      }
      merged[name] ??= def;
    }
  }
  return merged;
}

function catalogText(entries: SkillCatalogEntry[]): string {
  return entries
    .map((e) => `- ${e.slug} — ${e.name}. ${e.summary} Tools: ${e.tools.join(", ")}.${e.needs.length ? ` Needs: ${e.needs.join("/")}.` : ""}${e.cost === "media" ? " Costs money per call." : ""}`)
    .join("\n");
}

export function buildAgentRuntime(runtimes: ChatToolRuntime[]): ChatToolRuntime {
  const specialists = runtimes.filter((r) => r.slug !== AGENT_SLUG);
  const catalog = skillCatalog(specialists);
  const bySlug = new Map(specialists.map((r) => [r.slug, r]));

  const loadSkillGuide = tool({
    description:
      "Load the specialist playbook for a skill before using it for the first time in a conversation. Returns the exact working rules, quality bar and output conventions that skill's dedicated tool follows. Cheap and instant — call it whenever you're about to use a skill you haven't loaded yet.",
    inputSchema: z.object({ slug: z.string().describe("Skill slug from the catalog, e.g. website-audit-report") }),
    execute: async ({ slug }) => {
      const runtime = bySlug.get(slug);
      if (!runtime) return { error: `Unknown skill "${slug}". Use a slug from the catalog.` };
      return { slug, guide: runtime.instructions, tools: Object.keys(runtime.tools ?? {}) };
    },
  });

  return {
    slug: AGENT_SLUG,
    modelKind: "writer",
    maxSteps: 14,
    tools: { loadSkillGuide, ...mergeTools(specialists) },
    skill: { summary: "Every Launchabl skill in one conversation, chained into end-to-end workflows.", cost: "model", runsIn: "server", sideEffects: "network-read", needs: [] },
    instructions: `You are Launchabl's agent: a senior growth marketer, SEO, deliverability engineer, designer and web technician in one, with real tools. People come to you with a job — launch this page, fix our email, beat this competitor, get us clients — and you get it done end to end with the skills below, then hand over deliverables they can ship.

## How to work
1. Act first, ask later. Infer what you can from the URL, brand or brief; state assumptions in one line and proceed. Ask a question only when the job is genuinely impossible without the answer (for example no URL for an audit).
2. Plan the chain, then execute it in order. Read before you write: fetch or audit the page before writing copy about it; check the DNS before recommending records; find the email pattern before drafting outreach. Each deliverable should build on what the previous step found.
3. Before the first use of any skill in a conversation, call loadSkillGuide with its slug and follow that guide's rules (how many items, tone, what to include, when to call which tool). Never skip this on a skill that writes a deliverable.
4. Use the deliverable tools — they render as real artifacts (reports, files, cards, images, tables) with downloads. Never paste what a tool would render into your reply; never announce that you're about to run a tool. Run several independent checks in parallel when the job calls for it.
5. Be honest about scope. If a step needs a real system you don't have (their analytics, ad account, CMS access), say so and deliver the part you can, ready for them to paste in.
6. Money: image generation and multi-image sets cost money. Generate images only when the job calls for visuals, one at a time unless options were requested.
7. Finish with a short handover: what you produced (as a numbered list of deliverables), the single most important next action, and what you'd do next if they want to keep going. No preamble, no restating the brief, no marketing fluff.

## Skills
${catalogText(catalog)}

## Workflow patterns you should recognise
- "Launch this page" → auditWebsite, gradeLandingPage, deliverMetaTags, deliverSchema, designSocialCard; then a fix-first list.
- "Fix our email" / "emails go to spam" → checkDnsEmail first, then exact records to publish and the p=none → p=reject path; subject-line and email drafts only if asked.
- "Beat competitor X" → compareSites (gap report), then deliverCalendar or copy variants aimed at the gaps found.
- "Is my site healthy/secure" → auditWebsite, checkSecurityHeaders, checkSsl, auditAccessibility, checkLinks in parallel; one prioritised list across all of them.
- "Get more local customers" → deliverLocalSeoKit, deliverSchema (LocalBusiness), designQr for the review link.
- "Announce X" → deliverVariants for the hero, deliverEmail for the announcement, designSocialCard, generateImage if a hero visual is wanted.
- "Reach person Y at company Z" → findEmail, then a short outreach draft in your reply (or deliverEmail if they want a full email).
- "Make us AI-search ready" → analyzeLlmReadability, analyzeVoiceSearch, deliverFaqSchema, deliverDocument for llms.txt.

Write in the user's language. Keep replies tight; the artifacts carry the detail.`,
  };
}
