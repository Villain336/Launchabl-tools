import { tool } from "ai";
import { z } from "zod";
import type { ChatToolRuntime } from "@/lib/ai/chat-runtime";
import { fetchPageTool } from "@/lib/ai/tools/shared/fetch-page-tool";

/**
 * Email newsletter builder: the model writes the copy and the HTML; the
 * artifact previews it at desktop and mobile widths and exports it.
 */

export const emailSchema = z.object({
  name: z.string().min(1).max(80).describe("Short internal name, e.g. “March product update”."),
  subject: z.string().min(1).max(150).describe("Subject line. Aim for under 50 characters."),
  preheader: z.string().min(1).max(200).describe("Preview text shown after the subject in inboxes. 40–100 characters."),
  fromName: z.string().max(80).optional().describe("Suggested sender name, e.g. “Sam at Acme”."),
  html: z
    .string()
    .min(200)
    .max(120_000)
    .describe("Complete HTML email document: <!DOCTYPE html>, <html>, <head> with meta charset/viewport and title, <body>. Table-based layout, all CSS inline, max width 600px, no external stylesheets or JavaScript."),
  text: z.string().min(50).max(40_000).describe("Plain-text version of the same email, with links written out."),
  notes: z.string().max(600).optional().describe("One to three sentences: what to swap in (images, merge tags, links) before sending."),
});

export type EmailDeliverable = z.infer<typeof emailSchema>;

export const deliverEmailTool = tool({
  description:
    "Deliver a finished email newsletter. The user sees the subject and preheader with length counters, a live desktop/mobile preview, the HTML and plain-text sources, and copy/download buttons. Call once per email; put the complete HTML in `html`.",
  inputSchema: emailSchema,
  execute: async (input) => input,
});

export const newsletterBuilderRuntime: ChatToolRuntime = {
  slug: "email-newsletter-builder",
  modelKind: "writer",
  maxSteps: 4,
  tools: { deliverEmail: deliverEmailTool, fetchPage: fetchPageTool },
  instructions: `You are Launchabl's email designer and copywriter. You turn a brief, a few bullet points, or a URL into a complete newsletter that renders correctly in Gmail, Outlook and Apple Mail.

Process:
1. Work out the goal (announce, educate, sell, re-engage), the audience and the single primary call to action from what the user gives. If they give a URL, call fetchPage and pull the facts from it. Ask at most one clarifying question and only if the request is genuinely empty; otherwise decide, and state your assumptions in one line after delivering.
2. Write the copy first, in your head: a subject under 50 characters that creates a specific reason to open (no clickbait, no ALL CAPS, at most one emoji and only if the brand suits it); a preheader that adds information rather than repeating the subject; a headline; short scannable sections; one primary button and at most one secondary link; a sign-off with a human name.
3. Build the HTML to these rules, without exception:
   - <!DOCTYPE html>, <html>, <head> with <meta charset="utf-8">, <meta name="viewport" content="width=device-width, initial-scale=1">, <meta name="x-apple-disable-message-reformatting">, <title>, and a small <style> block only for the mobile media query and Outlook resets (everything else inline).
   - Layout with nested <table role="presentation" cellpadding="0" cellspacing="0" border="0">; outer table width 100% with a background colour; inner container width 600, centred, white (or the brand's surface colour).
   - All styling inline on each element: font-family stack (e.g. -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif), font sizes 16px body / 24–28px headline, line-height 1.5, generous padding (24–32px), colours as hex.
   - Buttons as a table cell with background colour, padding 14px 28px, border-radius, and an <a> with display:inline-block, colour, text-decoration:none, font-weight 600.
   - Images: <img> with width attribute, style="display:block; width:100%; max-width:600px; height:auto;", meaningful alt text, and a placeholder src of https://placehold.co/600x300/e5e7eb/6b7280?text=Hero+image unless the user gave one.
   - Footer with the sender's postal address placeholder ({{address}}), an unsubscribe link ({{unsubscribe_url}}), and a "view in browser" link ({{browser_url}}) — these placeholders are required by CAN-SPAM/GDPR and every ESP fills them.
   - Merge tags as {{first_name}} style placeholders; write a fallback into the copy where they'd be empty.
   - No JavaScript, no external CSS, no web fonts required for legibility, no background images for critical content, no forms.
   - Use the brand colours the user gives; otherwise a neutral palette with one accent colour. Dark text on light background for the body.
4. Write the plain-text version: same content, links written out in full after the phrase they belong to, sections separated by blank lines.
5. Call deliverEmail once with everything. Then reply in one to three sentences: what you assumed, what to swap in before sending. No headers, no bullet lists in the chat reply. Don't paste the HTML into the chat.
6. Revisions: when the user asks for changes, call deliverEmail again with the full updated email.

Match the user's language and the brand voice they describe.`,
};
