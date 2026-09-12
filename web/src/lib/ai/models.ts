/**
 * Model routing for Launchabl tools.
 *
 * Every entry is a Vercel AI Gateway slug ("provider/model"). The gateway
 * authenticates with AI_GATEWAY_API_KEY, so no per-provider keys live here.
 *
 * Chains are ordered best → cheapest. The streaming layer walks down the
 * chain when a model is unavailable (no access on the current plan, rate
 * limited, or retired), so a tool keeps working on whatever responds.
 */

export type ModelKind = "writer" | "fast";

const DEFAULT_CHAINS: Record<ModelKind, string[]> = {
  // Long-form, brand-sensitive writing and structured deliverables.
  writer: [
    "anthropic/claude-sonnet-4.6",
    "openai/gpt-5.4",
    "google/gemini-3.5-flash",
    "meta/llama-4-scout",
  ],
  // Classification, short rewrites, extraction — latency matters more.
  fast: [
    "google/gemini-3.5-flash-lite",
    "openai/gpt-5-mini",
    "anthropic/claude-haiku-4.5",
    "meta/llama-4-scout",
  ],
};

const ENV_OVERRIDES: Record<ModelKind, string> = {
  writer: "AI_MODEL_WRITER",
  fast: "AI_MODEL_FAST",
};

function parseChain(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((slug) => slug.trim())
    .filter((slug) => slug.includes("/"));
}

/** Resolve the ordered model chain for a kind, honouring env overrides. */
export function modelChain(kind: ModelKind, env: Record<string, string | undefined> = process.env): string[] {
  const override = parseChain(env[ENV_OVERRIDES[kind]]);
  const chain = override.length > 0 ? override : DEFAULT_CHAINS[kind];
  // De-dupe while preserving order so a bad override can't make us hit
  // the same model twice.
  return Array.from(new Set(chain));
}

/**
 * Image models, best value first. gpt-image-1-mini renders legible text
 * (social cards, ads) at about a cent per image; the others are fallbacks
 * when it's unavailable on the current plan.
 */
const DEFAULT_IMAGE_CHAIN = ["openai/gpt-image-1-mini", "bytedance/seedream-4.0", "bfl/flux-pro-1.1", "meta/muse-image-1.0"];

export function imageModelChain(env: Record<string, string | undefined> = process.env): string[] {
  const override = parseChain(env.AI_MODEL_IMAGE);
  return Array.from(new Set(override.length > 0 ? override : DEFAULT_IMAGE_CHAIN));
}

/** Human label for a gateway slug, used in the chat footer. */
export function modelLabel(slug: string): string {
  const [, name = slug] = slug.split("/");
  return name
    .split("-")
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(" ");
}

export function hasGatewayKey(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.AI_GATEWAY_API_KEY);
}
