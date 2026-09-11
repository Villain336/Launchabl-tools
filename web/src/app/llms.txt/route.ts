import { siteConfig, tools } from "@/lib/site-config";
import { caseStudies } from "@/lib/case-studies";

export const dynamic = "force-static";

/**
 * llms.txt (llmstxt.org): a curated map of the site for language models.
 * Generated from site-config so it never drifts from the tool catalogue.
 */
export function GET() {
  const url = (path: string) => `${siteConfig.url}${path}`;
  const live = tools.filter((t) => t.status === "live");
  const beta = tools.filter((t) => t.status === "beta");

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    `Launchabl has two halves. The tools are free forever with no account: chat-style assistants for SEO, performance, compliance, copy, email, structured data and design that run on the user's URL or brief and return checklists, files and previews. The agency is a one-time ${siteConfig.price} for unlimited marketing and design work for life — no retainers. Tools run as a conversation: paste a URL or describe what you need, the assistant runs the analysis or writes the deliverable, and you download it.`,
    "",
    "## Free tools",
    "",
    ...live.map((t) => `- [${t.name}](${url(`/tools/${t.slug}`)}): ${t.shortDescription}`),
    "",
    "## Tools in beta",
    "",
    ...beta.map((t) => `- [${t.name}](${url(`/tools/${t.slug}`)}): ${t.shortDescription}`),
    "",
    "## Agency",
    "",
    `- [Pricing](${url("/pricing")}): ${siteConfig.price} one-time for unlimited marketing and design — ${siteConfig.priceNote}.`,
    `- [Solutions](${url("/solutions")}): What the agency delivers — brand, website, content, SEO — and how requests work.`,
    ...caseStudies.map((c) => `- [Case study: ${c.client}](${url(`/case-studies/${c.slug}`)}): ${c.summary}`),
    "",
    "## Optional",
    "",
    `- [About](${url("/about")}): Who runs Launchabl and why the tools are free.`,
    `- [Roadmap](${url("/roadmap")}): What's being built next.`,
    `- [Privacy policy](${url("/legal/privacy")})`,
    `- [Terms](${url("/legal/terms")})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
