import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { fetchPageTool } from "@/lib/ai/tools/shared/fetch-page-tool";

export const metaTagSetSchema = z.object({
  pageUrl: z.string().optional().describe("The page these tags are for, if known."),
  title: z.string().min(10).max(70).describe("<title>. Target 50–60 characters; primary keyword early; brand at the end after a separator."),
  description: z
    .string()
    .min(50)
    .max(170)
    .describe("Meta description. Target 140–155 characters; one clear benefit and a reason to click; no quotes."),
  canonical: z.string().optional().describe("Canonical URL if the page should declare one."),
  robots: z.string().optional().describe("Robots directive only if something other than index,follow is warranted."),
  ogTitle: z.string().max(90).describe("Open Graph title — can be punchier than <title>; no brand suffix needed."),
  ogDescription: z.string().max(220).describe("Open Graph description, up to ~200 characters."),
  ogImageBrief: z
    .string()
    .max(200)
    .describe("What the 1200×630 share image should show, in one sentence, since you can't make the image itself."),
  twitterCard: z.enum(["summary", "summary_large_image"]).default("summary_large_image"),
  keywords: z.array(z.string()).max(6).describe("Search phrases these tags target, most important first."),
  alternatives: z
    .array(z.object({ title: z.string().max(70), description: z.string().max(170), angle: z.string().max(40) }))
    .max(3)
    .describe("Up to three alternative title/description pairs with a different angle each, for testing."),
  rationale: z.string().max(400).describe("Two or three sentences on the choices, referencing what the page actually says."),
});

export type MetaTagSet = z.infer<typeof metaTagSetSchema>;

const deliverMetaTags = tool({
  description:
    "Deliver the final meta tag set. Call exactly once per page after you have read the page (if a URL was given) and decided on the tags. The user sees a search-result preview, a social card preview, and copy-ready HTML.",
  inputSchema: metaTagSetSchema,
  execute: async (input) => input,
});

export const metaTagsRuntime: ChatToolRuntime = {
  slug: "meta-tag-generator",
  modelKind: "writer",
  maxSteps: 4,
  tools: { fetchPage: fetchPageTool, deliverMetaTags },
  instructions: `You are Launchabl's technical SEO writer. You write title tags and meta descriptions that earn clicks without misrepresenting the page, and you produce the full social-sharing tag set to go with them.

Process:
1. If the user gives a URL, call fetchPage first. Base your tags on what the page actually says: its H1, headings, excerpt, existing title and description. Note what's wrong with the current tags (missing, too long, duplicated, keyword-stuffed, generic) — briefly, in the rationale.
2. If there is no URL, work from the user's description. If you don't know what the page is about at all, ask one question and stop.
3. Write the tags. Title: 50–60 characters, primary phrase near the front, a separator and the brand at the end when a brand is known ("Free QR Code Generator with Custom Styles | Launchabl"). Description: 140–155 characters, plain and specific, a benefit plus a reason to click, no clickbait, no quotation marks. Open Graph title can drop the brand and be punchier. Give three alternative title/description pairs with different angles (benefit-led, question, specificity/number, audience-led).
4. Only set robots if the page should not be indexed (thank-you pages, internal search, staging). Only set canonical when the page has an obvious canonical URL (the fetched final URL without tracking parameters) or the user asks.
5. Call deliverMetaTags exactly once with everything filled in. Then reply with two or three sentences: the biggest change versus the current tags and what to check after deploying (Search Console, a share-debugger re-scrape). Don't repeat the tags in prose.

Match the language of the page or the user. No headers, no bullet lists.`,
};
