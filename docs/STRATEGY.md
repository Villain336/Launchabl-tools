# Strategy: The Lifetime Marketing OS

A plan for turning "unlimited marketing services + a free tools suite" into a defensible, high-converting business — not just a website.

---

## 1. The core insight

"Unlimited service for one price" (Design Joy model) is a **retention and trust problem**, not a services problem. Anyone can promise unlimited design/marketing. What makes Design Joy work is:

- A tight, well-defined scope (no client can ask for "anything")
- A queue-based delivery system that feels instant
- Radical transparency (public request board, turnaround SLAs)
- A single price that removes negotiation friction

Your unlock is different and bigger: **you also own a tools platform that does real work for free, every day, for people who will never buy the subscription.** That's not a lead magnet bolted onto a services page — it's a second product with its own growth loop. Treat it that way.

**Positioning statement:**
> "The only marketing platform where the tools are free forever and the agency is unlimited for life."

Everything below optimizes for one thing: **the tools acquire, the subscription monetizes, and the case studies convert the fence-sitters.**

---

## 2. What actually makes this unique (vs. every other "AI tools + agency" site)

Most competitors in this space fall into two buckets:

1. **Tool aggregators** (TinyWow, iLoveIMG, SmallSEOTools) — huge traffic, zero brand loyalty, no upsell path, monetized by ugly ads.
2. **Design-subscription agencies** (Design Joy, DesignPad, Penji) — great retention model, but no organic acquisition engine; 100% paid ads or referral.

You're combining both, which almost nobody does well. To make that combination *actually* unique instead of "a tools page bolted onto an agency site," lean into these differentiators:

### 2.1 Every tool is a diagnostic, not just a utility
Instead of "here's your converted file, goodbye," every tool ends with a **relevant, specific insight about the user's brand** that naturally points at a service you sell:
- Metadata remover → "Here's what your file metadata revealed about your business (device, location, software version). Want us to audit your whole site for data leaks?"
- Schema markup generator → after generating, **run a live check against their actual URL** and show what schema is missing site-wide, not just what they typed in.
- Brand creator → don't just suggest a name, generate a mini logo lockup + color palette + one-line positioning statement, so the output already feels like $500 of work.
- QR code generator → attach free scan analytics (scan count, location, device) for 90 days. This creates a recurring reason to come back, and a natural upsell ("upgrade to unlimited dynamic QR codes + analytics").

This turns "tool" into "top-of-funnel micro-audit," which is a much stronger lead-gen mechanic than a generic converter.

### 2.2 One account, one asset library, across every tool
Competitors treat each tool as disposable — you upload, download, close the tab. Instead:
- Every output (converted file, generated QR, watermarked image, schema snippet, brand kit) saves to a **free "Brand Vault"** account.
- This is the single biggest differentiator available to you: it turns a one-off utility visit into a reason to create an account, and a reason to come back. It's also the natural upsell surface ("Unlimited plan members get versioning, team sharing, and CDN hosting for everything in their Vault").

### 2.3 Tools are organized by outcome, not by file type
Don't bucket tools as "Image Tools / SEO Tools / Domain Tools" (that's how TinyWow does it, and it signals "utility site," not "agency"). Bucket by the marketing job the visitor is trying to do:

- **Launch a brand** → Brand Creator, Domain Availability + Purchase, Hosting, Copywriter, Logo/Watermark generator
- **Protect & clean your assets** → Watermark Remover, Watermark Generator, Metadata Remover
- **Get found** → Schema Markup Generator, (future: Meta Tag Generator, Sitemap Generator, robots.txt Generator)
- **Convert & ship** → File Converter, Image Converter, QR Code Generator

Each cluster becomes a page with a "Need more than a tool? Here's what our unlimited plan handles for this." panel — a direct, contextual bridge from free tool to paid service.

### 2.4 Transparent, public build queue (borrow Design Joy's best idea, apply it to tools too)
Design Joy's public request board is why people trust "unlimited." Do the same thing for the tools roadmap: a public `/roadmap` page showing exactly what tool is being built next and letting free users vote. This does three jobs at once: (1) SEO content that refreshes constantly, (2) trust signal ("this is a real, growing platform"), (3) a natural retention email trigger ("the tool you voted for just shipped").

### 2.5 Legal/ethical framing as a feature, not a footnote
"Watermark remover" is the single riskiest tool in your list — see §6. Turn the constraint into a differentiator: be the *only* watermark tool that makes users attest to ownership, and market that loudly ("Built for creators reclaiming their own work — not stock theft"). This is both a legal shield and a trust/PR angle competitors ignore.

---

## 3. Information architecture / sitemap

```
/                      Home — hero, tool teaser strip, "unlimited" pitch, social proof, CTA
/solutions             What's included in the unlimited plan (service catalog, by outcome cluster)
/solutions/[slug]      Deep page per solution (e.g. /solutions/brand-launch, /solutions/seo-content)
/pricing               The one-time price, what "unlimited" means/doesn't mean, guarantee, FAQ
/tools                 Tools hub — the flagship page (see §4)
/tools/[tool-slug]     Individual tool page (functional tool + SEO content + upsell panel)
/vault                 Free account dashboard: saved outputs across all tools (growth/retention hook)
/case-studies          Testimonials + before/after case studies, filterable by industry/service
/case-studies/[slug]   Individual case study
/about                 Story, team, process, the "unlimited" philosophy explained
/roadmap               Public tool + feature roadmap with voting (trust + SEO + retention)
/blog                  SEO content engine, tool-adjacent ("how to remove metadata from a PDF and why it matters")
/legal/terms, /privacy, /acceptable-use   Critical given watermark/metadata tools — see §6
```

Navigation should put **Tools** first or second in the header (it's your traffic engine), with **Pricing/Get Unlimited** as the persistent sticky CTA on every tool page.

---

## 4. The Tools page: how to make it the flagship

The tools hub is the biggest surface area and the main SEO/acquisition engine. Structure:

1. **Search + outcome-based filter chips** (the four clusters from §2.3), not a flat grid — flat grids of 10+ tools feel like a directory, not a product.
2. **Each tool card shows a live micro-preview** (e.g., a tiny before/after thumbnail for watermark tools, a sample QR code that regenerates), not just an icon + name. This is a huge, cheap differentiator — almost no competitor animates or previews on the hub page.
3. **"Most used this week" and "Newest" rails** — social proof + freshness signal, and doubles as a lightweight leaderboard that encourages the team to keep shipping tools.
4. **Every tool page follows one strict template** so the platform feels cohesive instead of like 12 different mini-apps glued together:
   - Tool UI (functional, no login wall for the core action)
   - "What this does and why it matters" (SEO/educational copy, 300–600 words)
   - "Common mistakes" or "Pro tip" callout — establishes expertise
   - Contextual upsell: "This tool handles X. Our unlimited plan also handles Y, Z for your whole site/brand."
   - Related tools (cross-sell within the same outcome cluster)
   - FAQ block (targets long-tail search queries, e.g. "does removing metadata delete EXIF GPS data")
5. **No forced signup for single-use actions.** Require an account only to (a) save to the Vault, (b) unlock batch/bulk mode, (c) remove usage limits. This maximizes top-of-funnel volume while still creating a strong, non-annoying reason to convert anonymous → known.
6. **Rate-limit generously but visibly** ("3 free conversions/day, unlimited with an account, everything unlimited with the plan") — this ladder is your entire monetization funnel condensed into one UI pattern, and it should appear consistently across every tool.

---

## 5. Tool-by-tool build notes (the flagship 12)

Grouped by build complexity so the roadmap is realistic. "Client-only" tools can ship fast, are free to run (no server compute cost = good margins on a free tool), and are privacy-friendly (files never leave the browser, which is also great marketing copy: "we never see your files").

### Ship first — pure client-side, no backend cost, privacy angle built in
| Tool | Notes |
|---|---|
| **Metadata (EXIF) remover** | Parse/strip EXIF/IPTC/XMP client-side. Market as "your files never touch our servers." |
| **Image converter** (PNG/JPG/WebP/AVIF/HEIC→...) | Canvas/WASM-based, client-side. |
| **QR code generator** | Client-side generation; add optional server-side redirect layer for "dynamic" QR + scan analytics (the paid upsell). |
| **Watermark generator** | Canvas-based overlay (text/logo, tiling, opacity, position presets for social platforms). |
| **Schema markup (JSON-LD) generator** | Form → structured data by type (Organization, Product, FAQ, LocalBusiness, Article). Add a live URL scanner (fetched server-side) to audit existing schema — this is the "diagnostic" hook from §2.1. |

### Ship second — needs a lightweight backend (compute, storage, or third-party API)
| Tool | Notes |
|---|---|
| **File converter** (docs: PDF↔DOCX, video/audio transcode) | Needs server-side workers (e.g., LibreOffice headless, ffmpeg) — real compute cost, so gate large files/bulk behind the account or the paid plan. |
| **Watermark remover** | Technically the hardest and legally the riskiest — see §6. MVP should target *your own placeholder watermarks* (e.g., removing a client's own stamped watermark from their own asset) via inpainting (e.g., an image-inpainting model/API), with a mandatory ownership attestation gate. Do **not** market this as a way to strip stock-photo or third-party watermarks. |
| **Copywriter** | LLM-backed (server-side proxy to an LLM API — never ship API keys client-side). Ship as structured templates first (ad copy, landing page hero, product description, email subject lines) rather than an open-ended chat box — structured beats generic for both output quality and SEO ("Instagram caption generator," "Google Ad headline generator" are each their own landing page/keyword). |

### Ship third — partner/reseller integrations (revenue-share potential, not just cost)
| Tool | Notes |
|---|---|
| **Domain availability check** | Use a registrar/reseller API (e.g., a domain-search API from a registrar like Namecheap, GoDaddy, or a dedicated domain-availability provider, or a WHOIS/RDAP-based check) — do not scrape registrars directly. |
| **Domain purchase** | Almost always implemented as an **affiliate/reseller checkout redirect** or a full registrar-reseller partnership, not a from-scratch registrar. This is a real revenue line (referral commission) even for users who never buy the unlimited plan. |
| **Hosting** | Same pattern: partner with a host (or offer your own white-labeled hosting via a reseller panel) and earn recurring affiliate/reseller revenue. This is a good candidate to bundle *into* the unlimited plan itself (e.g., "hosting included") rather than sold à la carte. |
| **Brand creator (name + domain availability)** | Combine an AI name/tagline generator with the domain-availability check above in one flow — this is your best single lead-gen tool because it naturally chains into "buy the domain" → "get hosting" → "need a logo/site, that's the unlimited plan." Treat this as the flagship-of-flagships and give it the most polished UX. |

**Recommended MVP order:** Metadata remover → Image converter → QR generator → Watermark generator → Schema generator (5 tools, zero backend cost, ship fast, immediate SEO value) → Brand creator + domain availability (highest lead-gen value, moderate build) → Copywriter → File converter → Domain purchase/Hosting (partner integrations) → Watermark remover last (needs the legal/ownership framework in §6 nailed down first).

---

## 6. Legal, trust, and risk (don't skip this)

- **Watermark remover is the one tool that can create real legal exposure** (DMCA/copyright circumvention concerns if used to strip stock-photo or licensed-content watermarks). Mitigate with: (1) a mandatory checkbox attestation ("I own this content or have explicit rights to edit it"), (2) Terms of Service / Acceptable Use Policy explicitly prohibiting use on third-party copyrighted material, (3) logging attestations, (4) consider limiting the MVP to a narrower, defensible use case (removing a watermark you added yourself, e.g. via the Watermark Generator tool, for asset management).
- **Metadata remover** touches privacy law positioning well ("protect your location/EXIF data") — make sure marketing doesn't imply you retain the data; process client-side and say so explicitly.
- **Domain purchase/hosting** likely means you're a reseller, not a registrar — you need a registrar/reseller agreement (e.g., via a reseller API), and pricing must account for ICANN fees and reseller margin.
- **AI Copywriter output** needs a visible disclaimer about originality/plagiarism checking and should never be marketed as guaranteed-unique or legally cleared copy.
- Every tool page should link a short, tool-specific "How we handle your data" note (client-side vs. server-side processing) — this is cheap to build and is a genuine trust differentiator vs. ad-supported tool aggregators that are vague about data handling.

---

## 7. Monetization model

- **Core offer:** one-time price for "unlimited" marketing/design requests (Design Joy model) — scope this tightly in the fine print (e.g., one active request at a time, defined categories of work, fair-use/reasonable-use clause, no coded custom software). This is what protects margins on "unlimited."
- **Free tier (tools):** ad-free, no paywall on core single-file actions, rate-limited (e.g., N/day) to control compute cost on the backend-dependent tools.
- **Account tier (free):** unlocks the Vault (saved history), removes daily rate limits on client-side tools, unlocks batch actions.
- **Affiliate/reseller revenue:** domain purchase + hosting recommendations, even from users who never buy the core plan — this is incremental revenue the "pure agency" competitors don't have.
- **Upgrade path:** every free-tool result screen has one, single, consistent CTA pattern pointing at the unlimited plan, scoped to what that specific tool implies ("Need a full brand system, not just a name? →").

---

## 8. Growth loops & SEO (why the tools page is worth building first)

- Each tool + each cluster + each "how to" blog post is an independent long-tail SEO landing page. Twelve tools can realistically become 40–60 indexable pages within the first phase (tool page + FAQ variations + comparison posts, e.g. "best free QR code generator with analytics").
- QR codes and shareable outputs (watermarked images, brand kits) carry a small, tasteful "Made with [Brand]" credit link on free-tier outputs — a classic, high-leverage viral loop (same mechanic Canva/Loom used early).
- The public roadmap (§2.4) and case studies both generate recurring, crawlable content without needing a large content team.
- Case studies should be structured as before/after with concrete metrics (traffic, conversion rate, time-to-launch) and tagged by both industry and which specific solution/tool cluster was used — this lets you link directly from a tool page to "see a real client who used this exact workflow," which is a much stronger trust signal than generic testimonials.

---

## 9. Phased roadmap

**Phase 1 — Foundation (this scaffold):** Home, Solutions, Pricing, About, Case Studies shell, Tools hub, 5 client-side tools fully functional (metadata remover, image converter, QR generator, watermark generator, schema generator).

**Phase 2:** Accounts + Vault, Brand Creator + domain availability (real API integration), Copywriter (LLM-backed), analytics on QR codes.

**Phase 3:** File converter (server workers), domain purchase + hosting (reseller/affiliate integration), watermark remover (with attestation/legal framework), public roadmap + voting.

**Phase 4:** The heavy-tools tier (§11) — Website Audit Report, Landing Page Grader, Competitor Gap Report, DNS & Email Health Check, Full Brand Identity Kit, Ad Creative Resizer, Content & Campaign Calendar, Local SEO Optimizer, Sitemap & Robots Generator, White-Label Client Report Builder.

**Phase 5:** Programmatic SEO expansion (more tools per cluster), team/agency features on the Vault, referral program.

---

## 10. What "unique" ultimately means here (first 12 tools)

The tools alone are commoditized (every one of the 12 exists elsewhere, often free). The agency alone is commoditized (Design Joy has direct clones already). The thing that can't be easily cloned is the **connective tissue**: outcome-based organization, a shared account/Vault across every tool, diagnostic-style results that point at real gaps in the user's brand, and a visible, public roadmap that makes the platform feel alive. Build the scaffold so every new tool automatically inherits that connective tissue (same template, same Vault hook, same upsell pattern) rather than being a one-off page — that consistency *is* the moat. §11 below is where that moat gets sharper: a second tier of tools the connective tissue alone can't fake.

---

## 11. The "heavy tools" tier — a second, deliberately harder-to-clone layer

Everything in §5 is a **single-action utility**: upload one thing, get one thing back, in seconds. That's the right MVP — it's cheap to build and easy to use — but it's also exactly what every tool aggregator on the internet already offers, so it converges on a commodity. The genuine moat isn't in shipping more single-action tools; it's in shipping a second tier that generic tool sites structurally can't or won't build, because it requires composing several checks into a judgment call, not just transforming a file.

**The dividing line:** a light tool answers "convert/generate this one thing." A heavy tool answers "tell me something true and specific about my situation that I didn't already know, and hand me a deliverable I can act on or send to someone." That second kind requires domain logic — the actual expertise the agency sells — encoded into the tool. It's also, not coincidentally, a much stronger and more specific upsell surface than a generic converter ever could be.

Ten heavy tools, added as a fifth cluster — **Audits, kits & reports**:

| Tool | What makes it "heavy" | MVP build approach |
|---|---|---|
| **Website Audit Report** | Fetches a real URL server-side and scores it across a dozen SEO/technical signals (title, meta, schema, viewport, HTTPS, image alt coverage, word count, load time) — a genuine multi-part report, not a single check. | Server route fetches + parses HTML with regex/lightweight parsing (no headless browser needed for v1); returns a scored checklist. |
| **Landing Page Conversion Grader** | Reuses the audit engine but re-weights the signals toward conversion (CTA keyword density, form count, phone number presence, above-fold heuristics) — same data, a completely different judgment layer on top. | Same fetch/parse engine as the audit tool, different scoring function client-side. |
| **Competitor Gap Report** | Runs the same engine against your site *and* up to three competitor URLs, side by side — no generic tool site does comparative analysis, because it requires holding multiple results in tension, not just one. | Fan out the same audit call to N URLs; render a diff table. |
| **DNS & Email Deliverability Health Check** | Real SPF/DKIM/DMARC/MX lookups against a live domain — the kind of technical check marketers usually have to ask a developer for. | Server route using Node's `dns` module (`resolveTxt`, `resolveMx`); no third-party API needed for a first pass. |
| **Full Brand Identity Kit** | Goes past "here's a name" (§2.1's Brand Creator) to an actual downloadable kit: a generated monogram/wordmark mark, favicon, and brand guideline export — a deliverable, not a suggestion. | Procedurally generate an SVG mark from initials + the existing palette generator; bundle as a zip client-side. |
| **Ad Creative Resizer** | One upload in, a full set of platform-correct creative sizes out (Instagram feed/story, Facebook, LinkedIn, Google display, etc.) as a single downloadable zip — a batch deliverable, not a one-off. | Canvas-based crop/resize per preset, bundled client-side with a zip library; zero server cost. |
| **Content & Campaign Calendar Generator** | A 30-day, multi-channel plan (not a single caption) tailored to business type and goal, exportable as CSV so it drops straight into a planning tool. | Deterministic template engine client-side (same pattern as the Copywriter), swappable for an LLM later. |
| **Local SEO / Google Business Profile Optimizer** | Produces a full local-presence package — GBP description, category suggestions, Q&A starters, review-response templates — not just one piece of copy. | Template engine client-side; production version would layer in a real GBP API check. |
| **Sitemap & Robots.txt Generator** | Takes a real list of a site's URLs and produces a validated `sitemap.xml` and `robots.txt` pair, not a single boilerplate file. | Client-side generation from a pasted/uploaded URL list; a later version adds live crawling server-side. |
| **White-Label Client Report Builder** | The clearest expression of the platform's actual moat: it composes the *outputs of other tools* (audit findings, brand kit, competitor gap) into one polished, brandable report or proposal a freelancer/agency can send to a client. No tool aggregator can build this, because it requires the connective tissue described in §2.2 and §10 to already exist. | Client-side composer that accepts pasted findings/inputs and renders a printable, brand-colored HTML report. |

**Why this tier is the actual differentiator, not the first 12 tools:** a single-action tool is a commodity the moment a competitor copies the UI. A tool that fetches real data, applies a judgment/scoring layer, and hands back a multi-part deliverable requires the same kind of synthesis work the agency itself sells — which means every heavy tool is simultaneously (a) a genuinely hard-to-clone product feature and (b) a live demonstration of the exact expertise the unlimited plan is selling. The White-Label Report Builder in particular should be read as a preview of what §2.2's "Brand Vault" becomes once accounts exist: a place where tool outputs compound into something no single tool visit could produce alone.

**Sequencing within the tier:** ship the three tools that share the audit engine first (Website Audit Report → Landing Page Grader → Competitor Gap Report) since they're one build amortized three ways, then DNS Health (isolated, zero shared code, fast to ship), then the client-side batch/kit tools (Ad Creative Resizer, Brand Identity Kit), then the template-driven planning tools (Content Calendar, Local SEO Optimizer), then Sitemap/Robots (needs real URLs, so benefits from users already having run an audit), and the White-Label Report Builder last, since it's most valuable once there's real tool output to compose.

---

## 12. Tool backlog — brainstorm for the next wave (marketers, entrepreneurs, developers)

This section captures a wide brainstorm of additional tools, including a founder-supplied starter list, expanded significantly and organized for prioritization. It also proposes a new audience segment — **developers** — since several of the strongest ideas here (test generation, dev utilities) don't fit cleanly into the existing five clusters, which were all marketer/brand-facing.

### 12.1 A new cluster: Developer Tools

Add a sixth cluster, **Developer Tools**, distinct from the marketer-facing five. Rationale: an agency site that *also* has genuinely good developer utilities gets a second, very different acquisition channel (dev.to/Hacker News/GitHub-adjacent traffic) with near-zero overlap against the marketer clusters, and several of these tools are simple, high-leverage, client-side builds — good margin, good SEO, low risk. They don't need to connect to the unlimited plan as tightly as the marketer tools do, but a light connection still works ("need this shipped as a real feature, not just a code snippet? that's what the unlimited plan's dev-adjacent requests are for").

### 12.2 Evaluating the founder-supplied ideas

| Idea (as given) | Refined scope | Tier | Build note / key risk |
|---|---|---|---|
| **Test generator for apps/SaaS** | "App/SaaS QA Test Plan Generator" — crawl a URL (reuse the audit engine) and generate a QA checklist + a Playwright/Cypress test-file skeleton (page loads, forms present, console errors, broken links, mobile viewport) | Heavy / server | v1 can reuse `site-audit.ts`'s fetch layer for static checks; deeper flow-based test generation (login → checkout → confirm) needs either a headless browser or an LLM reading a plain-English description of the flow — treat that as v2. |
| **Reverse image lookup** | Don't build a rival image index (infeasible). Smart-redirect to Google Lens / TinEye / Bing Visual Search with the uploaded image pre-loaded, plus an in-house perceptual-hash duplicate check across a user's own uploaded/Vault images | Light / hybrid | Real "we searched the whole web" reverse image search requires an index the size of Google's — don't attempt to build this in-house; a redirect tool is still genuinely useful and honest about what it does. |
| **Background remover** | In-browser image segmentation (person/product cutout) | Light-to-medium / client | Buildable with a client-side ML model (e.g., a WASM/TF.js segmentation model) — zero server cost, same privacy pitch as the other client-side tools. Quality will trail paid tools (remove.bg) but is a strong free-tier offering. Elevate to "heavy" by adding **batch** background removal for e-commerce product shots. |
| **Transcriber** | Audio/video → text | Heavy / server (real cost) | A live, low-accuracy version can run 100% client-side via the browser's Web Speech API (Chrome-only, no file upload, live mic only) as a free instant demo. A real file-upload transcriber needs a server-side ASR model/API (e.g., Whisper) — this has real per-minute compute cost, so gate long files behind an account or the plan. |
| **Phone number lookup** | Line-type / carrier / spam-risk lookup for a number you already have (e.g., verifying an inbound lead) | Heavy / partner API | Needs a carrier-lookup API (e.g., a phone intelligence provider) — real per-lookup cost. **Legal/positioning risk:** must be scoped and marketed strictly as lead/lineage verification for numbers you already have a business reason to check, never as a general "find anyone's number" people-search tool — the latter invites stalking/harassment misuse and regulatory scrutiny (see the eToro-style "never build the surveillance version of a legitimate tool" principle). |
| **Burner / disposable email** | Temporary inbox for testing signups, avoiding spam on one-off signups | Heavy / partner infra | Requires actual email-receiving infrastructure (a provider or self-hosted catch-all domain + inbound parsing). Real abuse vector (disposable emails are also used to bypass fraud/spam controls elsewhere) — needs rate limiting, no persistent identity, and clear ToS restricting use to your own testing purposes. |
| **"Accurately finds old emails and files"** | Two different tools live under this one idea — build both, separately: **(a) B2B Email Finder & Verifier** (guess a person's business email from name + company domain using common patterns, then verify deliverability via MX/catch-all checks) — a very standard, high-value sales/marketing tool; **(b) Inbox/Drive Deep Search** (OAuth into the user's own Gmail/Drive to find old buried threads/files) — a real product but a much heavier OAuth/privacy/compliance lift and further from the agency's core positioning | (a) Heavy / server, reuses DNS engine. (b) Heavy / OAuth integration, phase later | Ship (a) first — it slots directly into the existing `dns-email-health` engine (MX lookups are already built). Treat (b) as a much later, separate initiative given the OAuth scope and data-handling burden. |
| **Competitor intelligence (ad spend, ad location, suppliers)** | "Competitor Ad Intelligence" — aggregate what's *legally and publicly* queryable from official ad transparency APIs (Meta Ad Library API, Google Ads Transparency Center, TikTok Commercial Content Library, LinkedIn Ad Library) into one report per competitor domain/page | Heavy / partner API | Ad spend/location data is realistically available (with caveats — full spend ranges are mainly exposed for political/social ads, and coverage/granularity varies by platform); **supplier intelligence is not** — that requires licensed customs/shipping data (e.g., import/export manifest providers), which is a real paid-data-license relationship, not something to scrape. Ship the ad-transparency aggregation first; treat supplier lookup as a "connect a data partner" v2, not a v1 build. |
| **Business formation** | LLC/corp formation, EIN application guidance, registered agent | Heavy / partner integration | Same pattern as domain/hosting (§5): partner with an existing formation service (reseller/affiliate), don't attempt to become a registered agent or filing service yourselves — this is a regulated, state-by-state process. Pair with a free **Business Name + Trademark Availability Checker** (extends the existing Brand Creator) as the natural free on-ramp. |
| **Clipping software** | Long-form video → short social clips | Heavy / phased | v1: client-side trimmer + caption burn-in (user manually picks the clip range). v2: AI "auto-find the highlight" needs a transcript (pairs naturally with the Transcriber tool above) plus a heuristic or model to rank segments — a good example of two heavy tools compounding, which is exactly the platform's moat pattern from §11. |
| **Demo video creator** | Screen recording + simple edit + branded intro/outro + captions | Heavy / mostly client | Screen + webcam recording is natively possible client-side via `MediaRecorder`/`getDisplayMedia` — a real, zero-server-cost v1 (record → trim → add a branded watermark/outro → export). Auto-captions are v2 and depend on the Transcriber tool above. |

### 12.3 Additional brainstormed tools, by audience

**For marketers** (extends clusters 1–5):
- Email subject-line spam-word / deliverability checker
- Social post previewer (renders how a post/link will actually look on each platform before publishing)
- Open Graph / social preview card generator (distinct from Schema — this is the "how does my link look when pasted in Slack/iMessage/Twitter" problem)
- Hashtag research & grouping tool
- UTM link builder + campaign tracker
- Customer persona / ICP generator (from a short business description)
- Testimonial/review embed-widget generator
- NPS / customer survey builder
- Link-in-bio micro-page builder (standalone, beyond the QR generator)
- Broken link checker (crawl a site, list dead links) — extends the audit engine
- Accessibility (WCAG) checker — extends the audit engine, real value, real legal relevance (ADA lawsuits over inaccessible sites are common)
- Security headers checker (CSP, HSTS, X-Frame-Options) — extends the audit engine
- SSL/TLS certificate expiry checker — extends the audit engine
- Ad copy compliance scanner (flags Facebook/Google-banned phrasing before you get an ad rejected)
- Content repurposing tool (long-form → thread/social post variants)
- Press release generator + a distribution checklist
- Media kit generator (for creators/influencers pitching brands)
- Uptime / competitor page-change monitor ("alert me when a competitor changes their pricing page")

**For entrepreneurs:**
- Business name + trademark availability checker (pairs with Business Formation above)
- Business plan / one-pager generator
- Financial projection & startup-runway calculator
- Break-even & unit-economics calculator
- Freelance/agency rate calculator (expenses + margin goal → hourly rate)
- Invoice & estimate generator with branded templates
- Simple contract / NDA / SOW template generator (with a prominent "not legal advice" disclaimer, same pattern as the Copywriter/AUP disclaimers already in place)
- Elevator pitch generator
- Pitch deck outline generator
- Digital business card generator (pairs naturally with the QR Code Generator)
- Loan/grant program matcher (quiz-style, matches business profile to public program categories)

**For developers** (proposed new cluster, §12.1):
- Regex builder + tester with plain-English explanation
- JSON/YAML/CSV/XML formatter, converter, and diff tool
- JWT decoder/debugger
- Cron expression builder + explainer
- Webhook tester/inspector (capture and display inbound webhook payloads — needs a small always-on receiving backend)
- Fake/test data generator (Faker-style structured mock data)
- README generator (project description → structured README.md)
- Changelog generator (from conventional-commit-style git log input)
- OSS license chooser
- Database schema visualizer (paste SQL → ER diagram)
- cURL ↔ code generator (convert a cURL command to fetch/axios/Python requests/etc.)
- Code snippet → shareable image generator (Carbon/Ray.so-style — cheap to build, has real viral/sharing potential on its own)
- Favicon + PWA manifest generator (pairs with the Brand Identity Kit)
- API docs generator (paste an OpenAPI/Swagger spec → a clean, hosted docs page)

**Cross-cutting / shared-infrastructure ideas** (each reuses an engine already built or planned):
- Background remover and Transcriber (above) both become inputs other tools can build on — background removal feeds the Ad Creative Resizer and Brand Identity Kit; transcription feeds the Clipping tool, the Demo Video Creator, and a future closed-captioning tool.
- The Broken Link Checker, Accessibility Checker, Security Headers Checker, and SSL Checker are all thin additional scoring lenses on the *same* `site-audit.ts` engine used by the Website Audit Report / Landing Page Grader / Competitor Gap Report — each one is a small, high-leverage addition, not a new subsystem.

### 12.4 Build phases

Grouped into explicit phases by (build cost) × (how directly it reuses existing engines) × (external dependency risk). Each phase is meant to ship as a unit before starting the next.

**Phase 1 — Zero external dependencies, reuses engines already built (this phase is implemented in this repo):**
- Broken Link Checker — new lightweight crawler that reuses the same fetch pattern as `site-audit.ts`
- Accessibility (WCAG-lite) Checker — new heuristic scorer, same fetch pattern
- Security Headers Checker — inspects response headers from the same kind of fetch
- SSL/TLS Certificate Checker — new engine using Node's `tls` module (no third-party API)
- B2B Email Finder & Verifier — pattern-guessing + MX lookup, directly reuses the DNS engine built for the Email Deliverability Health Check
- Background Remover — client-side ML segmentation, zero server cost, no API key
- Demo Video Creator (v1: screen/webcam record + canvas-composited brand watermark, download as video file; no trimming or auto-captions yet) — client-side, zero server cost

**Phase 2 — Needs a real external API or heavier logic, but no paid data license or partner contract:**
- Competitor Ad Intelligence (ad-transparency aggregation via Meta Ad Library API, Google Ads Transparency Center, TikTok Commercial Content Library, LinkedIn Ad Library)
- App/SaaS QA Test Plan Generator v2 (flow-based test generation from a plain-English description, needs an LLM call)
- Business Name + Trademark Availability Checker (needs USPTO TESS/TSDR integration)
- Transcriber (needs a real ASR API and a usage/cost gate — sequence after accounts exist)
- Reverse Image Lookup (smart-redirect + perceptual-hash dedup — the dedup half needs the Vault/accounts feature to exist first)
- Clipping Software v2 (AI highlight detection — depends on the Transcriber shipping first)
- The full Developer Tools cluster (§12.1) — each tool is individually cheap, but stood up as a batch once there's bandwidth for a new cluster's worth of IA/nav/SEO work

**Phase 3 — Needs a paid data license, partner contract, or extra compliance review:**
- Phone Number Lookup (carrier API + strict use-case scoping)
- Burner Email (real email-receiving infrastructure + abuse controls)
- Business Formation (registrar-style reseller/affiliate partnership)
- Supplier/import-export intelligence (licensed customs/shipping data)
- Inbox/Drive Deep Search (OAuth into a user's own Gmail/Drive — heavy privacy/compliance lift)

**Phase 4 — Lower-priority template/form tools (cheap to build, lower differentiation, good for long-tail SEO volume once the heavier tools are shipped):**
- The remaining marketer ideas from §12.3 (subject-line checker, social previewer, OG card generator, hashtag tool, UTM builder, persona generator, testimonial widget, NPS builder, link-in-bio builder, press release generator, media kit generator, competitor page-change monitor, ad copy compliance scanner, content repurposing tool)
- The remaining entrepreneur ideas from §12.3 (business plan generator, financial projections, break-even calculator, freelance rate calculator, invoice generator, contract/NDA generator, elevator pitch generator, pitch deck outline generator, digital business card generator, loan/grant matcher)

---

## 13. Monetizing the tools directly — paywall, credits & cost recovery

Everything through §12 treats the tools as a pure funnel: free forever, monetized entirely through the agency plan (now a $1,200 one-time "unlimited" offer behind a free audit lead-in — see `siteConfig` in `web/src/lib/site-config.ts`). That's still the primary business. But the AI tools now have a real, growing, per-request cost — every chat-tool run, image generation and transcription is already metered to the dollar in `web/src/lib/ai/usage.ts` (`recordUsage`, `MODEL_PRICES`, `fetchGatewayCredits`) and capped globally by `checkDailySpend` (`DAILY_SPEND_CAP_USD`, default $25/day). At meaningful traffic, that global cap either (a) throttles real users once bots or a few heavy sessions burn it, or (b) has to be raised, at which point it's real, uncapped spend with no revenue attached. A tools paywall closes that loop: it turns the priciest tools into a second, self-funding revenue line without touching the agency funnel's core promise — **the diagnostic tools that sell the agency stay free; the tools people use as a recurring utility get a fair-use free tier and a paid tier above it.**

### 13.1 Segmentation principle — don't paywall the funnel

The tools fall into two very different jobs, and the paywall must respect the boundary or it cannibalizes the bigger business:

- **Lead-gen diagnostics** (Website Audit Report, Landing Page Grader, Competitor Gap Report, DNS & Email Health Check, Security Headers/SSL/Accessibility checkers, Compliance Scanner, LLM Readability Check, Broken Link Checker, Canonical Detector, Backlink Health, Voice Search Optimizer): these exist specifically to surface a problem and hand the visitor to the `AgencyUpsell` card (`web/src/components/tools/chat/agency-upsell.tsx`) and the $1,200 plan. **Keep these free and anonymous-usable, full stop** — paywalling the thing that sells your highest-ACV offer is self-defeating. They're also cheap: mostly `fast`-tier models and `"cheap"`/`"free"` skill cost per `ChatToolRuntime.skill.cost` in `chat-runtime.ts`.
- **Recurring production utilities** (AI Image Generator, Transcriber, Clip Finder, Email Newsletter Builder, Content Repurposer, Dataset Builder, Press Release Generator, the `writer`-tier copy tools used in bulk): these are things a freelancer/marketer comes back to *daily*, cost real money per use (image gen and ASR are the two priciest categories — `imageModelChain`/`transcriptionChain` in `models.ts` and `transcribe.ts`), and have no natural agency upsell (a signed agency client doesn't need to self-serve an image gen tool — the agency does it for them). **These are the paywall candidates.**

Concretely, using the `SkillMeta.cost` taxonomy already defined in `chat-runtime.ts` (`"free" | "cheap" | "model" | "media"`): leave `free`/`cheap` tools fully open, put a **generous free daily quota** on `model`-cost tools (same UX pattern as the existing anon/account rate limits), and require **Tools Pro or a credit balance** for `media`-cost tools (image generation, transcription, clip finding) beyond a small free trial (e.g. 2 free images, 5 free transcription minutes, once, tracked the same way `ANON_FREE_RUNS` already tracks the anon free chat run in `session.ts`).

### 13.2 Pricing structure — subscription for regulars, credits for spikes

Two SKUs, sold from the same account system already scaffolded in `src/lib/auth/session.ts` (`UserRecord`) — no new auth system needed:

| SKU | Price (starting point) | Unlocks | Why this shape |
|---|---|---|---|
| **Tools Pro** (subscription) | $15–19/mo or $120–150/yr | Unlimited `model`-tier tools, a real (not trial) monthly allotment of `media`-tier usage (e.g. 60 images, 60 transcription minutes), 2–3× the free rate limits, unlimited saved history in the Vault (§2.2, once it ships), priority model routing (top of the `writer` chain instead of walking down to cheaper fallbacks) | Predictable MRR that funds the AI Gateway bill; priced well under the $1,200 agency plan so it reads as "the self-serve option," not a competing offer |
| **Credit packs** (one-time) | $10 → ~500–1,000 credits, priced off real cost + margin (see §13.5) | Pay-as-you-go for `media`-tier tools without a subscription — image gen, extra transcription minutes, extra clip-finder runs | Serves spiky/occasional users (someone who needs 20 product images once) who'd bounce off a monthly commitment; also the natural top-up for Pro subscribers who exceed their monthly allotment |

Cross-sell, don't compete: show Tools Pro as a line item inside `/pricing` next to (not replacing) the $1,200 agency card, and bundle it free for the lifetime of an agency client's plan (a cheap, high-perceived-value retention perk — "your $1,200 plan includes Tools Pro, forever"). The `AgencyUpsell` copy on lead-gen tools stays about the agency; a *separate*, tool-specific "You've used your 2 free images this month — upgrade to Tools Pro or buy a credit pack" prompt appears only on gated tools, so the two offers never compete for the same attention.

### 13.3 Implementation architecture — reuse what's already built

No new auth, session or storage system is needed; extend the existing ones:

1. **Entitlements on the user record.** Add `plan: "free" | "pro"`, `stripeCustomerId`, `subscriptionId`, `subscriptionStatus`, `proUntil` (epoch, for grace-period handling on failed renewals), and `credits` (integer, in whatever unit §13.5 lands on) to `UserRecord` in `session.ts`. Anonymous visitors simply have no entitlement — gated tools already require sign-in via `gateRun`, so there's no anonymous-credits case to design for.
2. **A new `entitlement.ts` module, parallel to `gateRun`.** `requireEntitlement(session, tool): EntitlementDecision` — checks the tool's new `SkillMeta.tier?: "free" | "pro"` (or a per-tool credit cost, e.g. `SkillMeta.creditCost?: number`) against the user's `plan`/`credits`, mirroring the shape of `GateDecision` in `session.ts` (`allowed`, `reason`, `setCookies`) so the calling code in `chat/route.ts` and the non-chat routes (`image-gen`'s underlying route, `media/transcribe`, `media/upload`) reads the same way `gateRun` already does. Return a clear `cause` (`"needs_pro"` vs `"needs_credits"`) so the client can show the right upsell (subscribe vs top up).
3. **Deduct atomically, using real cost.** `recordUsage` already computes `costUsd` per request from the gateway's reported cost or `MODEL_PRICES`. Add a `deductCredits(uid, costUsd)` step right where `recordUsage` is already called in `chat/route.ts`, `transcribe.ts`, and the image-gen tool — same call site, no new instrumentation. Use `store.incr` with a negative delta or a small Lua-script-backed decrement (see §14.1 on why plain `hincrby` isn't quite safe enough for money) so concurrent requests from one account can't double-spend a low balance.
4. **Grandfather and feature-flag the rollout.** Add a `PAYWALL_ENABLED_TOOLS` env var (comma-separated slugs, same override pattern already used for `AI_MODEL_WRITER`/`AI_MODEL_IMAGE` in `models.ts`) so gating can be turned on per tool without a code deploy, and so it can be dark-launched (log what *would* have been blocked, without blocking) before enforcing.

### 13.4 Payment implementation — Stripe Checkout + Billing, no PCI scope

Per Stripe's current guidance: **Checkout Sessions** for both the subscription and the one-time credit pack (Stripe-hosted page, so card data never touches Launchabl's servers — no PCI scope beyond SAQ A), **Billing** for subscription lifecycle, and a **Customer Portal** session for self-serve upgrade/downgrade/cancel (so there's no billing UI to build). Concretely:
- `POST /api/billing/checkout` — creates a Checkout Session (`mode: "subscription"` for Tools Pro, `mode: "payment"` for a credit pack), `client_reference_id` = the session's `uid` so the webhook can find the user without a pre-existing Stripe customer mapping.
- `POST /api/billing/webhook` — verifies the Stripe signature, handles `checkout.session.completed` (create/attach `stripeCustomerId`, set `plan`/`credits`), `customer.subscription.updated`/`deleted` (sync `subscriptionStatus`/`proUntil`), `invoice.payment_failed` (start the grace period, then downgrade). Webhooks are the source of truth, never the Checkout redirect — the redirect only improves perceived latency.
- `POST /api/billing/portal` — creates a Customer Portal session for an already-paying user; link it from an account settings page.
- Use a **restricted API key** (`rk_`) scoped to only the resources this app touches (Checkout, Billing, Webhooks, Customers), not the full secret key, and never set it as a build-time env var — request-time only, server-side. Store it the same way `AUTH_SECRET`/`ADMIN_TOKEN` were added in this session (Vercel env, Production/Preview/Development, `--sensitive`).
- Don't pass `payment_method_types` — let Stripe's dynamic payment methods handle it. Don't turn on `automatic_tax` until sales-tax registrations are actually in place (see §14.2) — enabling it without a registration silently collects $0 tax while looking configured.

### 13.5 Pricing credits off real, already-tracked cost

`MODEL_PRICES` and the gateway's reported `cost` in `usage.ts` already give an exact, per-model $/request number for every historical run. Before picking a credit price: pull 30 days of `byTool`/`byModel` from the admin usage dashboard (`/api/admin/usage`), take the P75 cost for each gated tool (not the average — a few long transcriptions or big images shouldn't set the price for everyone), and price a credit so the included allotment sits at **3–5× the real cost** (standard SaaS gross-margin target for a metered feature, and wide enough to absorb model-price drift without repricing every quarter). Re-derive this number periodically from the same dashboard rather than guessing once — the admin route already has everything needed to keep it honest.

### 13.6 Admin dashboard additions

Extend `/api/admin/usage` (already aggregating `usage`, `credits`, `accounts`, `reports` in `route.ts`) with a `billing` block: active Tools Pro subscribers, MRR, credit-pack revenue, and — the number that actually matters for this whole effort — **AI Gateway spend vs. tools revenue, side by side, by day**. That single chart answers "are the paywalled tools profitable yet" without any new tooling; it's a join of data the app is already collecting (`usage.ts`'s cost totals) against data Stripe's webhooks will start writing to the same KV store.

### 13.7 Phasing

1. **Instrumentation first, no gate yet:** ship `entitlement.ts` in "dark launch" mode (§13.3.4) for one release to confirm the tier/cost mapping on real traffic before anyone sees a paywall.
2. **Tools Pro subscription only** (skip credit packs initially — one Stripe product is simpler to ship and support) gating the `media`-tier tools.
3. **Credit packs** once there's demand signal from users hitting the Pro monthly allotment (that event is directly observable once §13.3.3's deduction path exists).
4. **Bundle Tools Pro into the $1,200 agency plan** as a retention perk once both sides exist.

---

## 14. Scale, compliance, security & enterprise readiness

### 14.1 Scalability

- **The global daily spend cap is a blunt instrument once there's a paid tier.** `checkDailySpend` in `usage.ts` currently caps *all* spend at one number (`DAILY_SPEND_CAP_USD`, default $25) — fine for an all-free tool, wrong once paying customers exist, because a burst of free/anon usage can lock out someone who's paying. Split it: keep a hard cap that only counts free/anon spend, and let paid usage draw against the user's own credit balance / plan allotment instead of the shared pool (§13.3.3 already deducts per-user; the global cap should filter to `gate.kind !== "user" || !session.plan` once that field exists).
- **Credit deduction is a money-correctness problem, not just a counter.** The existing `KeyValueStore.hincrby`/`incr` primitives (`store.ts`) are perfect for rate limits and usage stats, where an occasional race is invisible. They are *not* safe as-is for "does this user have enough credits left" under concurrent requests (two parallel image-gen calls could both read "sufficient balance" before either decrements). Either move credit balance to a Redis Lua script (atomic check-and-decrement in one round trip — Upstash supports this) or, once Stripe/webhooks introduce a real need for transactional writes anyway, move the *billing* records (subscriptions, credit ledger, invoices) to a proper relational store — this Vercel account already has a Neon Postgres project provisioned for another app (`fundable-saas-agents`); provisioning a small Neon branch for Launchabl's billing tables is a low-effort way to get real transactions for money-critical writes while leaving KV exactly where it is for rate limits, sessions, and ephemeral usage counters. Don't move everything to Postgres — that would throw away the "works at the edge, one round trip" property that makes the current rate limiter cheap; just don't keep credit balances in a plain counter once real money is attached to them.
- **Long-running media jobs shouldn't hold a serverless function open.** `transcribe/route.ts` and the clip-finder tool already push against the 300–800s `maxDuration` ceilings used elsewhere in this codebase (`cron/schedules/route.ts` uses `maxDuration = 800`). As paid usage grows the volume of large transcriptions, move that class of job to a queue (Vercel Queues, or Inngest/Trigger.dev) that calls back via webhook when done, rather than scaling function duration further — this also means a client can close the tab and come back, which a paying user will expect.
- **Cache identical, repeated server-side fetches.** The audit-engine tools (`site-audit.ts` and everything built on it — Website Audit, Landing Page Grader, Competitor Gap, Broken Link, Canonical, Page Speed, Backlink Health) all re-fetch the same URL from scratch on every run. A short TTL cache (a few minutes, keyed by normalized URL, in the same KV store) cuts duplicate compute for the common case of someone re-running an audit right after fixing one issue, with no product downside.
- **Vercel Blob usage will grow with paid media tools.** Large-file transcription and clip-finder uploads already require `BLOB_READ_WRITE_TOKEN` (`transcribe.ts`); add a lifecycle policy (delete after N days) so paid usage doesn't quietly grow an unbounded storage bill the way an unbounded KV key would.
- **Upstash Redis plan headroom.** Confirm the connected Upstash database (already wired via `KV_REST_API_*`/`REDIS_URL`) is on a plan with the request-rate and storage headroom the paywall's higher-frequency reads (entitlement checks on every gated request) will add, before launch, not after a spike.

### 14.2 Compliance (GDPR/CCPA, payments, tax)

- **Right to access/delete is cheap here — implement it now, before scale makes it a project.** `UserRecord` is already keyed by an email hash (`emailHash` in `session.ts`), and nothing in the current design retains raw PII outside that one record plus TTL'd transcripts/reports. Add a `deleteUser(uid)` that removes the `user:*` record, the `authcode:*` entry, and any `report:*`/`transcript:*` the user owns, and wire it to a self-serve "delete my account" action plus an admin-triggered path for GDPR/CCPA requests that come in by email. Do this before the paywall ships — once Stripe customer records and invoices exist, deletion also has to reconcile with Stripe's own retention (Stripe keeps financial records regardless of a deletion request, for its own regulatory reasons — the privacy policy needs to say so).
- **Subprocessor list.** The privacy policy should name every third party data actually flows through: Vercel (hosting/KV/Blob), Upstash (Redis), Resend (transactional email), the model providers reachable via Vercel AI Gateway (Anthropic/OpenAI/Google/Meta/etc.), and, once shipped, Stripe. This is a documentation task, but it's blocked on knowing the real list, which is now stable enough to write down.
- **Stripe Tax before `automatic_tax`.** Don't enable tax calculation until there's at least a home-state/home-country registration in place (see §13.4) — Stripe will happily calculate and silently collect $0 tax on every transaction otherwise, which reads as "handled" while being wrong.
- **Cookie/consent banner.** `components/analytics` (used by `agency-upsell.tsx`'s `track()` calls) should be audited for whether it sets anything beyond strictly-necessary cookies; if it does, a consent banner becomes a real requirement once EU traffic is meaningful, not just best practice.

### 14.3 Security / no data leaks

- **Rotate the shared admin/cron secrets on a schedule.** `ADMIN_TOKEN` and `CRON_SECRET` are single shared bearer tokens (`admin/auth.ts`) — fine for one operator, but rotate them periodically and treat "who has the token" as the access-control list until there's more than one admin.
- **Move off a single shared admin token once there's more than one operator.** The moment a second person needs admin access (support, a co-founder, an ops hire), a single bearer token can't express "who did what" — that's also a prerequisite for any audit-log requirement in §14.4.
- **Audit logging output for accidental sensitive data.** Several routes already `console.warn`/`console.error` on failure (`chat/route.ts`, `session.ts`'s Resend fix from this session, `usage.ts`). Spot-check that none of these ever include full user message text, email addresses in the clear next to error bodies, or Stripe webhook payloads verbatim (Stripe payloads can include customer email/name) — log ids and status codes, not bodies, as a standing rule.
- **Ship the site's own Security Headers Checker findings on itself.** There's a live tool (`security-headers-checker`) that audits exactly this — running Launchabl's own domain through it and fixing whatever it flags (CSP, HSTS, X-Frame-Options, etc.) is a free, dogfooded security pass with no new build required.
- **Webhook signature verification is non-negotiable, and idempotent.** The Stripe webhook route (§13.4) must verify the signature on every request and de-dupe by Stripe's event id (store recently-seen event ids in KV with a short TTL) so retried webhook deliveries can't double-credit an account.
- **Encryption at rest.** Confirm Upstash's at-rest encryption covers the database tier in use; if any future field needs to store something more sensitive than what's there today (e.g. a customer-supplied API key for the BYO-key enterprise option in §14.4), encrypt that specific field at the application layer rather than relying on storage-level encryption alone.

### 14.4 Enterprise readiness

- **SSO.** The current session model (`session.ts`) is a single HMAC-signed cookie per email — simple and correct for self-serve, but enterprise buyers will ask for SAML/OIDC SSO before signing. A provider like WorkOS AuthKit slots in without replacing the existing cookie/session shape: it becomes another way to arrive at a valid `Session`, not a rewrite.
- **Teams/orgs.** There is currently no multi-user concept — one email is one account. An enterprise deal will need a `team:*` namespace (shared Vault/projects, seats, an admin role within the team) layered on top of the existing `UserRecord`, not a replacement for it.
- **BYO model key.** For an enterprise customer with their own model-provider agreement or compliance requirement to not send data through a shared gateway, let them supply their own API key (stored encrypted, per §14.3) and route their requests directly rather than through the shared AI Gateway credit pool — this also isolates their spend from the shared `checkDailySpend` cap entirely.
- **Audit log.** Once there's more than one admin (§14.3) and more than one seat per account (teams, above), log admin actions and sensitive tool runs (who ran what, when) — this is table stakes for any enterprise security questionnaire, and cheap to add incrementally to the existing usage-event pipeline rather than as a separate system.
- **SOC 2.** This is a program, not a PR — realistically months of control implementation (access reviews, change management, incident response, vendor management) before an audit, typically run through a compliance platform (Vanta/Drata) that also generates the security questionnaire answers enterprise procurement will ask for. Worth starting the moment there's a real enterprise pipeline, not before — it's expensive to run "just in case."
- **Status/SLA.** A public status page (even a simple one) and a stated uptime target become a real ask once a customer's business depends on the tools being up — cheap to stand up (many hosted status-page services), disproportionately reassuring to a procurement reviewer.

### 14.5 Profitability model

With `usage.ts` already tracking exact cost per tool/model/day, profitability isn't a guess — it's a query away, and should stay that way as the source of truth for every pricing decision above:

- **Gross margin target:** price Tools Pro's included allotment and credit packs (§13.5) so the AI Gateway cost they cover sits at 20–30% of the price charged (i.e. 3–5× markup), consistent with typical metered-SaaS-feature margins, and re-check this quarterly against real `MODEL_PRICES`/gateway-reported cost drift rather than setting it once.
- **The real profitability lever isn't the price — it's the model chain.** `modelChain`/`imageModelChain`/`transcriptionChain` already walk a best→cheapest fallback list. Watch the admin dashboard's `byModel` breakdown for gated tools specifically: if paid users are consistently landing on the expensive end of the chain (rate limits/availability pushing past the top model), that's a margin problem hiding in plain sight, fixable by tuning the chain order or adding a mid-tier model, not by raising prices.
- **The agency plan's price drop to $1,200 (§7) raises the tools paywall's relative importance.** A lower-ACV, higher-volume agency offer means the tools paywall isn't just "cost recovery," it's a real second revenue line worth building deliberately rather than as an afterthought — size the engineering investment in §13 accordingly.

---

## 15. Implementation status — Tools Pro v1 (subscription only)

Phase 1 and 2 of §13.7 are shipped: entitlement checking exists everywhere it needs to, and it's dark-launched by default.

- **`UserRecord` extended** (`lib/auth/session.ts`): `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionStatus`, `planInterval`, `proCurrentPeriodEnd`. `hasProAccess()` reduces all of that to a boolean (`active`/`trialing`). No `credits` field yet — that's Phase 3, deferred until real demand shows up in the trial/shadow-block metrics below.
- **`lib/ai/entitlement.ts`** — `checkEntitlement(slug, session, store)`, parallel to `gateRun`. Tools tagged `tier: "pro"` in `chat-runtime.ts` (`ai-image-generator`, `transcriber`, `clip-finder`) require sign-in, then give `PRO_TRIAL_RUNS` (2) free tries per tool per account, then either dark-launch (allowed through, `wouldBlock: true`, a shadow metric recorded) or actually block, depending on the `PAYWALL_ENFORCED_TOOLS` env var — unset by default, so **nothing is blocked yet**. Set it to a comma-separated slug list, or `"*"` for every pro tool, to start enforcing.
- **Enforced in `/api/tools/chat`** (by the request's `tool` slug) **and in `/api/media/transcribe`** (unconditionally for signed-in accounts, via `checkEntitlement(..., { forcePro: true })`, under the pseudo-slug `media-transcribe`) — the real Whisper cost happens in the transcribe route before any chat tool sees the result, so gating only the chat slug would have missed it.
- **Known gap, harmless while dark-launched:** the unified `agent` tool and `social-card-generator` both merge in the standalone `generateImage` function tool from the image-generator runtime (`chat-runtime.ts`'s `mergeTools`). A request tagged `agent` or `social-card-generator` can reach image generation without `checkEntitlement` ever seeing slug `ai-image-generator`. Before adding `ai-image-generator` to `PAYWALL_ENFORCED_TOOLS`, filter `generateImage` out of those two runtimes' merged tool set for non-Pro accounts (see the comment on `checkEntitlement` in `entitlement.ts`).
- **Stripe integration**: `lib/billing/stripe.ts` (server client + price/webhook-secret lookup), `lib/billing/plan-display.ts` (client-safe price constants), `lib/billing/webhook-handler.ts` (pure event → store-update mapping, unit tested without needing signed payloads). Routes: `POST /api/billing/checkout` (subscription mode, creates a Stripe customer on first use), `POST /api/billing/portal` (Stripe-hosted self-serve upgrade/downgrade/cancel), `POST /api/billing/webhook` (`checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, KV-based idempotency by event id — see the docstring on `alreadyProcessed` for why it's not a strict compare-and-set).
- **UI**: `ProUpgradeCard` (shown in a tool chat on a `needs_pro` error, same pattern as the existing sign-in card) and a Tools Pro card on `/pricing` (`ToolsProPricing`), both hitting `/api/billing/checkout` directly.
- **Admin dashboard**: `/api/admin/usage` now returns `billing` (active subscribers, MRR from `TOOLS_PRO_PRICE_USD × count`, split by interval) and `paywall` (trial starts, shadow-blocks, actual blocks, per tool) — the numbers to watch before flipping `PAYWALL_ENFORCED_TOOLS` on for real.
- **Not done yet** (Phase 3, per §13.7): credit packs, the atomic credit-decrement primitive (§14.1), splitting the global daily spend cap into free-vs-paid pools, the Neon/Postgres billing ledger. None of these block subscription-only Tools Pro.
- **Deployment**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY` are set in Vercel (Production/Preview/Development) against a Stripe sandbox (product "Launchabl Tools Pro", monthly $17 / yearly $130 prices), with a webhook endpoint registered at `/api/billing/webhook` for `checkout.session.completed`, `customer.subscription.{created,updated,deleted}`, `invoice.payment_failed`. `PAYWALL_ENFORCED_TOOLS` stays unset until we're ready to enforce. Until `STRIPE_SECRET_KEY` is set on a given deployment, the billing routes 503 and `checkEntitlement` still works in dark-launch mode (trials and shadow metrics keep accumulating even with billing unconfigured).
- **Verified end-to-end locally against the real Stripe test API** (`stripe listen` forwarding to a local dev server): sign-in → `POST /api/billing/checkout` (creates a real Stripe customer + Checkout Session, persists `stripeCustomerId`) → simulated subscription creation + invoice payment (test card `pm_card_visa`) → the resulting `customer.subscription.created`/`updated` webhook events were verified end-to-end, correctly matching the account by customer id and flipping `subscriptionStatus` to `active` → `POST /api/billing/portal` then returns a real Billing Portal URL → `GET /api/admin/usage` reflects the new subscriber in `billing.activeSubscribers`/`billing.byInterval` with a correctly computed `mrrUsd` (e.g. a single yearly subscriber at $130/yr showed as $10.83 MRR). Not yet done: an actual browser-driven Checkout payment against the production deployment (blocked on merging this PR — production doesn't have the billing routes until then).
