import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { generateImages, type GeneratedImage, type ImageAspect } from "@/lib/ai/image";

/* ── AI image generator ─────────────────────────────────── */

const aspectSchema = z.enum(["1:1", "16:9", "9:16", "4:5", "3:2", "2:3", "1.91:1", "4:3"]);

const ASPECT_HINT: Record<ImageAspect, string> = {
  "1:1": "square composition",
  "16:9": "wide landscape composition, subject centred vertically with breathing room at the sides",
  "1.91:1": "very wide banner composition, subject centred vertically, nothing important near the top or bottom edge",
  "4:3": "landscape composition",
  "3:2": "landscape composition",
  "9:16": "tall vertical composition, subject centred, nothing important in the top or bottom fifth",
  "4:5": "portrait composition",
  "2:3": "tall portrait composition",
};

export type ImageDeliverable = {
  id: string;
  prompt: string;
  aspect: ImageAspect;
  model: string;
  images: GeneratedImage[];
  costUsd: number;
  /** Set client-side when local history had to drop the pixels to fit. */
  expired?: boolean;
};

const shortId = () => Math.random().toString(36).slice(2, 10);

export const generateImageTool = tool({
  description:
    "Generate one or more images from a detailed prompt. Use for hero images, ad creatives, blog headers, product mockups, illustrations, icons and social visuals. Write the prompt as a complete art direction (subject, style, lighting, palette, mood, composition, what to avoid). Call once per distinct concept; for variations call once with count 2–4.",
  inputSchema: z.object({
    prompt: z.string().min(8).max(2000).describe("Full art direction for the image model. Concrete nouns, style, palette, lighting, mood. Include exact text in double quotes only if text must appear."),
    aspect: aspectSchema.default("1:1").describe("1:1 social/avatar, 16:9 hero/YouTube, 1.91:1 Open Graph/link preview, 9:16 story/reel, 4:5 Instagram feed, 3:2 blog header"),
    count: z.number().int().min(1).max(4).default(1),
  }),
  execute: async ({ prompt, aspect, count }, { abortSignal }): Promise<ImageDeliverable> => {
    const fullPrompt = `${prompt.trim()}\n\nComposition: ${ASPECT_HINT[aspect]}.`;
    const result = await generateImages({ slug: "ai-image-generator", prompt: fullPrompt, aspect, n: count, abortSignal });
    return { id: shortId(), prompt, aspect, model: result.model, images: result.images, costUsd: result.costUsd };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: `Generated ${output.images.length} image(s) (${output.aspect}, ${output.images[0]?.width}×${output.images[0]?.height}) with ${output.model}. They are displayed to the user with download buttons. Prompt used: ${output.prompt}`,
  }),
});

export const imageGeneratorRuntime: ChatToolRuntime = {
  slug: "ai-image-generator",
  modelKind: "writer",
  maxSteps: 4,
  tools: { generateImage: generateImageTool },
  tier: "pro",
  skill: {
    summary: "Generate images from a brief: hero visuals, ad creatives, blog headers, product scenes, illustrations, icons, social visuals.",
    cost: "media",
    runsIn: "server",
    sideEffects: "none",
    needs: ["text"],
  },
  instructions: `You are Launchabl's art director. You turn a rough brief into finished images by writing precise prompts for the image model and calling generateImage.

How to work:
1. Do not ask clarifying questions before the first image unless the brief is genuinely unusable. Infer sensible defaults: purpose → aspect (link preview 1.91:1, Instagram feed 4:5, story/reel 9:16, hero/YouTube 16:9, avatar/icon 1:1, blog 3:2), style from the brand or industry, palette from any colours or brand names mentioned (Launchabl is orange #FF6600 on cream/white).
2. Write the prompt like a professional brief: subject and action, setting, style (photo / 3D / flat illustration / editorial / isometric / line art), lens or rendering notes, lighting, palette, mood, composition for the aspect, and "no text, no watermark, no logos" unless text is explicitly wanted. If text must appear, keep it to a few words in double quotes and say where it sits.
3. If the user attaches a reference image, describe what to borrow from it (palette, mood, layout) in the prompt — the image model doesn't see attachments.
4. Product shots: describe the product precisely and the surface, background and light; never invent brand names on packaging.
5. People: describe age range, expression, clothing and setting; avoid real people's names and likenesses.
6. After the tool call, reply in one or two sentences: what direction you took and one concrete follow-up they can ask for (different style, a variation set, another aspect for a second channel). Never describe the image in detail — it's right there. Never announce that you're about to generate.
7. When asked for changes, call generateImage again with the full revised prompt (not just the delta). Keep everything they didn't mention the same.

Cost awareness: each image costs money. Default to one image; generate 2–4 only when the user asks for options or variations.

Write in the user's language. No headers, no bullet lists.`,
};

/* ── Social / OG card designer ──────────────────────────── */

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "hex colour like #FF6600");

export const socialCardSchema = z.object({
  title: z.string().min(2).max(110).describe("The headline. Short, specific, the thing people should read first."),
  subtitle: z.string().max(160).optional().describe("Supporting line: a one-sentence promise, the date, the author, or the site tagline."),
  badge: z.string().max(24).optional().describe("Small label above the title, e.g. 'New', 'Guide', 'Case study', 'Webinar · Sep 30'."),
  brand: z.object({
    name: z.string().min(1).max(40),
    domain: z.string().max(60).optional().describe("e.g. launchabl.io — shown small in the footer"),
    accent: hex.default("#FF6600"),
    /** Short wordmark or initials, rendered as the logo when no image logo exists. */
    mark: z.string().max(3).optional(),
  }),
  author: z.object({ name: z.string().max(60), role: z.string().max(60).optional() }).optional(),
  theme: z.enum(["light", "dark", "accent"]).default("dark"),
  layout: z.enum(["left", "center", "split"]).default("left").describe("left = editorial; center = announcement; split = text left, art right"),
  background: z
    .object({
      kind: z.enum(["solid", "gradient", "mesh", "generated"]).default("gradient"),
      from: hex.optional(),
      to: hex.optional(),
      /** Only for kind = generated: art direction for the backdrop image. Abstract, no text, low-contrast where text sits. */
      prompt: z.string().max(1200).optional(),
    })
    .default({ kind: "gradient" }),
});

export type SocialCardSpec = z.infer<typeof socialCardSchema>;

export type SocialCardDeliverable = SocialCardSpec & {
  id: string;
  backgroundImage: GeneratedImage | null;
  backgroundModel: string | null;
  costUsd: number;
  expired?: boolean;
};

export const designSocialCardTool = tool({
  description:
    "Design a shareable card (Open Graph link preview, X/LinkedIn post, Instagram square, story) from a title, brand and style. The card is rendered live in every size with pixel-perfect text and PNG downloads. Set background.kind to 'generated' with a prompt when an illustrative backdrop would sell it; otherwise use gradient/mesh (free, instant).",
  inputSchema: socialCardSchema,
  execute: async (spec, { abortSignal }): Promise<SocialCardDeliverable> => {
    let backgroundImage: GeneratedImage | null = null;
    let backgroundModel: string | null = null;
    let costUsd = 0;
    if (spec.background.kind === "generated" && spec.background.prompt) {
      const prompt = `${spec.background.prompt.trim()}\n\nBackdrop for a social card: abstract or scenic, no text, no letters, no logos, no watermark, soft low-contrast area on the ${spec.layout === "split" ? "left half" : "whole image"} so headline text stays legible. Wide banner composition.`;
      const result = await generateImages({ slug: "social-card-generator", prompt, aspect: "1.91:1", n: 1, abortSignal });
      backgroundImage = result.images[0] ?? null;
      backgroundModel = result.model;
      costUsd = result.costUsd;
    }
    return { ...spec, id: shortId(), backgroundImage, backgroundModel, costUsd };
  },
  toModelOutput: ({ output }) => ({
    type: "text",
    value: `Card rendered: "${output.title}" (${output.theme}, ${output.layout}, background ${output.background.kind}${output.backgroundImage ? " with generated art" : ""}). The user sees it in seven sizes (OG 1200×630, X 1600×900, square, portrait 4:5, story, YouTube thumbnail, Pinterest) with editable text, PNG downloads and a batch ZIP export.`,
  }),
});

export const socialCardRuntime: ChatToolRuntime = {
  slug: "social-card-generator",
  modelKind: "writer",
  maxSteps: 4,
  tools: { designSocialCard: designSocialCardTool, generateImage: generateImageTool },
  skill: {
    summary: "Design Open Graph link previews and social post cards (OG, square, X, story) with exact text, brand colours and optional generated backdrop art; PNG downloads.",
    cost: "cheap",
    runsIn: "server",
    sideEffects: "none",
    needs: ["text"],
  },
  instructions: `You are Launchabl's social card designer. You turn a page, post or announcement into a shareable card by calling designSocialCard. The card is rendered on the user's screen in every common size with real, editable text — so you never need to worry about the image model misspelling a headline.

How to work:
1. Call designSocialCard immediately with your best design; don't ask questions first. If the user gives a URL, infer the title and brand from it (domain → brand name, sensible title); if they paste copy, tighten it into a headline of at most ~60 characters and a subtitle of at most ~110.
2. Pick theme and palette from the brand: known brand colours if you know them, otherwise a confident accent that suits the industry. Launchabl is #FF6600. 'dark' reads best in feeds; 'light' for editorial and newsletters; 'accent' for launches.
3. Layout: 'left' for articles and guides, 'center' for launches and announcements, 'split' when there is generated art or a product visual to show.
4. Backgrounds: gradient or mesh is instant and free. Use 'generated' only when an illustrative backdrop clearly adds value (product launch, event, brand campaign) — write an abstract, text-free art direction in background.prompt that leaves a quiet area for the headline.
5. Badge: a short label for the content type or date when it helps ('Guide', 'New', 'Webinar · Sep 30'). Skip it otherwise.
6. After the tool call, reply in one or two sentences: the direction you took and what they can change (text is editable in the card; ask for a different theme, layout or background). Mention that the OG size is the one to upload as og:image. Never announce that you're about to design; never describe the card in prose.
7. On change requests, call designSocialCard again with the full updated spec; keep everything they didn't mention.

Write in the user's language. No headers, no bullet lists.`,
};
