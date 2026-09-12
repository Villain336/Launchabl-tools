import type { PrepareStepFunction, ToolSet } from "ai";
import type { ModelKind } from "@/lib/ai/models";
import { abCopyVariantsRuntime } from "@/lib/ai/tools/ab-copy-variants";
import { qrDesignerRuntime } from "@/lib/ai/tools/qr-designer";
import { metaTagsRuntime } from "@/lib/ai/tools/meta-tags";
import { agentSkillGeneratorRuntime, markdownGeneratorRuntime } from "@/lib/ai/tools/documents";
import { datasetBuilderRuntime } from "@/lib/ai/tools/dataset-builder";
import { backlinkHealthRuntime, brokenLinkAssistantRuntime, canonicalDetectorRuntime, pageSpeedAuditRuntime } from "@/lib/ai/tools/seo-audits";
import { complianceScannerRuntime, llmReadabilityRuntime, voiceSearchRuntime } from "@/lib/ai/tools/site-checks";
import { newsletterBuilderRuntime } from "@/lib/ai/tools/newsletter";
import { competitorGapRuntime, landingPageGraderRuntime, sitemapRobotsRuntime, websiteAuditRuntime } from "@/lib/ai/tools/site-reports";
import { contentCalendarRuntime, localSeoRuntime, schemaGeneratorRuntime } from "@/lib/ai/tools/marketing-kits";
import { accessibilityRuntime, dnsEmailHealthRuntime, emailFinderRuntime, securityHeadersRuntime, sslCheckerRuntime } from "@/lib/ai/tools/infra-checks";
import { imageGeneratorRuntime, socialCardRuntime } from "@/lib/ai/tools/image-gen";
import { contentRepurposerRuntime, personaGeneratorRuntime, pressReleaseRuntime, qaTestPlanRuntime, subjectLineCheckerRuntime, utmBuilderRuntime } from "@/lib/ai/tools/growth-kits";
import { clipFinderRuntime, transcriberRuntime } from "@/lib/ai/tools/media";
import { buildAgentRuntime } from "@/lib/ai/agent";

/**
 * Server-side definition of a chat tool: the system prompt, the model tier
 * it should run on, and any function tools the model can call. Paired with
 * the client-safe metadata in `chat-tools.ts` by slug.
 *
 * Only import this from API routes — prompts should never reach the client
 * bundle.
 */
/**
 * Skill manifest: what a runtime's function tools cost and touch. Lets the
 * unified agent pick skills, budget them and explain side effects, and lets
 * the UI label browser-side skills honestly.
 */
export type SkillMeta = {
  /** One line for the agent's skill catalog: what the skill does and delivers. */
  summary: string;
  /** free = pure computation, cheap = network reads/DNS, model = extra LLM calls, media = image/audio generation. */
  cost: "free" | "cheap" | "model" | "media";
  runsIn: "server" | "browser";
  sideEffects: "none" | "network-read" | "writes";
  /** Inputs the skill needs from the user before it can run. */
  needs: ("url" | "domain" | "text" | "file" | "image" | "name")[];
};

export type ChatToolRuntime = {
  slug: string;
  modelKind: ModelKind;
  instructions: string;
  tools?: ToolSet;
  /** Upper bound on model ↔ tool round-trips per user message. */
  maxSteps?: number;
  /** Per-step overrides (force a tool, restrict tools) computed from the steps so far. */
  prepareStep?: PrepareStepFunction<ToolSet>;
  skill?: SkillMeta;
};

const runtimes: ChatToolRuntime[] = [
  abCopyVariantsRuntime,
  qrDesignerRuntime,
  metaTagsRuntime,
  markdownGeneratorRuntime,
  agentSkillGeneratorRuntime,
  datasetBuilderRuntime,
  canonicalDetectorRuntime,
  brokenLinkAssistantRuntime,
  pageSpeedAuditRuntime,
  backlinkHealthRuntime,
  voiceSearchRuntime,
  complianceScannerRuntime,
  llmReadabilityRuntime,
  newsletterBuilderRuntime,
  websiteAuditRuntime,
  landingPageGraderRuntime,
  competitorGapRuntime,
  sitemapRobotsRuntime,
  schemaGeneratorRuntime,
  localSeoRuntime,
  contentCalendarRuntime,
  dnsEmailHealthRuntime,
  securityHeadersRuntime,
  accessibilityRuntime,
  sslCheckerRuntime,
  emailFinderRuntime,
  imageGeneratorRuntime,
  socialCardRuntime,
  utmBuilderRuntime,
  personaGeneratorRuntime,
  subjectLineCheckerRuntime,
  pressReleaseRuntime,
  qaTestPlanRuntime,
  contentRepurposerRuntime,
  transcriberRuntime,
  clipFinderRuntime,
];

const agentRuntime = buildAgentRuntime(runtimes);
const bySlug = new Map([...runtimes, agentRuntime].map((runtime) => [runtime.slug, runtime]));

export function getChatToolRuntime(slug: string): ChatToolRuntime | undefined {
  return bySlug.get(slug);
}

/** Specialist runtimes (one per tool); the agent is built from these. */
export function listChatToolRuntimes(): ChatToolRuntime[] {
  return runtimes;
}
