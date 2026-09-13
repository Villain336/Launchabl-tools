import { siteConfig } from "@/lib/site-config";
import { publicTools } from "@/lib/marketplace/catalog";
import { FOUNDING_LISTINGS } from "@/lib/marketplace/founding";
import { caseStudies } from "@/lib/case-studies";

export const dynamic = "force-static";

export function GET() {
  const url = (path: string) => `${siteConfig.url}${path}`;
  const live = publicTools().filter((t) => t.status === "live");
  const beta = publicTools().filter((t) => t.status === "beta");

  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "Launchabl is a North Carolina service-business directory and OS. Homeowners pick a trade to ping available crews (first claim owns the job) or book a specific contractor's calendar. Contractors claim, quote, and get paid in the OS, and run customers, jobs, estimates, and a customizable public storefront. The agency offers Launch ($1,200 one-time) and Managed Growth ($497/month). Public SEO tools stay free as the acquisition engine.",
    "",
    "## Directory",
    "",
    `- [NC directory](${url("/nc")}): Cities and trades across North Carolina.`,
    ...FOUNDING_LISTINGS.map((l) => `- [${l.name}](${url(`/nc/${l.cities[0]}/${l.trades[0]}/${l.slug}`)}): ${l.storefront.tagline}`),
    "",
    "## OS and agency",
    "",
    `- [The OS](${url("/os")}): Self-serve operations for contractors.`,
    `- [Offers](${url("/os/offers")}): Claim city-wide jobs pinged to the crew.`,
    `- [Storefront editor](${url("/os/storefront")}): Customize the public listing.`,
    `- [Agency](${url("/agency")}): Launch $1,200 · Managed Growth $497/month.`,
    `- [Pricing](${url("/pricing")})`,
    "",
    "## Free SEO tools",
    "",
    ...live.map((t) => `- [${t.name}](${url(`/tools/${t.slug}`)}): ${t.shortDescription}`),
    "",
    "## Tools in beta",
    "",
    ...beta.map((t) => `- [${t.name}](${url(`/tools/${t.slug}`)}): ${t.shortDescription}`),
    "",
    "## Case studies",
    "",
    ...caseStudies.map((c) => `- [Case study: ${c.client}](${url(`/case-studies/${c.slug}`)}): ${c.summary}`),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
