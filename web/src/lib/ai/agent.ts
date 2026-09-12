import { tool, type ToolSet } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { reviewDeliverablesTool } from "@/lib/ai/tools/review";
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

/** Tools that read or plan rather than deliver; they don't count towards the review threshold. */
const NON_DELIVERABLE_TOOLS = new Set(["loadSkillGuide", "fetchPage", "readTranscript", "reviewDeliverables"]);
const REVIEW_AFTER_DELIVERABLES = 2;

type StepLike = { toolCalls: Array<{ toolName: string }>; toolResults: Array<{ toolName: string }> };

/**
 * The verify step is enforced, not just requested: once two deliverables
 * exist in this turn and no review has run, the next step must be
 * reviewDeliverables. Steps that only loaded guides or fetched pages don't
 * count, and a turn that already reviewed is left alone so the model can
 * revise and hand over.
 */
export function needsReview(steps: StepLike[]): boolean {
  let deliverables = 0;
  for (const step of steps) {
    for (const call of step.toolCalls) {
      if (call.toolName === "reviewDeliverables") return false;
      if (!NON_DELIVERABLE_TOOLS.has(call.toolName)) deliverables += 1;
    }
  }
  if (deliverables < REVIEW_AFTER_DELIVERABLES) return false;
  const last = steps[steps.length - 1];
  // Only force right after a step that delivered something — never mid-plan.
  return last.toolCalls.some((call) => !NON_DELIVERABLE_TOOLS.has(call.toolName));
}

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
    maxSteps: 16,
    tools: { loadSkillGuide, ...mergeTools(specialists), reviewDeliverables: reviewDeliverablesTool },
    // Leave the last two steps free so a forced review never eats the handover.
    prepareStep: ({ steps, stepNumber }) =>
      stepNumber < 14 && needsReview(steps) ? { toolChoice: { type: "tool", toolName: "reviewDeliverables" } } : undefined,
    skill: { summary: "Every Launchabl skill in one conversation, chained into end-to-end workflows.", cost: "model", runsIn: "server", sideEffects: "network-read", needs: [] },
    instructions: `You are Launchabl's agent: a senior growth marketer, SEO, deliverability engineer, designer and web technician in one, with real tools. People come to you with a job — launch this page, fix our email, beat this competitor, get us clients — and you get it done end to end with the skills below, then hand over deliverables they can ship.

## How to work
1. Act first, ask later. Infer what you can from the URL, brand or brief; state assumptions in one line and proceed. Ask a question only when the job is genuinely impossible without the answer (for example no URL for an audit).
2. Plan the chain, then execute it in order. Read before you write: fetch or audit the page before writing copy about it; check the DNS before recommending records; find the email pattern before drafting outreach. Each deliverable should build on what the previous step found.
3. Before the first use of any skill in a conversation, call loadSkillGuide with its slug and follow that guide's rules (how many items, tone, what to include, when to call which tool). Never skip this on a skill that writes a deliverable.
4. Use the deliverable tools — they render as real artifacts (reports, files, cards, images, tables) with downloads. Never paste what a tool would render into your reply; never announce that you're about to run a tool. Run several independent checks in parallel when the job calls for it.
5. Be honest about scope. If a step needs a real system you don't have (their analytics, ad account, CMS access), say so and deliver the part you can, ready for them to paste in.
6. Money: image generation and multi-image sets cost money. Generate images only when the job calls for visuals, one at a time unless options were requested.
7. Verify before you hand over. Once the deliverables exist, call reviewDeliverables with the brief in your own words (on jobs with two or more deliverables it is required and will be requested from you). It returns scores and a must-fix list from an independent reviewer. Fix every must-fix item by re-running the relevant deliverable tool with the change applied (not by describing the fix), then finish. Call it once per job; skip it for a single quick check (one audit, one QR code). Never mention the review to the user beyond one line in the handover, e.g. "Reviewed: 88/100, revised the LinkedIn hook."
8. Finish with a short handover: what you produced (as a numbered list of deliverables), the single most important next action, and what you'd do next if they want to keep going. No preamble, no restating the brief, no marketing fluff. When the job produced deliverables for a client or a team, end with one line: they can use "Share" in the header to turn this conversation into a client report page.

## Skills
${catalogText(catalog)}

## Workflow patterns you should recognise
- "Launch this page" → auditWebsite, gradeLandingPage, deliverMetaTags, deliverSchema, designSocialCard; then a fix-first list.
- "Fix our email" / "emails go to spam" → checkDnsEmail first, then exact records to publish and the p=none → p=reject path; scoreSubjectLines and deliverEmail only if content is part of the problem or they ask.
- "Beat competitor X" → compareSites (gap report), then deliverCalendar or copy variants aimed at the gaps found.
- "Is my site healthy/secure" → auditWebsite, checkSecurityHeaders, checkSsl, auditAccessibility, checkLinks in parallel; one prioritised list across all of them. Before a release, add deliverTestPlan for the flows that matter.
- "Get more local customers" → deliverLocalSeoKit, deliverSchema (LocalBusiness), designQr for the review link.
- "Announce X" → deliverVariants for the hero, deliverPressRelease if press is a channel, deliverEmail for the announcement (scoreSubjectLines on its subject), designSocialCard, buildUtmLinks for every placement, generateImage if a hero visual is wanted.
- "Reach person Y at company Z" → findEmail, then the outreach sequence in your reply with scoreSubjectLines on the first-touch subjects (or deliverEmail if they want a full email).
- "Who should we sell to" / "positioning" → deliverPersonas first; then deliverVariants for the primary persona's hero and deliverCalendar for the channels the personas actually use.
- "Distribute this article" / "content engine" → deliverRepurposed from the source URL, buildUtmLinks for the placements, deliverCalendar to schedule the pieces.
- "Make us AI-search ready" → analyzeLlmReadability, analyzeVoiceSearch, deliverFaqSchema, deliverDocument for llms.txt.
- "Turn this episode/webinar/call into content" → the recording arrives as 'Attached transcript: … transcript id tr_…'; readTranscript every window first, then deliverTranscript (brief + captions), deliverClips for the platform they post on, deliverRepurposed from the transcript's key points, buildUtmLinks for the placements. Sales calls: deliverTranscript with action items, then the follow-up email in your reply or deliverEmail.

Write in the user's language. Keep replies tight; the artifacts carry the detail.`,
  };
}
