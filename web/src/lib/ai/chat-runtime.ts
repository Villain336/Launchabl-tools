import type { ToolSet } from "ai";
import type { ModelKind } from "@/lib/ai/models";
import { abCopyVariantsRuntime } from "@/lib/ai/tools/ab-copy-variants";
import { qrDesignerRuntime } from "@/lib/ai/tools/qr-designer";
import { metaTagsRuntime } from "@/lib/ai/tools/meta-tags";
import { agentSkillGeneratorRuntime, markdownGeneratorRuntime } from "@/lib/ai/tools/documents";
import { datasetBuilderRuntime } from "@/lib/ai/tools/dataset-builder";
import { backlinkHealthRuntime, brokenLinkAssistantRuntime, canonicalDetectorRuntime, pageSpeedAuditRuntime } from "@/lib/ai/tools/seo-audits";

/**
 * Server-side definition of a chat tool: the system prompt, the model tier
 * it should run on, and any function tools the model can call. Paired with
 * the client-safe metadata in `chat-tools.ts` by slug.
 *
 * Only import this from API routes — prompts should never reach the client
 * bundle.
 */
export type ChatToolRuntime = {
  slug: string;
  modelKind: ModelKind;
  instructions: string;
  tools?: ToolSet;
  /** Upper bound on model ↔ tool round-trips per user message. */
  maxSteps?: number;
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
];

const bySlug = new Map(runtimes.map((runtime) => [runtime.slug, runtime]));

export function getChatToolRuntime(slug: string): ChatToolRuntime | undefined {
  return bySlug.get(slug);
}

export function listChatToolRuntimes(): ChatToolRuntime[] {
  return runtimes;
}
