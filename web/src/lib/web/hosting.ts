/**
 * Hosting knowledge base: the providers we recommend, who each is right
 * for, what they cost, and the exact DNS records to connect a domain.
 * The model picks providers by id; the server fills in the facts so the
 * deliverable never contains an invented IP or price.
 */

export type DnsRecord = { host: string; type: "A" | "AAAA" | "CNAME" | "ALIAS" | "TXT"; value: string; note?: string };

export type HostingProvider = {
  id: string;
  name: string;
  kind: "static-jamstack" | "fullstack-platform" | "managed-wordpress" | "site-builder" | "vps" | "ecommerce";
  bestFor: string;
  stacks: string[];
  freeTier: string | null;
  startingPrice: string;
  ssl: string;
  /** Records for apex + www. `{target}` placeholders are filled from the provider's dashboard. */
  dns: DnsRecord[];
  connectDocs: string;
  deploy: string[];
  caveats: string[];
};

export const HOSTING_PROVIDERS: HostingProvider[] = [
  {
    id: "vercel",
    name: "Vercel",
    kind: "fullstack-platform",
    bestFor: "Next.js and modern React/Svelte/Nuxt sites with serverless APIs; the fastest path from a Git repo to a global site.",
    stacks: ["nextjs", "react", "svelte", "nuxt", "astro", "remix", "static"],
    freeTier: "Hobby: free for personal, non-commercial projects (100 GB bandwidth).",
    startingPrice: "Pro $20/user/month for commercial use",
    ssl: "Automatic, free, auto-renewing",
    dns: [
      { host: "@", type: "A", value: "76.76.21.21" },
      { host: "www", type: "CNAME", value: "cname.vercel-dns.com" },
    ],
    connectDocs: "https://vercel.com/docs/domains/working-with-domains/add-a-domain",
    deploy: ["Push the project to GitHub/GitLab/Bitbucket.", "Import the repo at vercel.com/new — framework is auto-detected.", "Add environment variables under Settings → Environment Variables.", "Add the domain under Settings → Domains and publish the DNS records shown."],
    caveats: ["Hobby plan forbids commercial sites — a business needs Pro.", "Serverless functions have execution limits; long jobs need a queue or cron."],
  },
  {
    id: "netlify",
    name: "Netlify",
    kind: "static-jamstack",
    bestFor: "Static and Jamstack sites (Astro, Hugo, Eleventy, Gatsby) with forms and simple functions.",
    stacks: ["astro", "hugo", "eleventy", "gatsby", "react", "static", "nextjs"],
    freeTier: "Free: 100 GB bandwidth, 300 build minutes, commercial use allowed.",
    startingPrice: "Pro $19/member/month",
    ssl: "Automatic, free (Let's Encrypt)",
    dns: [
      { host: "@", type: "A", value: "75.2.60.5", note: "Or use Netlify DNS and an ALIAS/ANAME record if your DNS host supports it." },
      { host: "www", type: "CNAME", value: "{site-name}.netlify.app" },
    ],
    connectDocs: "https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/",
    deploy: ["Connect the Git repo at app.netlify.com.", "Set the build command and publish directory (auto-detected for common frameworks).", "Add the custom domain under Domain management and publish the DNS records."],
    caveats: ["Bandwidth overages on the free tier are billed automatically once you add a card.", "Next.js server features work but are second-class compared with Vercel."],
  },
  {
    id: "cloudflare-pages",
    name: "Cloudflare Pages",
    kind: "static-jamstack",
    bestFor: "Static sites and edge-rendered apps where cost and global speed matter most; unlimited bandwidth on the free plan.",
    stacks: ["astro", "hugo", "static", "react", "svelte", "nextjs", "remix"],
    freeTier: "Free: unlimited bandwidth and requests, 500 builds/month.",
    startingPrice: "Workers Paid $5/month for heavier server-side use",
    ssl: "Automatic, free, plus Cloudflare's CDN and WAF",
    dns: [{ host: "@", type: "CNAME", value: "{project}.pages.dev", note: "Cloudflare DNS flattens the apex CNAME automatically." }, { host: "www", type: "CNAME", value: "{project}.pages.dev" }],
    connectDocs: "https://developers.cloudflare.com/pages/configuration/custom-domains/",
    deploy: ["Move the domain's nameservers to Cloudflare (free plan) — this is what makes the apex CNAME and WAF work.", "Create a Pages project from the Git repo and set the build output directory.", "Add the custom domain in the Pages project; the DNS record is created for you."],
    caveats: ["Full-stack frameworks run on Workers, not Node — some npm packages won't work.", "Best experience requires moving DNS to Cloudflare."],
  },
  {
    id: "github-pages",
    name: "GitHub Pages",
    kind: "static-jamstack",
    bestFor: "Documentation and simple static sites already living in a GitHub repo; zero cost.",
    stacks: ["static", "hugo", "jekyll", "astro"],
    freeTier: "Free for public repos (and private repos on paid GitHub plans); 100 GB/month soft bandwidth limit.",
    startingPrice: "Free",
    ssl: "Automatic, free (tick Enforce HTTPS)",
    dns: [
      { host: "@", type: "A", value: "185.199.108.153" },
      { host: "@", type: "A", value: "185.199.109.153" },
      { host: "@", type: "A", value: "185.199.110.153" },
      { host: "@", type: "A", value: "185.199.111.153" },
      { host: "www", type: "CNAME", value: "{user}.github.io" },
    ],
    connectDocs: "https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site",
    deploy: ["Enable Pages in the repo settings and choose the branch/folder or a GitHub Actions build.", "Add a CNAME file with the domain (or set it in Settings → Pages).", "Publish the DNS records, then tick Enforce HTTPS once the certificate issues."],
    caveats: ["Static only — no server code, no forms without a third party.", "Not intended for commercial e-commerce sites under GitHub's terms."],
  },
  {
    id: "render",
    name: "Render",
    kind: "fullstack-platform",
    bestFor: "Full-stack apps with a real server (Node, Python, Go, Rails, Docker) plus managed Postgres, without running a VPS.",
    stacks: ["node", "python", "django", "rails", "docker", "go", "static"],
    freeTier: "Free static sites; free web services spin down after inactivity.",
    startingPrice: "Web service from $7/month; Postgres from $7/month",
    ssl: "Automatic, free",
    dns: [
      { host: "@", type: "A", value: "216.24.57.1" },
      { host: "www", type: "CNAME", value: "{service}.onrender.com" },
    ],
    connectDocs: "https://render.com/docs/custom-domains",
    deploy: ["Create a Web Service from the Git repo; set build and start commands.", "Add a managed Postgres/Redis if needed and wire the connection string via environment variables.", "Add the custom domain under Settings and publish the records."],
    caveats: ["Free web services cold-start (30 s+) — not for a customer-facing site.", "Regions are limited compared with the big clouds."],
  },
  {
    id: "railway",
    name: "Railway",
    kind: "fullstack-platform",
    bestFor: "Developers who want Heroku-style deploys for APIs, workers and databases with usage-based pricing.",
    stacks: ["node", "python", "docker", "go", "rails", "nextjs"],
    freeTier: "Trial credit only; Hobby is $5/month including $5 of usage.",
    startingPrice: "Hobby $5/month + usage",
    ssl: "Automatic, free",
    dns: [{ host: "www", type: "CNAME", value: "{service}.up.railway.app" }, { host: "@", type: "ALIAS", value: "{service}.up.railway.app", note: "Apex needs ALIAS/ANAME/CNAME flattening (Cloudflare, Porkbun, DNSimple)." }],
    connectDocs: "https://docs.railway.com/guides/public-networking#custom-domains",
    deploy: ["Create a project from the repo; Railway detects the language and builds with Nixpacks or your Dockerfile.", "Add databases as services in the same project.", "Generate a domain, then add your custom domain and publish the CNAME."],
    caveats: ["Usage-based billing can surprise you — set a spend limit.", "No native apex A record; use a DNS host with CNAME flattening."],
  },
  {
    id: "fly",
    name: "Fly.io",
    kind: "fullstack-platform",
    bestFor: "Apps that need to run close to users in many regions, or need persistent VMs, WebSockets and Docker control.",
    stacks: ["docker", "node", "elixir", "rails", "go", "python"],
    freeTier: "No free tier since 2024 (pay-as-you-go, small apps ~$2–5/month).",
    startingPrice: "From ~$2/month per small machine",
    ssl: "Free certificates via `fly certs add`",
    dns: [
      { host: "@", type: "A", value: "{ipv4 from `fly ips list`}" },
      { host: "@", type: "AAAA", value: "{ipv6 from `fly ips list`}" },
      { host: "www", type: "CNAME", value: "{app}.fly.dev" },
    ],
    connectDocs: "https://fly.io/docs/networking/custom-domain/",
    deploy: ["`fly launch` in the project to generate fly.toml and a Dockerfile.", "`fly deploy`, then `fly ips allocate-v4` (shared is fine) and `fly certs add yourdomain.com`.", "Publish the A/AAAA records and let the certificate issue."],
    caveats: ["CLI-first; expect to read logs and tune machines yourself.", "Persistent volumes are per-region — plan your database placement."],
  },
  {
    id: "digitalocean-app",
    name: "DigitalOcean App Platform",
    kind: "fullstack-platform",
    bestFor: "Teams that want a PaaS with predictable flat pricing and the option to drop down to Droplets (VPS) later.",
    stacks: ["node", "python", "php", "docker", "static", "go"],
    freeTier: "3 free static sites.",
    startingPrice: "Web service from $5/month",
    ssl: "Automatic, free",
    dns: [{ host: "@", type: "A", value: "{IP shown in App → Settings → Domains}" }, { host: "www", type: "CNAME", value: "{app}.ondigitalocean.app" }],
    connectDocs: "https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/",
    deploy: ["Create an app from the repo; choose the component type (service, static site, worker).", "Attach a managed database if needed.", "Add the domain under Settings → Domains and publish the records (or use DO's nameservers)."],
    caveats: ["Fewer framework niceties than Vercel/Netlify — you set build commands yourself."],
  },
  {
    id: "hetzner-vps",
    name: "Hetzner Cloud (VPS + Coolify/Dokploy)",
    kind: "vps",
    bestFor: "Cost-conscious developers comfortable with a server: a €4–10 VPS running Coolify or Dokploy gives you a private Vercel/Heroku for unlimited apps.",
    stacks: ["docker", "node", "python", "php", "rails", "go", "nextjs"],
    freeTier: null,
    startingPrice: "From ~€4/month for 2 vCPU / 4 GB",
    ssl: "Automatic via Coolify/Dokploy (Let's Encrypt / Traefik)",
    dns: [{ host: "@", type: "A", value: "{server IPv4}" }, { host: "*", type: "A", value: "{server IPv4}", note: "Wildcard lets Coolify give each app its own subdomain." }],
    connectDocs: "https://coolify.io/docs",
    deploy: ["Create the server (Ubuntu), point the A records at it.", "Install Coolify or Dokploy with their one-line installer; log in on port 8000/3000.", "Connect GitHub, add each app with its domain, and let Traefik handle certificates.", "Set up automated backups (Hetzner snapshots + database dumps to object storage)."],
    caveats: ["You own uptime, security patches and backups.", "One region per server — add Cloudflare in front for global caching."],
  },
  {
    id: "kinsta",
    name: "Kinsta",
    kind: "managed-wordpress",
    bestFor: "WordPress sites for businesses that want speed, staging, backups and support handled — no plugins for caching or security.",
    stacks: ["wordpress"],
    freeTier: "Free static-site hosting (not WordPress).",
    startingPrice: "Managed WordPress from $35/month (1 site, 25k visits)",
    ssl: "Automatic, free (Cloudflare integration included)",
    dns: [{ host: "@", type: "A", value: "{IP shown in MyKinsta → Domains}" }, { host: "www", type: "CNAME", value: "{site}.kinsta.cloud" }],
    connectDocs: "https://kinsta.com/docs/wordpress-hosting/domains/point-domain/",
    deploy: ["Add the site in MyKinsta (new install or migration — free migrations included).", "Push content, then add the domain and publish the records.", "Enable the CDN and edge caching; set up the staging environment for changes."],
    caveats: ["Visit-based pricing — a traffic spike moves you up a tier.", "WordPress only."],
  },
  {
    id: "wp-engine",
    name: "WP Engine",
    kind: "managed-wordpress",
    bestFor: "Agencies running many WordPress sites who want a mature platform with Local dev tooling and Genesis themes.",
    stacks: ["wordpress"],
    freeTier: null,
    startingPrice: "From $20–30/month (1 site, 25k visits) on annual billing",
    ssl: "Automatic, free",
    dns: [{ host: "@", type: "A", value: "{IP shown in User Portal → Domains}" }, { host: "www", type: "CNAME", value: "{environment}.wpengine.com" }],
    connectDocs: "https://wpengine.com/support/add-domain-in-user-portal/",
    deploy: ["Create the environment, migrate with the WP Engine Automated Migration plugin.", "Add the domain in the User Portal and publish the records.", "Use the dev → staging → production pipeline for changes."],
    caveats: ["Restricts some plugins (backup and caching plugins are replaced by platform features).", "Overages on visits and storage are billed."],
  },
  {
    id: "hostinger",
    name: "Hostinger",
    kind: "managed-wordpress",
    bestFor: "Smallest budgets: a brochure site or WordPress blog for a few dollars a month with a free domain in the first year.",
    stacks: ["wordpress", "php", "static"],
    freeTier: null,
    startingPrice: "From ~$3/month on a multi-year plan (renews higher)",
    ssl: "Free, automatic",
    dns: [{ host: "@", type: "A", value: "{IP shown in hPanel → DNS}" }, { host: "www", type: "CNAME", value: "{your-domain}" }],
    connectDocs: "https://support.hostinger.com/en/articles/1583227-how-to-point-a-domain-to-hostinger",
    deploy: ["Buy the plan (free domain included on annual plans), install WordPress from hPanel.", "Point the domain (or use Hostinger nameservers) and enable SSL.", "Turn on LiteSpeed caching and daily backups."],
    caveats: ["Introductory pricing renews at 2–3×.", "Shared hosting — performance varies with neighbours; fine for low traffic."],
  },
  {
    id: "webflow",
    name: "Webflow",
    kind: "site-builder",
    bestFor: "Marketing sites designed visually by a designer or agency, with a CMS and no code to maintain.",
    stacks: ["site-builder"],
    freeTier: "Free Starter for staging on a webflow.io subdomain.",
    startingPrice: "Basic site plan $14/month (annual); CMS $23/month",
    ssl: "Automatic, free",
    dns: [
      { host: "@", type: "A", value: "75.2.70.75" },
      { host: "@", type: "A", value: "99.83.190.102" },
      { host: "www", type: "CNAME", value: "proxy-ssl.webflow.com" },
    ],
    connectDocs: "https://help.webflow.com/hc/en-us/articles/33961244034963",
    deploy: ["Build in the Designer; add a Site plan.", "Add the custom domain under Site settings → Publishing and publish the records above.", "Set www (or apex) as default and publish."],
    caveats: ["Hosting is bundled with the site plan — you can't host Webflow exports elsewhere with the CMS.", "Complex apps need a separate backend."],
  },
  {
    id: "framer",
    name: "Framer",
    kind: "site-builder",
    bestFor: "Fast, design-led landing pages and startup sites with animation, published straight from the canvas.",
    stacks: ["site-builder"],
    freeTier: "Free on a framer.app subdomain.",
    startingPrice: "Mini $5/month (2 pages); Basic $15/month",
    ssl: "Automatic, free",
    dns: [
      { host: "@", type: "A", value: "76.76.21.21" },
      { host: "www", type: "CNAME", value: "sites.framer.app" },
    ],
    connectDocs: "https://www.framer.com/help/articles/how-to-connect-a-custom-domain/",
    deploy: ["Design and publish to the free subdomain first.", "Add a site plan, then Site settings → Domains → add the domain and publish the records.", "Verify and set the primary domain."],
    caveats: ["CMS and forms are limited compared with Webflow.", "Not for apps with logins or dashboards."],
  },
  {
    id: "squarespace",
    name: "Squarespace",
    kind: "site-builder",
    bestFor: "Small businesses and creatives who want a polished site, bookings and simple store without touching code.",
    stacks: ["site-builder"],
    freeTier: "14-day trial.",
    startingPrice: "From $16/month (annual)",
    ssl: "Automatic, free",
    dns: [
      { host: "@", type: "A", value: "198.185.159.144" },
      { host: "@", type: "A", value: "198.185.159.145" },
      { host: "@", type: "A", value: "198.49.23.144" },
      { host: "@", type: "A", value: "198.49.23.145" },
      { host: "www", type: "CNAME", value: "ext-cust.squarespace.com" },
    ],
    connectDocs: "https://support.squarespace.com/hc/en-us/articles/205812378",
    deploy: ["Pick a template and build.", "Settings → Domains → Use a domain I own; follow the connect wizard (it shows a verification CNAME as well).", "Set the primary domain and enable SSL Secure."],
    caveats: ["Limited design freedom versus Webflow/Framer.", "Transaction fees on the cheaper commerce plans."],
  },
  {
    id: "shopify",
    name: "Shopify",
    kind: "ecommerce",
    bestFor: "Any real online store: checkout, payments, taxes, shipping and apps are all handled.",
    stacks: ["ecommerce"],
    freeTier: "3-day trial, then $1/month for the first months.",
    startingPrice: "Basic $39/month (or $29 annual) + payment fees",
    ssl: "Automatic, free",
    dns: [
      { host: "@", type: "A", value: "23.227.38.65" },
      { host: "www", type: "CNAME", value: "shops.myshopify.com" },
    ],
    connectDocs: "https://help.shopify.com/en/manual/domains/add-a-domain/connecting-domains/connect-domain-manual",
    deploy: ["Set up products, payments and shipping in the admin.", "Settings → Domains → Connect existing domain and publish the records.", "Set as primary and turn on redirects."],
    caveats: ["Extra fees when not using Shopify Payments.", "Blog and content pages are weaker — some stores pair it with a Webflow/Framer marketing site."],
  },
];

export const HOSTING_IDS = HOSTING_PROVIDERS.map((p) => p.id);

export function getProvider(id: string): HostingProvider | undefined {
  return HOSTING_PROVIDERS.find((p) => p.id === id);
}

/** Substitute the domain into DNS record templates for display. */
export function dnsRecordsFor(provider: HostingProvider, domain: string | null): DnsRecord[] {
  return provider.dns.map((r) => ({ ...r, value: r.value.replace("{your-domain}", domain ?? "yourdomain.com") }));
}

export type StackDetection = {
  framework: string | null;
  cms: string | null;
  host: string | null;
  cdn: string | null;
  server: string | null;
  signals: string[];
};

type Sig = { name: string; test: (h: Headers, html: string) => boolean };

const FRAMEWORKS: Sig[] = [
  { name: "Next.js", test: (h, html) => /\/_next\//.test(html) || h.has("x-nextjs-cache") || /__NEXT_DATA__|__next_f/.test(html) },
  { name: "Nuxt", test: (_h, html) => /__nuxt|\/_nuxt\//.test(html) },
  { name: "Gatsby", test: (_h, html) => /___gatsby/.test(html) },
  { name: "Astro", test: (_h, html) => /astro-island|name="generator" content="Astro/i.test(html) },
  { name: "SvelteKit", test: (_h, html) => /sveltekit|__sveltekit/i.test(html) },
  { name: "Remix", test: (_h, html) => /__remixContext|remix-run/i.test(html) },
  { name: "Angular", test: (_h, html) => /ng-version=/.test(html) },
  { name: "Vue", test: (_h, html) => /data-v-[0-9a-f]{6,}/.test(html) },
  { name: "Hugo", test: (_h, html) => /name="generator" content="Hugo/i.test(html) },
  { name: "Jekyll", test: (_h, html) => /name="generator" content="Jekyll/i.test(html) },
  { name: "Eleventy", test: (_h, html) => /name="generator" content="Eleventy/i.test(html) },
];

const CMSES: Sig[] = [
  { name: "WordPress", test: (_h, html) => /wp-content|wp-includes|name="generator" content="WordPress/i.test(html) },
  { name: "Shopify", test: (h, html) => h.has("x-shopify-stage") || /cdn\.shopify\.com/.test(html) },
  { name: "Webflow", test: (_h, html) => /webflow\.js|data-wf-(page|site)/.test(html) },
  { name: "Squarespace", test: (h, html) => /squarespace/i.test(h.get("server") ?? "") || /static1\.squarespace\.com/.test(html) },
  { name: "Wix", test: (h, html) => h.has("x-wix-request-id") || /static\.wixstatic\.com|wix\.com/.test(html) },
  { name: "Framer", test: (_h, html) => /framerusercontent\.com|name="generator" content="Framer/i.test(html) },
  { name: "HubSpot CMS", test: (h, html) => h.has("x-hs-hub-id") || /hs-sites\.com|hubspotusercontent/.test(html) },
  { name: "Ghost", test: (_h, html) => /name="generator" content="Ghost/i.test(html) },
  { name: "Drupal", test: (h, html) => h.has("x-drupal-cache") || /name="generator" content="Drupal/i.test(html) },
  { name: "Joomla", test: (_h, html) => /name="generator" content="Joomla/i.test(html) },
];

const HOSTS: Sig[] = [
  { name: "Vercel", test: (h) => h.has("x-vercel-id") || /vercel/i.test(h.get("server") ?? "") },
  { name: "Netlify", test: (h) => h.has("x-nf-request-id") || /netlify/i.test(h.get("server") ?? "") },
  { name: "GitHub Pages", test: (h) => /github\.com/i.test(h.get("server") ?? "") },
  { name: "Render", test: (h) => h.has("x-render-origin-server") },
  { name: "Fly.io", test: (h) => h.has("fly-request-id") },
  { name: "Railway", test: (h) => h.has("x-railway-request-id") || /railway/i.test(h.get("server") ?? "") },
  { name: "Kinsta", test: (h) => h.has("x-kinsta-cache") },
  { name: "WP Engine", test: (h) => /wp engine/i.test(h.get("x-powered-by") ?? "") },
  { name: "Cloudflare Pages", test: (h) => h.has("cf-ray") && /pages\.dev/i.test(h.get("x-served-by") ?? "") },
  { name: "AWS (CloudFront/S3/Amplify)", test: (h) => h.has("x-amz-cf-id") || h.has("x-amz-request-id") || /AmazonS3/i.test(h.get("server") ?? "") },
  { name: "Google Cloud / Firebase", test: (h) => /Google Frontend/i.test(h.get("server") ?? "") || h.has("x-cloud-trace-context") },
  { name: "Azure Static Web Apps", test: (h) => h.has("x-azure-ref") },
  { name: "Squarespace", test: (h) => /squarespace/i.test(h.get("server") ?? "") },
  { name: "Shopify", test: (h) => h.has("x-shopify-stage") },
  { name: "Webflow (AWS)", test: (h, html) => /webflow\.js|data-wf-site/.test(html) && !h.has("x-vercel-id") },
];

const CDNS: Sig[] = [
  { name: "Cloudflare", test: (h) => h.has("cf-ray") || /cloudflare/i.test(h.get("server") ?? "") },
  { name: "Fastly", test: (h) => h.has("x-fastly-request-id") || /fastly/i.test(h.get("x-served-by") ?? "") },
  { name: "Akamai", test: (h) => h.has("x-akamai-transformed") || /AkamaiGHost/i.test(h.get("server") ?? "") },
  { name: "CloudFront", test: (h) => h.has("x-amz-cf-id") },
  { name: "Bunny", test: (h) => /BunnyCDN/i.test(h.get("server") ?? "") },
];

/** Infer framework, CMS, host and CDN from response headers and HTML. Pure; testable. */
export function detectStack(headers: Headers, html: string): StackDetection {
  const first = (list: Sig[]) => list.find((s) => s.test(headers, html))?.name ?? null;
  const signals: string[] = [];
  for (const key of ["server", "x-powered-by", "x-vercel-id", "x-nf-request-id", "cf-ray", "x-amz-cf-id", "x-shopify-stage", "x-kinsta-cache", "x-render-origin-server", "fly-request-id", "x-github-request-id"]) {
    const v = headers.get(key);
    if (v) signals.push(`${key}: ${v.length > 40 ? `${v.slice(0, 40)}…` : v}`);
  }
  const generator = /<meta[^>]+name="generator"[^>]+content="([^"]+)"/i.exec(html)?.[1];
  if (generator) signals.push(`generator: ${generator}`);
  return { framework: first(FRAMEWORKS), cms: first(CMSES), host: first(HOSTS), cdn: first(CDNS), server: headers.get("server"), signals };
}

export function dnsRecordsText(records: DnsRecord[], domain: string | null): string {
  const d = domain ?? "yourdomain.com";
  return records.map((r) => `${r.host === "@" ? d : `${r.host}.${d}`}\t${r.type}\t${r.value}${r.note ? `\t; ${r.note}` : ""}`).join("\n");
}
