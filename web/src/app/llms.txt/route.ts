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
    "Launchabl is a build-and-run agency with a client and customer network. Home services use DoorDash-style dispatch. We also hunt frequent asks that have no established platform (appliance repair, mobile detailing, kitchen hoods) — those are agency-first, not empty city pages. Medspas, dentists, and vets get booking and local demand, not a clinical chart. Build is $1,200. Network is $99/month. Run is $497/month and includes Network.",
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
    `- [Agency](${url("/agency")}): Build $1,200 · Network $99/month · Run $497/month.`,
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
