import { generateImage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { classifyAiError, NoModelAvailableError, type AiFailure } from "@/lib/ai/errors";
import { imageModelChain } from "@/lib/ai/models";
import { recordUsage } from "@/lib/ai/usage";

/**
 * Image generation through the AI Gateway with the same fall-through
 * behaviour as text: walk the chain until a model answers. Output is
 * re-encoded to WebP so a card or ad lands at ~100–200 KB instead of a
 * multi-megabyte PNG (it travels inside the chat stream and is kept in
 * local history).
 */

export type ImageAspect = "1:1" | "16:9" | "9:16" | "4:5" | "3:2" | "2:3" | "1.91:1" | "4:3";

/** Pixel sizes per aspect. gpt-image only accepts 1024², 1536×1024, 1024×1536; the others get the closest and are cropped after. */
const TARGET: Record<ImageAspect, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1536, height: 864 },
  "1.91:1": { width: 1536, height: 804 },
  "4:3": { width: 1536, height: 1152 },
  "3:2": { width: 1536, height: 1024 },
  "9:16": { width: 864, height: 1536 },
  "4:5": { width: 1024, height: 1280 },
  "2:3": { width: 1024, height: 1536 },
};

const OPENAI_SIZES = ["1024x1024", "1536x1024", "1024x1536"] as const;

/** USD per image, approximate list price; used when the gateway omits cost. */
export const IMAGE_PRICES: Record<string, number> = {
  "openai/gpt-image-1-mini": 0.011,
  "openai/gpt-image-1": 0.04,
  "openai/gpt-image-1.5": 0.04,
  "bytedance/seedream-4.0": 0.03,
  "bytedance/seedream-4.5": 0.04,
  "bfl/flux-pro-1.1": 0.04,
  "meta/muse-image-1.0": 0.01,
};

export type GeneratedImage = { dataUrl: string; mediaType: string; width: number; height: number; bytes: number };

export type ImageGeneration = {
  model: string;
  images: GeneratedImage[];
  costUsd: number;
  skipped: { model: string; failure: AiFailure }[];
};

export type GenerateOptions = {
  prompt: string;
  aspect: ImageAspect;
  n?: number;
  /** Which tool asked, for usage accounting. */
  slug: string;
  chain?: string[];
  abortSignal?: AbortSignal;
};

function requestSize(model: string, aspect: ImageAspect): { size: `${number}x${number}`; crop: { width: number; height: number } | null } {
  const target = TARGET[aspect];
  if (model.startsWith("openai/")) {
    const ratio = target.width / target.height;
    const size = ratio > 1.15 ? OPENAI_SIZES[1] : ratio < 0.87 ? OPENAI_SIZES[2] : OPENAI_SIZES[0];
    const [w, h] = size.split("x").map(Number);
    const exact = w === target.width && h === target.height;
    return { size, crop: exact ? null : target };
  }
  return { size: `${target.width}x${target.height}`, crop: null };
}

async function toWebp(bytes: Uint8Array, crop: { width: number; height: number } | null): Promise<{ buffer: Buffer; width: number; height: number }> {
  const sharp = (await import("sharp")).default;
  let pipeline = sharp(Buffer.from(bytes));
  if (crop) pipeline = pipeline.resize(crop.width, crop.height, { fit: "cover", position: "attention" });
  const buffer = await pipeline.webp({ quality: 86 }).toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width ?? crop?.width ?? 0, height: meta.height ?? crop?.height ?? 0 };
}

function reportedCost(result: { providerMetadata?: Record<string, unknown> }): number | null {
  const gw = result.providerMetadata?.gateway as { cost?: unknown } | undefined;
  const cost = gw?.cost;
  if (typeof cost === "number") return cost;
  if (typeof cost === "string" && cost.trim() !== "" && !Number.isNaN(Number(cost))) return Number(cost);
  return null;
}

export async function generateImages(options: GenerateOptions): Promise<ImageGeneration> {
  const chain = options.chain ?? imageModelChain();
  const n = Math.min(4, Math.max(1, options.n ?? 1));
  const skipped: ImageGeneration["skipped"] = [];
  const started = Date.now();

  for (const model of chain) {
    const { size, crop } = requestSize(model, options.aspect);
    try {
      const result = await generateImage({
        model: gateway.imageModel(model),
        prompt: options.prompt,
        n,
        size,
        abortSignal: options.abortSignal,
        maxRetries: 1,
        providerOptions: model.startsWith("openai/") ? { openai: { quality: "medium", output_format: "png" } } : {},
      });
      const images: GeneratedImage[] = [];
      for (const file of result.images) {
        const { buffer, width, height } = await toWebp(file.uint8Array, crop);
        images.push({ dataUrl: `data:image/webp;base64,${buffer.toString("base64")}`, mediaType: "image/webp", width, height, bytes: buffer.byteLength });
      }
      const costUsd = reportedCost(result) ?? (IMAGE_PRICES[model] ?? 0.04) * images.length;
      void recordUsage({ slug: options.slug, model, inputTokens: 0, outputTokens: 0, reportedCostUsd: costUsd, durationMs: Date.now() - started, ok: true });
      return { model, images, costUsd, skipped };
    } catch (error) {
      const failure = classifyAiError(error);
      skipped.push({ model, failure });
      void recordUsage({ slug: options.slug, model, inputTokens: 0, outputTokens: 0, reportedCostUsd: 0, durationMs: Date.now() - started, ok: false });
      if (!failure.fallback) throw new NoModelAvailableError(skipped);
    }
  }
  throw new NoModelAvailableError(skipped);
}
