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

---

## 16. Implementation status — Credit packs (Phase 3)

Phase 3 of §13.7 is shipped: the atomic credit-decrement primitive that §14.1/§15 flagged as the blocker is built, and a one-time-payment alternative to the Tools Pro subscription now exists for accounts that hit the trial wall but run pro tools too rarely to want a recurring plan.

- **The atomic store primitives** (`lib/ai/store.ts`): `incrBy`, `decrIfAtLeast` (the primitive §14.1/§15 were waiting on — a single atomic Redis `EVAL` script server-side, not a pipelined GET+DECRBY, so two concurrent spends can't both draw down the same last credit), `getCounter`, and `setNx` (atomic "set if absent", added for the credit-grant idempotency guard below). All four are implemented for both the memory store and the Upstash/Redis REST store, with concurrency-burst tests (`store.test.ts`) proving a balance never goes negative and only one of several racing `setNx` callers wins.
- **`lib/billing/credits.ts`** — the ledger itself: `getCreditBalance`, `grantCredits`, `grantCreditPack` (credits a pack and records the purchase for the admin dashboard), `spendCredit` (atomic, returns the new balance or `null`). One integer counter per uid (`credits:{uid}`) in the shared store — no separate ledger table.
- **`lib/billing/plan-display.ts`** — the catalog: two packs, `starter` (20 credits / $9) and `growth` (100 credits / $35), client-safe so the pricing page and in-chat upsell can import it without pulling in the server-only Stripe SDK.
- **`lib/ai/entitlement.ts`** — `checkEntitlement` now has a third rung: sign-in → `PRO_TRIAL_RUNS` free tries → dark-launch shadow-block (unchanged) → **once `PAYWALL_ENFORCED_TOOLS` actually enforces the tool**, spend one purchased credit as a fallback (`{ allowed: true, wouldBlock: false, spentCredit: true, creditsLeft }`) → only falls through to `needs_pro` once the balance is 0. Credits are never spent during dark-launch — only once enforcement would otherwise have blocked the request. `/api/tools/chat` and `/api/media/transcribe` surface `creditsLeft` back to the client (a response header on the streamed chat route, a JSON field on transcribe) when a credit was spent.
- **Stripe integration**: `POST /api/billing/credits/checkout` (payment mode, one line item, `metadata: { uid, pack, credits }` — reuses the same lazily-created Stripe customer as the subscription checkout route). `lib/billing/webhook-handler.ts`'s `checkout.session.completed` case now branches on `session.mode`: `"payment"` + a recognised `pack` in metadata grants the pack via `grantCreditPack`, guarded by an atomic `store.setNx` keyed by the checkout session id (not the event id) — granting credits is a one-shot debit-the-purse action, not an idempotent upsert like the subscription fields, so it needed a stronger idempotency guard than the route-level "already processed this event id" check alone provides (see the updated module docstring). No new webhook endpoint or subscribed-event change was needed — `checkout.session.completed` was already registered for the Tools Pro subscription flow.
- **UI**: `CreditPacksCard`/`CreditPacksSection` on `/pricing` (below the Tools Pro card), and a compact "or use it occasionally" row with both packs added directly to `ProUpgradeCard` (the same card shown in a tool chat on a `needs_pro` error) so the alternative is visible right where someone hits the wall. `GET /api/auth/me` and `useSession()` now also return the signed-in account's credit balance (`credits`), for any UI that wants to show it.
- **Admin dashboard**: `/api/admin/usage` now returns `creditPacks` (packs sold, credits purchased, credits spent, revenue, a breakdown by pack) via `readCreditStats` in `lib/ai/usage.ts`, rendered as a new panel next to the existing Tools Pro billing panel.
- **Deployment**: two new one-time Stripe prices created in the same sandbox as Tools Pro — "Launchabl Credit Pack — Starter" ($9, `STRIPE_PRICE_CREDITS_STARTER`) and "— Growth" ($35, `STRIPE_PRICE_CREDITS_GROWTH`) — and set in Vercel across Production/Preview/Development. Until those env vars are set on a given deployment, `POST /api/billing/credits/checkout` 503s (same "billing not configured" pattern as the subscription routes), so this ships safely ahead of the env vars landing everywhere.
- **Verified end-to-end locally against the real Stripe test API**: sign-in → `POST /api/billing/credits/checkout` (creates/reuses a real Stripe customer + a real one-time Checkout Session with pack metadata) → a real completed-checkout webhook event for that exact session (customer, metadata and all — constructed via `stripe trigger checkout.session.completed --override ...` against the real customer id and metadata, since a payment-mode Checkout Session's PaymentIntent is created lazily by the hosted page and can't be confirmed by API before that; an actual browser run of the hosted Checkout page got stuck mid-payment in the sandboxed browser environment used for this verification, so the webhook-level path was verified directly against the real API instead) → the webhook granted exactly the pack's credits, `GET /api/auth/me` reflected the new balance (20, then 100 for a second pack on a second account), and `GET /api/admin/usage` showed `creditPacks.packsSold: 1`, `creditsPurchased: 100`, `revenueUsd: 35` for the second purchase, plus the existing `paywall` trial/shadow-block metrics from three real (dark-launch, unenforced) chat calls to `ai-image-generator` in between. The live "spend a credit once actually enforced" path is covered by `entitlement.test.ts` against the same store primitives rather than a second live run, since testing it live would have required restarting the dev server (which wipes the in-memory store) after burning through the trial and re-purchasing credits; the unit tests exercise the exact same code path deterministically.
- **Not done yet**: splitting the daily spend cap into free-vs-paid pools (§14.1), the Neon/Postgres billing ledger, refund handling (a refunded credit-pack charge doesn't currently claw back the granted credits), and an actual browser-driven Checkout payment against the production deployment for this flow specifically (same gap noted in §15 for the subscription flow, plus the sandboxed-browser hang noted above).

---

## 17. Production audit after PR #20–#22 — findings and fixes

With Tools Pro (subscriptions), the auth hotfix, and credit packs all merged and deployed, this pass re-examined the live production deployment (not just local/sandbox testing) end-to-end, since the local `stripe listen --forward-to` verification used earlier forwards a broader set of events than whatever is actually registered on the production webhook endpoint — meaning a gap there wouldn't have shown up in the local E2E runs.

- **Confirmed live and working**: after the merges, production redeployed cleanly (`vercel ls`), the auth hotfix resolved the original "no payments or auth" report (verified via `curl` against `/api/auth/sign-in` and `/api/auth/me` with a fresh email — 200 + session cookie + correct `credits: 0`), and the marketing site UI is correct (header sign-in link on desktop and mobile, `/pricing` showing both the Tools Pro card and the new credit-pack section, `/sign-in` rendering cleanly) — verified visually via a `computerUse` pass.
- **Found and fixed a real production bug**: the live Stripe webhook endpoint (registered back in the very first Tools Pro session) was subscribed to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and `invoice.payment_failed` — **missing `customer.subscription.created`**. Because `checkout.session.completed` for a subscription-mode session deliberately only persists `stripeCustomerId` (the comment in `webhook-handler.ts` notes "the subscription's own created/updated event carries status and period end"), and Stripe fires `customer.subscription.created` — not `customer.subscription.updated` — at the moment a subscription is first created via Checkout, **no event that actually set `subscriptionStatus` was ever delivered to the app for a brand-new subscriber**. A first-time Tools Pro subscriber would have paid successfully and never flipped to Pro access. This was invisible in every prior local E2E run because `stripe listen --forward-to` forwards all event types to the local dev server regardless of what's registered on the real endpoint.
  - **Fixed** by updating the live endpoint's subscribed events to include `customer.subscription.created` (`stripe webhook_endpoints update <id> --enabled-events ...`).
  - **Confirmed no real users were affected**: the only three existing subscriptions in the sandbox at the time all belonged to test accounts (`pro-test@...`, `pro-test2@...`, `pro-final@...`) created during earlier E2E verification, not real customers.
  - **Verified the fix end-to-end against production** (not local dev, and not `stripe listen`): signed in with a fresh account, started a real Tools Pro checkout to mint a genuine Stripe customer with the app's `metadata.uid`, then created a real subscription directly via the Stripe API against that customer (bypassing the hosted Checkout page, which hangs indefinitely in this environment's sandboxed browser during payment confirmation — a separate, unresolved environment limitation, not an app bug). The resulting `customer.subscription.created` event was delivered to the now-fixed production endpoint; confirmed processing succeeded by observing that `POST /api/billing/portal` (which requires `user.stripeCustomerId` to be set, and only the webhook path could have set it here since the hosted checkout route was never called) succeeded and returned a real Billing Portal URL — proof the webhook handler matched the account by `metadata.uid` and wrote billing fields.
- **New known gap found and fixed by this audit**: there was no API route or `useSession()` field that surfaced `subscriptionStatus`/`hasProAccess` to the client at all — `GET /api/auth/me` returned `credits` but not Pro status, and no other route exposed it either. This didn't block verifying the webhook fix (the portal-route side effect was enough signal), but it meant the frontend had no way to tell a paying subscriber "you're Pro" anywhere in the product.
  - **Fixed**: `GET /api/auth/me` now also returns `isPro` (`hasProAccess(getUser(uid))`); `useSession()`'s `SessionState` carries `isPro: boolean | null`; a small "Pro" badge now renders next to the account name in both the marketing-site header (`HeaderAccountLink`) and the in-tool chat header (`AccountChip` in `tool-chat.tsx`) whenever `session.isPro` is true.
- **The `generateImage`-merged-tool bypass flagged in §15 is now closed.** It turned out slightly broader than originally described: not just the unified `agent` tool merging in the standalone `generateImage` function tool, but also `social-card-generator`'s own `designSocialCard` tool, which calls the underlying image model directly whenever `background.kind === "generated"` — a second path to real image generation that never went through slug `ai-image-generator` either.
  - **Fixed** with `guardMergedImageGeneration` (`lib/ai/entitlement.ts`), called once per `/api/tools/chat` request: for any runtime whose resolved tools include the exact shared `generateImage` and/or `designSocialCard` tool instances (matched by reference, so it can't accidentally wrap an unrelated same-named tool) and whose own slug isn't already `ai-image-generator`, it wraps those tools so that the *first* time (if ever) the model actually tries to generate an image in that request, a `checkEntitlement("ai-image-generator", …, { forcePro: true })` runs and the decision is memoised for the rest of the request — matching the once-per-request semantics a direct `ai-image-generator` request already gets, so a conversation that never touches image generation never spends a trial run or records a shadow-block for it. `designSocialCard` is only guarded when the input actually asks for a generated background; the free gradient/mesh path is untouched. Unit tested (`entitlement.test.ts`) including that the real underlying tool is never invoked when the guard blocks.
  - This also means agent/social-card image generation now correctly counts toward the `ai-image-generator` trial and paywall shadow-block metrics on the admin dashboard, which it didn't before — worth knowing when reading those numbers going forward, since they'll tick up faster than they did pre-fix.

---

## 18. Defensible moat — where it's real today, and what to build next

### 18.1 The uncomfortable truth to start from

51 tools (`site-config.ts`) mostly work by sending a well-crafted prompt to a frontier model through the AI Gateway. That surface is copyable by any well-funded team in a quarter — the framework, the prompts, even this codebase's structure aren't the moat, and pitching them as one won't survive investor diligence. The real moat questions are: what compounds with usage that a fast-follower starting today can't have on day one, and what's slow enough to build that being early is itself worth something. Everything below is ranked by how fast it compounds, not by how impressive it sounds.

### 18.2 Moat vectors, ranked by how quickly they compound

1. **The connective-tissue / Brand Vault flywheel — already the stated core thesis (§2.2, §10).** Projects, chat history and a durable brand kit (colors, logo, voice, ICP) already exist and already hydrate every tool's system prompt via `projectContext`. The more tools one account uses, the higher the switching cost, because a competitor starting fresh has zero context on that brand. This is the single biggest lever already in the product — the highest-leverage next step isn't a new tool, it's **instrumenting and reporting "distinct tools used per account" and "% of runs that reused saved project context"** as the core retention/moat metric, the same way Slack tracked "2,000 messages sent" as its activation proxy. Right now nothing on the admin dashboard measures this directly.
2. **An outcome-data flywheel that doesn't exist yet but is nearly free to start.** Today every audit/report tool produces a score, but nothing closes the loop on whether the finding got fixed. Re-running the same audit on the same domain later (which already happens organically) is a before/after data point sitting unused. Log `(domain, first score, first-seen date, latest score, latest-seen date)` per audit-family tool and you get, for free, an aggregate dataset no tool-aggregator competitor has: real evidence of impact ("accounts using the Website Audit Report fixed 70%+ of critical issues within two weeks"). That's simultaneously marketing collateral, a case-study generator, and product feedback (which recommendations actually move scores, vs. which are ignored) — the deepest kind of moat, because it can only be built by having real usage over time, not by copying a UI.
3. **The public-artifact network effect.** `/r/[id]` shareable reports and public case studies already exist (§8). Every publicly shared report is a crawlable, branded landing page. This compounds only if sharing is easy and the artifact is inherently link-worthy — an audit score or a before/after report is far more shareable than a converted PNG. Concretely: a subtle, opt-in "Audited with Launchabl — score 82/100" badge with a link back, shown only on the free/lead-gen tier's shareable reports (never on paying agency-client deliverables, which should stay unbranded) turns every free user's report into a small SEO/backlink asset — more usage → more public surface area → more inbound search traffic → more usage.
4. **The unified agent's orchestration depth (`agent.ts`).** A competitor can copy one tool's prompt in an afternoon. They can't as easily copy the multi-skill chaining, the forced-review quality gate (`reviewDeliverables`), or the accumulated per-skill playbooks (`loadSkillGuide`) tuned against real traffic over time. This is real, defensible IP even though it's "just prompts" — it's *proprietary, traffic-tested* prompt/orchestration engineering, which is genuinely slow and annoying to reverse-engineer from outputs alone. Keep investing here specifically (workflow patterns, review rubrics, skill catalog) rather than only in net-new standalone tools.
5. **Vertical-specific depth as a knowledge moat (not yet built).** The tools today are horizontal (any business, any industry). A genuinely deep vertical package — e.g. a "local service business" playbook that knows GBP optimization, review generation cadence and local-pack ranking factors cold, vs. a "SaaS founder" playbook that knows PLG funnels and developer-marketing channels — encodes real domain expertise that's expensive to replicate through trial and error, converts better within that vertical, and is structurally hard for a horizontal "AI tools for everyone" competitor to match without diluting their own positioning.
6. **Compliance-as-moat for the enterprise/agency-reseller tier.** Being SOC2-ready, GDPR-clean and SSO-capable earlier than scrappy competitors locks in procurement processes a two-person clone can't clear for months — see §20. This buys real time, precisely because it's slow to build, which is what makes it a moat rather than a checkbox.
7. **Distribution/embed partnerships (not yet built).** Becoming the AI layer inside someone else's workflow — a Zapier action, a WordPress plugin for the audit tool, a Chrome extension — turns Launchabl into infrastructure other businesses depend on, a materially higher switching cost than "a website people can choose not to revisit."
8. **The cost/margin moat already partially built.** The model fallback chains (`modelChain`/`imageModelChain`/`transcriptionChain`) mean unit economics can structurally beat a naive single-model wrapper. This is worth naming explicitly to investors: "what's your gross margin on AI spend and why is it defensible" is now a standard diligence question for AI-wrapper companies, and having a real, cost-aware routing system (not just "we call GPT-4") is a concrete, demonstrable answer.

### 18.3 What not to lean on as a moat

The model itself (frontier-model parity means anyone can match raw output quality), UI polish alone (copyable in weeks), and tool *count* as a headline ("51 tools" is a breadth flex that reads as a commodity-aggregator trap to a sophisticated investor — depth per tool plus the connective tissue above is the real story, and should be the one told).

---

## 19. Scalability roadmap — from "it works" to "it doesn't fall over at 10–100x"

§14.1 already covers the mechanics; this is the sequencing. What actually breaks first, in rough order:

1. **Long-running media jobs vs. serverless duration ceilings.** `transcribe/route.ts` and clip-finder already lean on 300–800s `maxDuration`. This is the first real wall at scale — the fix (a queue like Vercel Queues/Inngest/Trigger.dev that calls back via webhook) is already correctly identified in §14.1 but not yet built; it should be the first infra investment once media-tool volume grows, ahead of anything else in this list.
2. **KV round-trips per gated request.** Every entitlement check (now including the merged-image-generation guard added in §17) costs at least one store round trip; the guard's memoisation keeps this to one check per request regardless of how many tool calls happen inside it, but Upstash request-rate plan headroom (already flagged in §14.1) is worth re-checking whenever the paywall's enforcement scope grows.
3. **Single-user account model blocks the B2B motion, not just SMB scale.** There's currently no org/team concept — one email is one account (§14.4 already flags this for enterprise SSO purposes, but it's actually broader: any agency or team wanting multiple people to share one Vault/project today either shares a login, which is a security and audit-log problem, or gets isolated silos with no shared context, which defeats the connective-tissue moat in §18.2.1 for exactly the accounts most likely to pay the most). This is a growth blocker, not just a compliance checkbox — worth pulling forward ahead of SSO itself, since teams/orgs is a prerequisite for SSO to even matter.
4. **Billing/credit correctness at higher concurrency.** The atomic `decrIfAtLeast`/`setNx` primitives (§16) already solve the immediate race-condition risk; moving the billing *ledger* itself — subscriptions, credit grants, invoices — to a real relational store (a Neon Postgres branch, per §14.1) is now **done** (§20 Phase 1: `lib/billing/ledger.ts`), dual-written alongside the existing KV entitlement path rather than replacing it. Don't move rate limits, sessions or ephemeral usage counters — KV is correct for those at any scale.
5. **Usage analytics outgrowing KV counters.** Today's `hincrby`-based daily rollups are fine at hundreds-to-low-thousands of accounts (bounded by date range, not event count). At real scale, both the outcome-data flywheel (§18.2.2) and serious product analytics will want a proper event pipeline/warehouse (ClickHouse/BigQuery-class) — not urgent now, but the schema/event-naming decisions are worth making early so a later migration doesn't mean re-instrumenting everything.

**Recommended sequencing:** job queue for media tasks → team/org data model → Postgres billing ledger + admin audit log (bundle these two, since both come up again in §20) → event pipeline, once outcome-tracking or analytics scale genuinely demands it.

---

## 20. Enterprise compliance roadmap

§14.2–§14.4 already lay out the individual pieces; here's the phased sequence and, specifically, what's needed *before a funding demo* vs. later.

**Phase 0 — cheap, do now, closes the "have you thought about this" gap in any serious conversation:** ✅ **Shipped.**
- Write down the subprocessor list (Vercel, Upstash, Resend, Stripe, the model providers reachable via the AI Gateway) as an actual page, not just a mental list — §14.2 already specifies the contents, it just hasn't been published. → Live at `/legal/subprocessors`.
- A one-page security/data-handling doc: encryption at rest/in transit, subprocessors, and — the question every enterprise AI buyer asks first now — an explicit, confirmed statement about whether prompts/outputs sent through the shared AI Gateway are used for model-provider training (confirm zero-retention/no-training terms are actually in place with the underlying providers, don't assume). → Live at `/security`. The "confirm, don't assume" step is honestly flagged there as still open: per-provider written no-training confirmations haven't been independently re-verified and filed yet — that's the concrete next step, not an assumption we're asking anyone to take on faith.
- A DPA template ready to send. A real number of enterprise deals stall for weeks waiting on a DPA that doesn't exist yet — having one drafted costs nothing and removes a real, common blocker. → Live at `/legal/dpa`.
- A one-page incident-response summary (who to contact, notification-timeline commitment). → Folded into `/security`'s incident-response section (72-hour notification commitment, `security@launchabl.io`).

**Phase 1 — before signing the first mid-market/enterprise logo:** 🟡 **Partially shipped** — team/org accounts, the audit log, and the billing ledger are built and tested; SSO/SAML is deferred (see below, it genuinely needs external credentials this environment doesn't have).
- Team/org accounts + SSO/SAML together, ideally via one integration rather than two — Clerk (organizations + SSO/SCIM built in) or WorkOS AuthKit both slot in without replacing the existing `Session` shape (§14.4); solving org/team and SSO in the same integration avoids building a bespoke team model now and bolting SSO onto it later.
  - **Org accounts: done.** `lib/orgs/org.ts` (KV-backed, same pattern as every other account primitive in this codebase) — org create/rename/delete, email invites with a 7-day TTL, roles (owner/admin/member), member removal/self-leave, and a 25-member/25-pending-invite cap. `UserRecord.orgId`/`orgRole` (`lib/auth/session.ts`) is the only change to the existing account model — additive, nothing it replaces. Routes under `/api/orgs/*`; UI at `/team` and `/team/join`. 13 unit tests (`org.test.ts`) cover the permission matrix (who can invite/remove/promote/demote/leave/delete) and the membership cap.
  - **SSO/SAML: deferred, not built.** This genuinely can't be built for real without an external IdP to test against — shipping untestable auth code would be worse than not shipping it. What's needed to pick this back up: choose Clerk or WorkOS AuthKit (both already evaluated above), then add that provider's API keys/secrets via the Cursor Dashboard (Cloud Agents → Secrets) — neither exists in this environment today. Once that's available, it becomes another way to arrive at a valid `Session`, layered on top of the org model that's already built (per §19.3's point that org/team is the actual prerequisite, not the other way around).
- Admin action + sensitive-tool-run audit log (§14.3/§14.4) — cheap once there's more than one admin, and table stakes for any security questionnaire. → **Done.** `lib/audit/log.ts`: every org action (create/rename/delete/invite/revoke/join/role-change/remove/leave) and admin-dashboard view is recorded, dual-written to a capped KV recent-activity cache (works with zero setup) and, once `DATABASE_URL` is configured, to a durable, queryable `audit_log` Postgres table. Visible in the admin dashboard's new "Audit log & billing ledger" panel. One real gap, honestly noted in the panel's own copy and in §14.3: the single shared `ADMIN_TOKEN` still can't express *which* admin did an admin-only action (it's currently logged as actor `"admin"`) — org actions already carry a real per-user uid; closing the admin-side gap needs the same multi-admin/SSO work as the bullet above.
- Billing ledger on Postgres (§19.4) — most security questionnaires implicitly expect referential integrity/backups on financial records, not a KV counter. → **Done.** `lib/billing/ledger.ts`, dual-written from `webhook-handler.ts` alongside (never instead of) the existing KV writes that drive live entitlement checks — one row per Stripe event, de-duplicated by a real Postgres `UNIQUE` constraint on the event id (`ON CONFLICT ... DO NOTHING`), not a best-effort KV check. Verified end to end against a real, provisioned database (see below): a duplicate-event write correctly produced one row, not two.
  - **Database provisioning note:** a temporary Neon Postgres database was provisioned via Claimable Postgres (`neon.new`) to build and verify this against a real database rather than a mock. It expires 72 hours after provisioning unless claimed into a permanent Neon account — **claim it before then** via the URL in `PUBLIC_POSTGRES_CLAIM_URL` (`web/.env.local`, gitignored) to keep this data. After claiming (or provisioning a permanent replacement), set `DATABASE_URL` in Vercel (Development/Preview/Production) — it isn't set there yet, so production currently runs with the audit log/ledger silently falling back to KV-only/no-op, exactly as designed for a database that isn't configured. Run `npx tsx scripts/migrate.ts` (with `DATABASE_URL_DIRECT` set) against any new database to create the two tables.

**Phase 2 — the compliance-as-moat tier, once there's a real enterprise pipeline (not before — this is genuinely a program, not a sprint, and starting it "just in case" burns runway for no signal):**
- SOC 2 Type II via a compliance platform (Vanta/Drata), which also auto-generates most vendor-security-questionnaire answers.
- Data residency (EU hosting) if the pipeline includes EU enterprise buyers.
- A public status page with a stated uptime target.
- The BYO-model-key option (§14.4) for buyers who need to avoid the shared-gateway data path entirely.

**The nuance that matters for fundraising specifically:** you do not need SOC2 to raise a seed or Series A, and claiming otherwise (or rushing an audit early) wastes runway investors will notice. What a credible enterprise story needs *at demo stage* is: a clean, honest, confident answer to "what's your data-handling / model-provider story" (Phase 0, above — have this ready, not aspirational), a specific phased roadmap for the rest (Phases 1–2, above), and evidence the team already understands the requirements in this level of detail. Investors are underwriting the team's ability to execute the roadmap when the time comes, not grading the current state of a program that shouldn't exist yet at this stage.

---

## 21. Preparing for an MVP demo to raise funding

### 21.1 What this business already has that most seed-stage AI-wrapper decks don't

A live product with 51 shipped tools, three real monetization surfaces already wired end-to-end (the $1,200 agency plan, Tools Pro subscription, credit packs), and an admin dashboard with real per-tool cost, revenue and conversion data on demand (`/api/admin/usage`) — most seed decks are still mockups or a single metric slide. Lead with this: a working product and working instrumentation, not a projection.

### 21.2 The demo script — what to actually show, in order

1. **Open with a live, unscripted audit on an input the investor picks** (their own company's URL, or a well-known one) — real-time, ~60 seconds, a genuinely specific and correct finding. An AI demo that works live on someone else's chosen input, not a canned example, is the single most convincing thing available here.
2. **Chain into the unified agent from that same audit** — "now watch it fix what it just found": let the agent generate the meta-tag/schema/social-card fix in the same conversation, so the orchestration (`loadSkillGuide` → deliver → `reviewDeliverables`) is visible, not just one isolated tool call. This is §18.2.4's moat, demonstrated rather than described.
3. **Show the admin dashboard** (real numbers if presentable, a clean seeded demo tenant if not — see the checklist below) — sign-ups, activation, trial-to-paid conversion, MRR trend, and AI Gateway cost vs. revenue side by side. One screen that pre-answers half the questions an investor would otherwise ask one at a time.
4. **Show the pricing ladder end to end** ($0 tools → Tools Pro → credit packs → the $1,200 agency plan) and narrate the upgrade psychology in one breath: a free tool solves an immediate problem, hits a fair limit, and the next step up is right there. This is the entire business model, visually, in under a minute.
5. **Close with the roadmap** — moat (§18), scale (§19), compliance (§20) — stated as a confident, specific plan. Don't hide "we're not SOC2 yet"; a clear phased answer reads as competence to a sophisticated investor, a vague one reads as risk.

### 21.3 Suggested deck structure (10–12 slides)

Problem (SMBs/agencies can't afford a real marketing team or a $10k/mo retainer, and DIY AI tools are scattered and don't compound) → Insight/wedge (free tools acquire, a flat-fee unlimited plan monetizes the highest-intent segment, a subscription monetizes the middle — nothing else on the market connects all three in one account) → Live product demo (§21.2) → Why now (AI Gateway costs have collapsed enough to run 50+ tools profitably; models are commoditized enough that orchestration/data/distribution are where value accrues, not raw model access) → Market size (SMB/solo-agency/freelancer tools+services market, plus the larger-ACV agency-reseller/white-label expansion already on the backlog per §11) → Business model (the three-tier ladder, §7/§13) → Traction (the admin dashboard, live or as a screenshot) → Moat (§18, told as a narrative, not a list) → Competition (named, specific: tool aggregators have traffic but no loyalty or upsell path; design-subscription agencies have retention but no organic engine; this combines both, connected by one account) → Go-to-market (the SEO/content flywheel already running, plus the compliance/enterprise motion as a later lever) → Team → The ask (specific use of funds: e.g. engineering toward the heavy-tools tier + team/org accounts, growth toward the content engine, and the first SOC2 cycle once pipeline justifies it — not before).

### 21.4 Concrete pre-demo checklist

- [ ] Rehearse the live demo against at least 5 different real-world URLs so nothing breaks live — test slow sites, bot-protected sites, and non-English sites specifically, since those are the realistic ways a live audit demo fails in front of an investor.
- [ ] Never demo against test/junk accounts. This engagement alone created several (`pro-test@...`, `webhookfix-verify-...`, etc.) — either clean those out of anything an investor might see, or build a seeded demo tenant so production noise is never on screen.
- [x] Write the Phase 0 security/data-handling one-pager (§20) — have it ready to send the moment it's asked for, not "we'll get back to you." Live at `/security`, `/legal/subprocessors`, `/legal/dpa`.
- [ ] Get 2–3 real (or realistic beta) case studies with concrete before/after metrics ready — §5/§8 already call for this structurally, and it's the most convincing artifact for both acquisition and fundraising simultaneously. (The two placeholder entries are now explicitly labeled "Illustrative example" per §22.2 so they're no longer misrepresented as real, but replacing them with actual customers is still open.)
- [ ] Assemble the data-room skeleton now, even with placeholder rows: cap table, incorporation docs, a financial model, this document as technical/product diligence material, and the security one-pager above. Assembling this after a term sheet arrives is a common, avoidable delay.
- [ ] Rehearse fluent, specific answers to the two questions every AI-wrapper pitch gets — "what happens if model providers change pricing" and "what stops a well-funded competitor from cloning this in a quarter" — and make sure the answer is §18's actual moat argument, said confidently, not read off a slide.

---

## 22. Brutally honest: the real risk of becoming "just another AI tool"

§18 named the moat vectors worth building. This section is the other half of that conversation, said without the pitch-deck framing: where this actually stands today, who it's actually competing against, what's already happening to companies shaped exactly like this one, and the specific things sitting in this codebase right now that would not survive five minutes of a skeptical investor's or customer's scrutiny. Two distinct failure modes, and they need different fixes:

- **Failure mode A — "used for a month and tossed."** A user tries a free tool, maybe buys Tools Pro, gets what they need, and churns. No compounding reason to stay.
- **Failure mode B — "eaten by big model companies."** The category itself (thin, prompt-driven wrappers around frontier models) gets absorbed into ChatGPT/Claude/Gemini/Canva directly, at platform scale, for free or near-free, faster than this can build a moat deep enough to matter.

### 22.1 This is a five-day-old codebase with zero real usage — say that plainly

The repository was created on 2026-09-08. Every page, tool, and system described in this document was built in the days since, by AI agents, without a live customer base, production traffic, or revenue to validate any of it against. That's not a criticism of the build — it's the correct starting posture for evaluating everything else in this section: **every claim of "moat," "retention," or "flywheel" in §18 is currently a hypothesis, not a measured result.** There is no dashboard number today for "distinct tools used per account" or "% of runs that reused saved project context" (§18.2.1 names this gap explicitly) because nobody has used the product long enough to generate one. Team/org accounts, the audit log, and the billing ledger shipped in the last commit (§20) have zero real organizations in them. This isn't a reason not to build — it's the reason every downstream claim in this section has to be checked against reality before it goes in a deck, a sales call, or a customer-facing page.

### 22.2 Two of the three published case studies were fabricated-looking — fixed, but real ones still needed

`web/src/lib/case-studies.ts` shipped three case studies live on the public site. One — Atlas Lot Care, linked to a real, live site (`atlaslotcare.com`) — is real. The other two were presented with the identical format and confidence as the real one: a named company ("Riverside Roasters," "Northstar Legal Group"), a named quoted person with a title ("Maya Chen, Founder"; "David Okafor, Managing Partner"), and a specific, invented-sounding metric ("412 pre-orders in launch week," "+164% organic traffic in 4 months"). §21.4's own checklist already flagged "Get 2–3 real (or realistic beta) case studies" as unchecked — confirming these were known internally to be illustrative placeholders, not real customers — but nothing on the live page marked them as illustrative to an outside visitor. That was a live legal and trust liability (fabricated testimonials are exactly what FTC endorsement rules and basic customer trust prohibit), not just a marketing gap, and a five-minute fact-check away from becoming a credibility disaster at the worst possible moment (due diligence, a viral post, a journalist's cursory search for "Maya Chen Riverside Roasters").

**Fixed as part of this analysis:** `CaseStudy` now has a required `illustrative: boolean` field. The two invented entries are renamed to make the fiction explicit ("Riverside Roasters (hypothetical example)," quote author "Illustrative example — not a real customer"), and both the case-study card and the detail page (`/case-studies/[slug]`) now render an explicit "Illustrative example" badge/label wherever they appear — the card grid, the detail hero, and (via the unchanged `summary`/`client` fields) `llms.txt` and the sitemap. Atlas Lot Care is unaffected (`illustrative: false`). This closes the immediate trust liability, but the underlying task — replacing the two illustrative entries with real beta-customer case studies — is still open and is exactly what §21.4's checklist item already calls for.

### 22.3 Who this actually competes against for budget — named, with real 2026 numbers

The honest competitive set isn't "other AI tool sites." It's three tiers, and this product is currently weakest against all three:

1. **The platform layer — OpenAI, Anthropic, Google, and now increasingly Canva — building the exact "connective tissue" thesis at platform scale.** OpenAI's [Apps SDK and ChatGPT App Directory](https://openai.com/index/introducing-apps-in-chatgpt) launched broadly in December 2025 on top of ~800M weekly active ChatGPT users, with pilot partners (Canva, Adobe, Figma, Spotify, Booking.com, Instacart, Zillow) running as native "apps you chat with" *inside* ChatGPT — persistent context, tool-calling, and now [Instant Checkout via the Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) for monetization, all without the user ever leaving the chat window they already have open all day. That is §18.2.1's Brand Vault/connective-tissue thesis, built by the platform itself, at a distribution scale no standalone site can approach. Anthropic is moving the same direction one layer down the stack — Claude for Excel (Oct 2025) and Claude for PowerPoint (Feb 2026) put Claude directly inside the productivity tools SMBs already use. If a user's meta-tag generator, schema checker, or audit tool is one line of MCP glue away from being an "app" inside ChatGPT itself, the reason to visit a separate site erodes fast.
2. **The incumbent AI marketing-tool vendors, and they are already showing category fatigue, not room for a new entrant to coast in.** [Jasper's revenue fell from $120M (2023) to $88M (2025)](https://presenc.ai/research/marketing-ai-tools-landscape-2026) despite being the category's best-funded incumbent ($131M raised) — the report's own explanation: "the category matured and vertical specialists absorbed share... mid-tier copy tools also lost users who learned to prompt LLMs directly." Copy.ai (380K+ users, mostly free) survived by pivoting from "AI copy tool" to CRM-integrated GTM workflow automation — i.e., by building the switching-cost integrations this product doesn't have yet. Industry-wide, the tracked tool count fell from 450+ (2024) to an estimated 320 (2026), heading toward ~280 (2027) — a category actively consolidating, not growing room for undifferentiated new entrants. The explicit 2026 verdict from the market itself: "quality has commoditized... the next competitive frontier is workflow integration, not content quality."
3. **Canva, which is the closest real analog to the "tools + services" bundle here — and it is $4B ARR, 265M MAU, and still visibly scared of being eaten by the model layer.** Canva hit an [estimated $4B ARR in 2025 (up 43% YoY), 265M monthly active users, 31M paying subscribers](https://sacra.com/research/canva-at-4b-arr-growing-43-yoy/), built its own proprietary foundation model (the "Canva Design Model") rather than renting one, and has been acquiring adjacent capabilities (MagicBrief, Cavalry, MangoAI) specifically, in the analyst's words, "as a buffer to the threat from foundation model companies like Anthropic as they go deeper into B2B workflows." If a company with Canva's distribution, revenue, and proprietary model is actively arming itself against Anthropic and OpenAI moving into its territory, a pre-revenue tool suite with no proprietary model, no distribution, and no owned user base starts from a materially weaker position than the category's own winner.

### 22.4 This is already happening to startups shaped exactly like this one — not a hypothetical risk

This isn't a future risk to hedge against; it's an ongoing pattern in 2026, to companies with real users and real revenue, doing the same thing this product does — thin(ner)-than-they'd-like agentic wrappers on frontier models:

- **Ryze**, an AI ad-management tool with several hundred paying customers and a 70% close rate two months after launch, saw that close rate collapse to 20% within days after [Anthropic (Claude) and Manus shipped native connectors for the same workflow](https://www.storyboard18.com/digital/claude-ai-update-made-our-product-obsolete-says-ryze-founder-ira-bodnar-90663.htm). The founder's own words: "Claude just made our entire product category obsolete... give it a few months, and it will [do everything we do]." This is Failure Mode B, happening in real time, to a company with actual revenue — the exact scenario named in this section's title.
- **Rilo**, an AI workflow-automation startup for marketing/GTM teams, scaled to [10,000 users and a $10M valuation](https://inc42.com/buzz/adobe-acquires-peak-xv-backed-ai-martech-startup-rilo/) — then Adobe acquired it and **shut the standalone product down entirely**, folding the team and tech into Adobe's own suite. Getting acquired isn't automatically a win for a product like this if the acquirer's actual goal is the team and the standalone product disappears — that's the fate of a feature, not a company.
- **Reforged Labs**, an AI ad-creative startup, wound down after raising $3.9M, citing "rapid AI advances closing [our] competitive gap" as sophisticated customers became able to build the same capability internally.
- Zoom out further: the 2026 martech press has a name for this pattern now — the ["SaaSpocalypse"](https://www.ndtv.com/feature/claude-killed-our-startup-san-francisco-entrepreneur-says-ai-tool-made-her-product-obsolete-11130230) — and industry tracking shows 1,367 standalone martech products disappearing as their core features moved into major platforms' native offerings.

None of these companies were undifferentiated — they had real users, real revenue, and (in Ryze's case) a 70% close rate. What they lacked, and what this product also currently lacks, is the thing that survives a model-provider feature launch: owned distribution independent of the model interface, a data or workflow asset the model provider can't just absorb by shipping a connector, or genuine switching costs built from accumulated account-specific state. §18.2.1–18.2.2 name the right ideas (Brand Vault context, outcome-data flywheel) — but per §22.1, neither is instrumented or measured yet, which means today, the actual defense against this pattern is exactly zero.

### 22.5 The specific gaps, ranked by how much they actually matter

1. **No proprietary model or data asset — 100% rented compute.** Every tool call goes through the shared AI Gateway to third-party frontier models (§20's own subprocessor list: Anthropic, OpenAI, Google, ByteDance, Black Forest Labs, Meta). Canva builds its own model specifically to avoid this exposure. This product has no equivalent, and §18.2.8's "cost/margin moat" (fallback chains) is a real, worth-stating efficiency, but it is not a defense against a model provider shipping the same *capability* for free — it only helps if this product is still cheaper to build *around* those models than the alternative, which shrinks every time a frontier model gets better at zero-shot agentic tasks.
2. **50+ tools, and "tool count" is now a documented red flag, not a strength.** §18.3 already says not to lead with "51 tools" to investors — 2026 market data goes further: the *category itself* is what's commoditizing ("mid-tier copy tools lost users who learned to prompt LLMs directly"). A visitor who can get an equivalent schema check or meta-tag rewrite by pasting their URL into ChatGPT directly has no reason to remember this site's name, and every month that gets easier, not harder.
3. **Zero instrumented evidence for the one thesis this whole strategy rests on.** §18.2.1 calls "distinct tools used per account" the single biggest lever in the product — and it is not measured anywhere today. Until it is, there's no way to know if a single account uses one tool and leaves (Failure Mode A, confirmed) or ten tools and stays (the moat, unconfirmed). This should be the very next engineering priority ahead of any new tool or page — it's cheap to add and it's the only way to know if §18's core bet is even true.
4. **No owned distribution independent of SEO/organic and no platform presence in the places users increasingly are.** Every acquisition channel described in this document (§2, §21.3) is organic search and content. That's the same channel every competitor above is fighting over, and it's directly exposed to AI answer engines (ChatGPT, Google AI Overviews, Perplexity) increasingly *answering* the audit/checklist/meta-tag question inline instead of sending a click to any tool site — the same traffic compression that is separately shrinking organic CTR for content sites generally. §18.2.7 names embed/distribution partnerships (a Chrome extension, a WordPress plugin, an MCP/ChatGPT-App-Directory listing) as "not yet built" — given §22.3.1's platform-app-directory dynamic, this has gone from a nice-to-have to close to existential: being *inside* ChatGPT's App Directory as a listed tool is a materially different distribution bet than hoping to out-rank it in search.
5. **Only one of three case studies is real (§22.2).** The mislabeling risk is fixed, but a case-studies page that's 2/3 explicitly-labeled hypotheticals is still weak proof for an investor or enterprise buyer doing diligence — it reads as "we don't have real customers yet," which is true, and should be replaced with real beta-customer results as soon as any exist, per §21.4.
6. **Compliance infrastructure (§20) is real code with zero real customers behind it.** Phase 0/1 shipped genuinely useful scaffolding (security page, DPA, org accounts, audit log, billing ledger on Postgres) — but it's unvalidated against an actual security questionnaire, an actual SOC2 auditor, or an actual enterprise procurement process. It closes the "have you thought about this" gap (§20's own framing) but shouldn't be mistaken for enterprise-readiness; there's a wide gap between "there's a page for this" and "we passed the questionnaire."
7. **Vertical depth is still zero (§18.2.5, unchanged).** Horizontal "AI tools for any business" is precisely the profile most exposed to platform absorption, because it has no defensible expertise a general-purpose model doesn't also have. A narrow, deep vertical (one industry's playbook, done exceptionally, with proprietary benchmarks) is structurally harder for a horizontal platform feature to match — and is still unbuilt here.

### 22.6 What this means, said plainly

Nothing in this section means stop building — the underlying insight (§1, §18) is sound and the moat vectors in §18.2 are the right ideas. It means: **the moat is currently a plan, not a fact, and the companies getting hurt in 2026 by "eaten by a model provider" were further along than this product is today** — some had hundreds of paying customers and 70% close rates. The honest sequencing, given everything above, is: (1) get real beta-customer case studies to replace the two labeled-hypothetical ones (§22.2 — the mislabeling itself is fixed, but the underlying "only one real customer" fact isn't); (2) instrument §18.2.1's usage metric before writing another line about "the moat" in a deck — it's the only way to know if the core thesis is even true; (3) treat distribution inside the platforms (an MCP/App-Directory listing, an embed, a plugin) as urgent, not a backlog item, given §22.3.1; (4) pick one vertical and go deep before adding tool #52. Everything else in §18–§21 is still the right long-term plan — but it only becomes a real moat once it's measured, not asserted.

**Sources:**
- [Introducing apps in ChatGPT and the new Apps SDK — OpenAI](https://openai.com/index/introducing-apps-in-chatgpt) (Sept 2026 update)
- [Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol — OpenAI](https://openai.com/index/buy-it-in-chatgpt/)
- [Getting Your App into the ChatGPT App Directory — mGrowTech](https://mgrowtech.com/getting-your-app-into-the-chatgpt-app-directory/)
- [Marketing AI Tools Landscape 2026: Jasper, Writer, Copy.ai, Anyword, Frase — Presenc AI](https://presenc.ai/research/marketing-ai-tools-landscape-2026) (2026-05-15 snapshot)
- [AI-Powered Content Creation Tools — Market Landscape Report 2026 — Kova Digital](https://kova-digital.com/work/market-research-report)
- [Canva at $4B ARR growing 43% YoY — Sacra](https://sacra.com/research/canva-at-4b-arr-growing-43-yoy/)
- [Canva: from design tool to AI-led marketing platform — TechMarketView](https://www.techmarketview.com/news/archive/2026/04/02/new-research-canva-from-design-tool-to-ai-led-marketing-platform) (Apr 2026)
- [Adobe Acquires Peak XV-Backed AI Martech Startup Rilo — Inc42](https://inc42.com/buzz/adobe-acquires-peak-xv-backed-ai-martech-startup-rilo/)
- [Adobe acquires Indian market intelligence startup Rilo — TechCrunch](https://techcrunch.com/2026/09/02/adobe-acquires-indian-market-intelligence-startup-rilo/) (Sept 2026)
- [AI Ad Startup Reforged Labs Winds Down After Three Years, $3.9M Seed Round — Gate US](https://www.gate.com/en-us/news/detail/ai-ad-startup-reforged-labs-winds-down-after-three-years-39m-seed-round-17825746) (Aug 2026)
- ["Claude AI update 'made our product obsolete,'" Says Ryze founder Ira Bodnar — Storyboard18](https://www.storyboard18.com/digital/claude-ai-update-made-our-product-obsolete-says-ryze-founder-ira-bodnar-90663.htm)
- ["Claude Killed Our Startup" — NDTV](https://www.ndtv.com/feature/claude-killed-our-startup-san-francisco-entrepreneur-says-ai-tool-made-her-product-obsolete-11130230)

---

## 23. The real fork: stay the course, pivot to a lane, or build to be acquired

§22 established the risk. This section is the decision that follows from it. It is deliberately a decision document, not a build log — it lays out the real options with evidence for each, gives a recommendation, and flags exactly what's the founder's call to make before more engineering time gets spent in any one direction. Nothing in this section should be treated as already decided.

### 23.1 Reframe: these aren't three mutually exclusive futures, they're three different things to optimize engineering time for

"Continue," "pivot," and "build to be acquired" sound like a fork in the road, but concretely they cash out as: what do the next several weeks of engineering effort get pointed at? A generic "51 tools + agency" product, a specific vertical's workflow problem, or the orchestration/data architecture that makes a technical acquirer's due-diligence checklist light up green? Money and time only go one direction at a time, so this has to be resolved before the next build sprint, not organically discovered by building all three a little.

### 23.2 Option A — stay the course (harden the current tools+agency model)

What §18–§22 already describe: keep the 50+ tool suite, the unlimited-agency plan, and the compliance scaffolding, and invest in the moat vectors §18.2 names (usage instrumentation, outcome-data flywheel, vertical depth, distribution partnerships). **Honest assessment: weakest of the three options as currently scoped.** §22 already showed the category is consolidating (Jasper's revenue fell from $120M to $88M as the incumbent), the platforms are absorbing the exact "connective tissue" thesis this depends on (ChatGPT's App Directory, Claude for Excel/PowerPoint), and there is zero measured evidence yet that the moat mechanics even work on real users. Continuing to add tool #52 without first proving #1–#51 create retention is the definition of the failure mode named in the request ("used for a month and tossed") — more surface area doesn't fix a thesis that hasn't been tested. This option is not recommended as-is, but the underlying orchestration engine it's built on (`agent.ts`, `loadSkillGuide`, `reviewDeliverables`) is genuinely reusable in either other option below — nothing here needs to be thrown away, just re-pointed.

### 23.3 Option B — pivot fully into a vertical product (e.g., field-service management for local/home-service businesses)

The one real customer this product has, Atlas Lot Care, sits in exactly this vertical (local home/commercial services), which makes it the most concrete pivot candidate rather than a guess. The evidence says this lane is real, active, and fundable — and also that it's already getting crowded by better-capitalized, purpose-built competitors:

- Established incumbents (Jobber, Housecall Pro, ServiceTitan, FieldEdge, Workiz) already own scheduling/dispatch/invoicing/CRM for this exact buyer.
- A new wave of **AI-native** entrants is moving fast and getting funded specifically on "AI does the busywork" positioning: [Feldy](https://www.ycombinator.com/launches/SiZ-feldy-field-first-ai-for-home-services-and-contractors) (YC-backed, 200+ paying customers within months, founders with a prior "zero to several million ARR" construction-software exit), [FieldCamp](https://fieldcamp.ai/) (AI CSR + dispatcher + back office, MCP/Claude-reachable), and [Roooster](https://roooster.ai/) (AI photo quoting for home services) are all live, funded, and iterating in this exact niche right now.
- **The honest read:** this is a real, fundable lane — but pivoting into it *as a from-scratch competitor to Jobber/Feldy/Roooster* means abandoning almost everything currently built (the tool suite, the agency-subscription model, the marketing/SEO positioning) to build a fundamentally different core product (scheduling, dispatch, CRM, payments) against founders who already have vertical-specific ML experience and a head start. That's not "focus," it's a different company, starting from zero against funded incumbents. A full pivot here is not recommended without a much stronger reason to believe this team can out-execute Feldy's founders on their own turf.

### 23.4 Option C — stop optimizing for consumer growth and build to be an attractive acquisition/acquihire target

2026's actual acquisition pattern is specific, and worth being precise about rather than hand-wavy:

- Acquirers (OpenAI, Anthropic, ServiceNow, Asana, Databricks, SAP, and others) are buying **small teams (8–25 people, Series A or earlier) that own an execution bottleneck** — typed skill interfaces, DAG-based orchestration, state/checkpointing, evals, identity/governance for machine actions — not prompt wrappers. Quoting the pattern directly: *"None of the four deals bought a foundation model... the durable advantage in agentic AI is not the smartest model but the deepest hooks into systems of record."*
- The clearest, most repeatable signal is an **open-source distribution wedge with measurable adoption** (GitHub stars, package downloads, weekly active OSS users) — this product has none today.
- The product itself is frequently treated as disposable post-acquisition (Rilo shut down after Adobe bought it; Hiro was shut down within a week of OpenAI's acquisition) — the acquirer is buying the team and the technical substrate, not the go-to-market. That has to be an acceptable outcome to actually optimize for this path; it is not "grow this business," it's "make the team and the architecture undeniable, and treat the consumer product as a demo."
- **What this product would need that it doesn't have today:** the agent/skills architecture (`agent.ts`, `loadSkillGuide`, `reviewDeliverables`) is directionally the right shape (it's already "orchestration," not just prompts) but per the [M&A technical-due-diligence framework](https://dredyson.com/the-hidden-truth-about-ai-agent-architecture-in-ma-technical-due-diligence-why-prompt-engineering-wont-fix-agents-and-what-every-acquirer-needs-to-know-a-complete-step-by-step-guide-to-e/) that a serious acquirer's engineers actually apply, it would need to visibly demonstrate: typed skill interfaces (not just prompt templates), explicit DAG/composable execution rather than implicit reasoning, real state persistence and recovery, model-independent backend bindings, and eval/tracing infrastructure. None of that requires abandoning the current product — it requires hardening the parts of it that are already architecturally closest to what acquirers pay for, and being honest that this is a multi-month engineering investment with no guaranteed buyer at the end, not a quick repositioning.
- This path also doesn't require picking a side against Option A or B — a harder orchestration engine and better evals make the product better regardless of whether anyone ever makes an acquisition offer.

### 23.5 Recommendation: narrow the vertical, harden the engine — don't do a wholesale pivot or bet everything on an acquisition

Given the evidence above, the strongest move isn't any of the three options taken to its extreme. It's a synthesis that improves the odds of all three simultaneously, because the same two investments pay off whether the outcome ends up being "grow independently," "get acquired," or "pivot later with real data in hand":

1. **Narrow from horizontal to one vertical — using the real customer already in hand, not a from-scratch FSM build.** Don't build a Jobber/Feldy competitor (§23.3's core product). Instead, re-point the *existing* tool suite and agent engine at one ICP — local/home-service businesses (parking lot services, lawn care, cleaning, HVAC, similar to Atlas Lot Care) — and go deep on the marketing/ops workflows that vertical specifically needs (local SEO, GBP optimization, review generation, quote-facing site content, schema/local-business markup) rather than staying horizontal ("any business"). This directly executes §18.2.5 (vertical depth, previously "not yet built") and turns the one real case study into a repeatable ICP instead of an anecdote — a materially cheaper bet than rebuilding scheduling/dispatch/CRM from zero against funded incumbents.
2. **Harden the orchestration engine, not the tool count.** Stop measuring progress in "tools shipped" (§22.5's "50+ tools is now a red flag, not a strength") and start measuring it in the architecture properties 2026 acquirers and sophisticated enterprise buyers actually check: instrumented usage (§18.2.1, still unmeasured), the outcome-data flywheel (§18.2.2, still unbuilt), typed/composable skills, and eval coverage on `agent.ts`. This is genuinely dual-use: it's the same work that makes the product better for a real customer, more defensible against platform absorption (§22's Failure Mode B), *and* legible to a technical acquirer (§23.4) — there's no work here that's wasted if the strategic bet changes later.
3. **Do not spend engineering time this quarter on tool #52, a second vertical, or a full FSM rebuild.** All three dilute the one thing that would actually move the needle on any of the three original options: proof, from a real vertical, with real usage data, that the orchestration engine creates retention and outcomes a thin prompt wrapper can't match.

### 23.6 What has to happen next — and what's the founder's call, not an engineering call

The concrete next steps if this recommendation is accepted: (a) pick the specific home/local-service niche to go deep on (lawn care and exterior services, given Atlas Lot Care, is the natural default, but adjacent niches are viable), (b) instrument §18.2.1's usage metric immediately — it's cheap and is the prerequisite for knowing if any of this is working, (c) build 2–3 vertical-specific workflows/playbooks (§18.2.5) rather than generic tools, and (d) start the orchestration hardening work from §23.4 in parallel, since it's valuable regardless of outcome.

What this document can't decide for the founder: how much runway/time exists to test this before needing a different answer, whether "get acquired" is an acceptable or desired outcome at all (it changes what "success" means for the next several months of work), and which specific vertical niche to commit to. Those are business decisions this analysis can inform but shouldn't make unilaterally.

---

## 24. Decision: narrow to home/local services, harden the orchestration engine — Phase 2 roadmap

§23.6 asked the founder to make the actual call. **Decision: the recommended hybrid from §23.5 — narrow the existing tool suite and agent engine to one vertical (home/local services, anchored on Atlas Lot Care) and harden the orchestration architecture, rather than staying fully horizontal or doing a full from-scratch pivot into field-service management.** This section is the execution plan for that decision and tracks what's actually shipped, following the same convention as §20's Phase 0/1 tracking.

### 24.1 Why home/local services specifically

Per §23.3/§23.4's evidence: the vertical is real and fundable (Feldy, FieldCamp, Roooster are all live and growing), but a from-scratch FSM/scheduling/dispatch competitor was explicitly rejected in §23.3 as too expensive and too contested. The version of "home/local services" being committed to here is narrower and cheaper: **not** scheduling/dispatch/CRM (leave that to Jobber/ServiceTitan/Feldy), but the **marketing/local-visibility workflows** this codebase already has real tools for — local SEO, Google Business Profile optimization, review generation cadence, schema/local-business markup, quote-facing site content, and service-area pages — done exceptionally well for lawn care, cleaning, HVAC, pressure-washing, and parking-lot/exterior services specifically, instead of generically for "any business." This is §18.2.5's "vertical depth" moat vector, executed against a real customer's actual industry instead of a guess.

### 24.2 Phase 2 roadmap

1. **[x] Usage instrumentation (§18.2.1's prerequisite).** `recordUsage` now carries `uid` and `hasProjectContext`; the admin dashboard has a "Moat metrics" panel showing distinct-tools-per-account histogram, multi-tool rate, and project-context reuse rate (`src/lib/ai/usage.ts`, `src/app/api/admin/usage/route.ts`, `src/components/admin/usage-dashboard.tsx`). This has to exist before any claim about the moat working can be trusted — see §22.1/§23.1.
2. **[x] Home-services vertical overlay.** `Project.vertical` (`src/lib/projects/project.ts`) carries a `"home-services"` value with a dedicated category-knowledge block injected into every tool run via `projectContext()` for a project set to it — seasonality by trade, the review-velocity/map-pack ranking reality, hyper-local service-area-page structure, and quote-as-conversion-event framing. The project editor (`project-switcher.tsx`) exposes it as an "Industry" field. `local-seo-optimizer`'s own instructions (`marketing-kits.ts`) are separately deepened with the same trade knowledge so the tool is better for these trades even without a project attached. This is additive — every other vertical/generic use of `local-seo-optimizer` and projects is unaffected; `vertical` defaults to `null`.
3. **[ ] Outcome-data flywheel, scoped to this vertical first (§18.2.2).** Rather than building it generically, prove it on the one vertical: log `(domain, first score, first-seen, latest score, latest-seen)` for local-SEO/schema audits run against home-service businesses specifically, so the first real case study (beyond Atlas Lot Care) has an actual before/after number instead of an invented one (§22.2).
4. **[ ] Orchestration hardening (§23.4), in parallel, not sequenced after the above.** Start with eval coverage on `agent.ts`'s workflow patterns and typed inputs/outputs on the skill runtimes already in `src/lib/ai/tools/` — this is valuable regardless of which of §23's three outcomes materializes, and doesn't require the vertical work to land first.
5. **[ ] Positioning pass, only after 2–3 is far enough along to be honest about it.** Don't change the homepage/marketing copy to claim vertical depth before the depth exists — §22.2's lesson applies here too: claiming a positioning that isn't backed by real product depth is the same mistake as an invented case study, just at the homepage level instead of the case-studies page.

### 24.3 What this explicitly does not mean

This is not a rebuild and not a rebrand yet. The 50+ horizontal tools, the agency-subscription model, and the existing positioning stay as-is while this work lands — §23.5 was explicit that this is additive depth on the existing engine, not a rip-and-replace. Tool #52 and a second vertical are still off the table until the usage-instrumentation panel (24.2.1) shows this one is actually working.

**Superseded by §25.** The founder has since gone further than this section's "additive depth, no rebuild" recommendation — see §25 for the actual current direction (a two-sided marketplace + operations OS, not a horizontal tool suite with a vertical overlay). §24's shipped work (usage instrumentation, the home-services vertical overlay) isn't wasted — §25.4 maps exactly how each piece carries forward — but §24.3's "stays as-is" framing no longer describes the plan.

---

## 25. Pivot: Service Business OS + Marketplace (NC-first)

### 25.1 The model, stated precisely

Two distinct products in one account, not a horizontal tool suite with a vertical skin:

- **The Marketplace** — a lead engine for contractors and home/local-service businesses. Consumer-facing, SEO- and content-driven, **North Carolina-first** because there's no direct competitor running this specific combination in that market yet. Growth is explicit and singular: the more exposure and keywords this ranks for, the more leads it generates, the more contractors it's worth having on the platform, the more listings/reviews/content it has, the more it ranks for — a standard two-sided-marketplace SEO flywheel, and the primary thing worth investing in over almost everything else right now.
- **The OS** — a vertical operations product for the contractors the marketplace feeds, sold as the reason to stay once a lead converts. Explicit feature list from the founder: smart job scheduling, AI agents, unified customer profiles, near-perfect digital estimates, automations, warranty/maintenance tracking, staff assignments/teams, inventory management, Telegram/iMessage integration for on-the-go alerts, payment collection, and a performance/revenue dashboard.

**Why this is a materially different bet than §23–§24's recommendation, and why it's a reasonable one anyway:** §23.3 rejected a full field-service-management pivot because Feldy/FieldCamp/Roooster are already funded, live, and purpose-built for exactly that. That evidence still stands — but none of those three run a *marketplace* (they sell software to contractors who already have their own leads); Thumbtack/Angi/Nextdoor run the marketplace side but have thin, generic OS tooling and no NC-specific density play. Bundling both, and deliberately starting in one state instead of nationally, is a real, evidence-supported wedge the earlier analysis didn't fully evaluate because the founder hadn't specified it yet. This is a bigger, harder build than §23.5's "narrow one vertical, don't rebuild" — that's a legitimate call for the founder to make, and it's made now.

### 25.2 What happens to the current product — tool-by-tool disposition

The founder asked for tools to be removed or restructured to fit this mission. Disposition for all ~50 current tools (`site-config.ts`), grouped by what happens to each — **executed**: cut tools leave the public `/tools` explorer, sitemap, and `llms.txt` (`lib/marketplace/catalog.ts`) but the code stays so the agency can still use the bigger suite. Routes remain reachable; retired/OS-only tools are `noindex`.

**Keep public, repositioned as the contractor-acquisition SEO engine** (each already ranks for its own technical-SEO keyword; the funnel becomes "get this fixed for free → see what your listing/site could look like on the OS" instead of "buy the agency plan"): `website-audit-report`, `landing-page-grader`, `competitor-gap-report`, `page-speed-audit`, `broken-link-checker`, `canonical-tag-detector`, `backlink-health-check`, `voice-search-optimizer`, `llm-readability-check`, `security-headers-checker`, `ssl-certificate-checker`, `accessibility-checker`, `dns-email-health`, `compliance-scanner`, `meta-tag-generator`, `sitemap-robots-generator`, `schema-generator`, `local-seo-optimizer`.

**Repurpose into in-app OS features** (stop being standalone public chat tools; become part of the contractor product): `schema-generator` + `local-seo-optimizer` industrialize into the marketplace's own programmatic SEO engine (§25.5) and the contractor-profile setup flow; `brand-creator`, `brand-identity-kit`, `domain-availability`, `domain-purchase`, `hosting` become the "get a site and profile" onboarding path for a contractor who doesn't have one; `social-card-generator`, `ai-image-generator`, `qr-code-generator` become in-OS marketing utilities (before/after job posts, a review-request QR code on invoices/work trucks); `utm-builder` becomes internal marketplace campaign tracking; **`markdown-file-generator` — decided, kept and repurposed, not cut** — becomes the agentic knowledge-capture tool: an account's AI agent (or the contractor directly) can write a structured Markdown knowledge note about a job/customer/quote, saved always-private to that account and, only with the contractor's explicit consent, also folded into a cross-account learning pool that improves every account's AI agents over time (the §18.2.2 outcome-data flywheel, applied to what the agents themselves observe rather than only external SEO-audit scores). See §25.8 for the shipped implementation.

**Cut** (no clear path to either side of the new model): `ab-copy-variants`, `watermark-generator`, `watermark-remover`, `metadata-remover`, `file-converter`, `image-converter`, `agent-skill-generator`, `dataset-builder`, `ad-creative-resizer`, `content-campaign-calendar`, `white-label-report-builder`, `email-newsletter-builder`, `email-finder`, `persona-generator`, `subject-line-checker`, `press-release-generator`, `qa-test-plan-generator`, `content-repurposer`, `transcriber`, `clip-finder`, `background-remover`, `demo-video-creator`.

That's roughly 18 kept, 11 repurposed, 21 cut. The 50+-tools horizontal positioning (§18.3's own "don't lead with tool count" warning, and §22.5's "50+ tools is now a red flag, not a strength") goes away entirely under this model — the marketplace and the OS are the product; the SEO tools that remain public are lead-gen surface area for the marketplace, not the product itself.

### 25.3 Core new data model

None of this exists yet. `Org`/`OrgRecord` (§20 Phase 1) is the right primitive to build on rather than replace — a `ServiceBusinessProfile` extends it 1:1 (keeps the auth/billing/team primitive uncontaminated by domain-specific fields):

- **`ServiceBusinessProfile`** — `orgId` (1:1 with the existing Org), trades served (the 8 decided in §25.7 Q2), NC service area (cities/counties), address, phone, license/insurance/bonding status, GBP profile link, public marketplace-listing slug, and an `allowKnowledgeSharing` consent flag (§25.2's repurposed `markdown-file-generator`, detailed in §25.8) gating cross-account knowledge-note reuse.
- **`KnowledgeNote`** — a Markdown note captured for one org (via the repurposed `markdown-file-generator` tool or written directly), always saved privately; additionally indexed into a shared cross-account learning pool only if `allowKnowledgeSharing` was `true` at save time. See §25.8 for the shipped implementation and its privacy caveat (raw notes aren't wired into any other tenant's AI context yet — that needs a real redaction step first).
- **`Lead`** — consumer inquiry from a marketplace landing page: category, city, contact info, job description, urgency, source (which page/keyword), matched `ServiceBusinessProfile` (or unmatched/pool), status (new/contacted/quoted/won/lost). **Monetization, decided (§25.7 Q1):** subscription-tiered lead volume, not per-lead or commission pricing — a `Lead` carries no price field; instead each `ServiceBusinessProfile`'s subscription tier sets a monthly lead allotment, and delivered leads count against that period's allotment (needs a period-scoped counter next to the tier, same shape as the existing credits/ledger counters in §20 Phase 1). Lead quality must stay consistent across every tier — higher tiers buy more leads, never better ones — which rules out any design that quietly routes worse leads to lower tiers.
- **`Customer`** — the unified customer profile inside one contractor's OS: contact info, address(es), linked jobs, notes, tags, source (marketplace lead vs. referral vs. direct).
- **`Job`** — scheduled work: customer, assigned staff, service type, status, linked estimate/invoice, warranty expiry.
- **`Estimate`** — line items, total, status, and whether it was AI-drafted (ties directly into the "AI agents" and "near-perfect digital estimates" features as one workflow, not two).
- **Staff assignment** reuses the existing `OrgMember`/role system (§20) rather than a new primitive — a staff member is an org member with jobs assigned to them.
- **`InventoryItem`** — name, SKU, quantity on hand, reorder threshold, cost.
- **`WarrantyRecord`** — linked to a job/customer, coverage description, start/end dates, reminder schedule.
- **`Payment`** extends the existing Postgres billing ledger (§20 Phase 1) rather than a new system — a job payment is a ledger entry with a `jobId`.

### 25.4 Reuse map — what's already built maps directly, nothing here is wasted

| Existing system | Becomes |
|---|---|
| `agent.ts` + `loadSkillGuide` + the skills/runtime engine (§18.2.4, hardened further in §23.4) | The "AI agents" feature itself — draft estimates, follow up on leads, answer customer questions, staffed per contractor account |
| Org/team accounts, roles, invites (§20 Phase 1) | Staff assignments/teams, directly |
| Postgres billing ledger + audit log (§20 Phase 1) | Payment collection's system of record + an ops activity log for the OS |
| `Project.vertical` + the home-services category guide (§24) | The trade taxonomy and category knowledge seeding `ServiceBusinessProfile.trades` and every AI-agent interaction for that business |
| `local-seo-optimizer` + `schema-generator` (§18.2.5/§24) | The knowledge base the marketplace's own programmatic SEO templates (§25.5) and contractor-onboarding flow are built from |
| KV store conventions, Neon Postgres, admin dashboard patterns (§19–§20) | Every new entity above follows the same storage and instrumentation conventions rather than inventing new ones |

Nothing shipped in §20/§22–§24 was wasted effort — this is the vertical-depth and orchestration-hardening bet (§23.5) taken to its logical, larger conclusion rather than a discarded direction.

### 25.5 The marketplace's growth engine (SEO), concretely

- **Programmatic category × city pages** — `/nc/[city]/[trade]` (e.g. `/nc/greensboro/lawn-care`), each a real landing page (not a thin doorway page — local content, the vetted contractors serving that city/trade, a lead-capture form) plus `LocalBusiness`/`Service` schema. This is `local-seo-optimizer`'s and `schema-generator`'s own output, industrialized into a template rendered at scale across every NC city × trade combination instead of generated one-off in a chat tool.
- **Contractor profile pages** as the second SEO surface — every contractor who joins gets a public, schema-marked, indexed profile page (name, service area, reviews, trades) whether or not they've received a lead yet. This is the reason to join before the marketplace has liquidity: a free, real, ranking web page, which is a materially better cold-outreach pitch than "a directory listing" is elsewhere.
- **Review-authenticity requirement, called out explicitly given §22.2:** any review or case study surfaced on either a category page or a contractor profile must be real, sourced, and attributed — the fabricated-case-study mistake fixed in §22.2 must not recur at marketplace scale, where it would be both a bigger legal exposure and a bigger credibility risk.

### 25.6 Phased build roadmap

1. **Phase 3.0 — the core loop.** `ServiceBusinessProfile` + `Customer` + `Job` + `Estimate` + payment collection (extending the existing ledger) + one working marketplace landing-page template + a lead-intake form + a minimal performance/revenue dashboard. Nothing else ships until a lead can flow from a marketplace page into a contractor's OS and become a paid job end to end.
2. **Phase 3.1 — the differentiated OS layer.** AI agents (estimate drafting, lead follow-up, customer Q&A — direct reuse of `agent.ts`), smart job scheduling, staff assignment (direct reuse of org/roles).
3. **Phase 3.2 — retention and operational depth.** Warranty/maintenance tracking, inventory management, Telegram/iMessage alerts.
4. **Phase 3.3 — marketplace scale-out.** Programmatic SEO pages across all NC cities × trades, lead-routing/matching logic once there's enough contractor density per category to route intelligently instead of just listing everyone.

Building all eleven OS features and full statewide SEO coverage simultaneously isn't realistic; the ordering above is built around "does the core loop work end to end" before "how many features does the OS have," because a working loop with three features beats eleven features nobody's used yet — the same lesson §22.1 already drew from this project's own five-day-old history.

### 25.7 Founder decisions

1. **Marketplace monetization — decided.** Subscription tiers determine lead *volume*, not lead *quality*: a contractor's plan sets how many leads they receive per period; every lead delivered, at every tier, must be consistently good. No pay-per-lead, no commission-on-job-value. See §25.3's `Lead` entry for the schema implication (a period-scoped allotment counter, not a price field).
2. **Launch trade categories — decided, then extended in §31–§34.** Lawn care, HVAC, cleaning, pressure washing/exterior, parking-lot/paving (carried forward from §24), plus plumbing, electrical, and painting. **Junk removal** added in §31. **Roadside assistance** and **towing** added as separate dispatch-native trades (§32). **Pest control** added as the fourth starting-lineup trade (§33). **Courier / cargo van** added in §34 for drivers who cannot live on DoorDash. Agency *sourcing* for the remaining season is cleaning, HVAC, pest, then lawn — not painting, not “households tow weekly,” not food delivery.
3. **The tool cut list (§25.2) — decided and executed.** Public catalog is the SEO keep-list. Repurposed tools stay reachable for OS/agency. Cut tools are retired from the public catalog, not deleted from the repo.
4. **The existing consumer-facing funnel and Tools Pro subscription — decided, then superseded by §26.** Originally recorded as "runs as-is, in parallel, untouched" — treated as legacy left alone while the new pivot builds elsewhere. §26 corrects that: the agency isn't legacy to leave alone, it's the third, permanent leg of this same NC service-business mission, and gets actively built out further, not just preserved.

### 25.8 What's scaffolded so far

- **[x] `ServiceBusinessProfile`** (`src/lib/service-business/profile.ts`) — one per `Org`, the eight-trade taxonomy above, NC service-area list, licensing/insurance/bonding flags, a collision-safe public marketplace slug (`getServiceBusinessProfileBySlug` — the lookup `/nc/[city]/[trade]/[slug]` pages in §25.5 will use), an `allowKnowledgeSharing` consent toggle, owner/admin-gated writes, audit-logged.
- **[x] `Customer`** (`src/lib/service-business/customer.ts`) — the unified customer profile inside a contractor's OS, org-scoped CRUD with archiving, sourced (`marketplace-lead`/`referral`/`direct`/`import`), audit-logged.
- **[x] `KnowledgeNote`** (`src/lib/service-business/knowledge.ts`) — always saved privately to the org; additionally indexed into a shared cross-account pool only if `allowKnowledgeSharing` was on at save time (revoking consent stops new sharing immediately without touching already-shared notes). `listSharedKnowledgeNotes` is an internal/ops reader only — it's explicitly not wired into any other tenant's agent context, since a raw note can carry one contractor's customer PII and injecting it into another contractor's AI conversation would be a real privacy leak, not just noise; a genuine anonymization/redaction step is separate, unstarted work.
- **[x] The CRM surface** — `/api/service-business/{profile,customers,customers/[id],knowledge}` routes and a `/crm` page (`components/service-business/crm-manager.tsx`): trades + knowledge-sharing consent, customer list/add/archive, and a knowledge-notes panel (manual save now; the repurposed `markdown-file-generator` chat tool, `lib/ai/tools/documents.ts`, produces the Markdown a contractor then saves here — same "generate in chat, save explicitly" pattern already used for reports/schedules elsewhere in this codebase). Linked from `/team`.
- **[x] `ServiceBusinessProfile.engagementType`** (§26) — `"self-serve" | "managed"`, defaults to self-serve, settable only via the platform-admin-gated `setEngagementType`/`POST /api/admin/service-business/engagement`, never by the org itself. `/crm` shows a "Managed by Launchabl" badge and note when set.
- **[x] `/os` and `/agency` pages** (§26.7) — the two dedicated pages of the target site architecture, linked from primary nav and each other, added to the sitemap. `/os` splits features into live vs. coming-soon honestly (§22.2's lesson applied to a feature list, not just a case study); `/agency` presents Launch + Managed Growth with a real contact path.
- **[x] `Lead` + monthly allotment** (`src/lib/service-business/lead.ts`) — consumer quote request, period-scoped counter per tier (`listing` 5 / `os` 25 / `os-plus` 80 / `managed` 200). Extra leads in a period are **held**, not downgraded — same quality, not delivered until allotment resets or the tier changes.
- **[x] `Job`, `Estimate`, `JobPayment`** — convert a lead into a customer+job, line-item estimates, record payment (cash/check/card/other). Stripe Checkout for a homeowner invoice writes the same `JobPayment` row (`metadata.kind = job_invoice`, at-most-once via `stripe:jobpay:{sessionId}`).
- **[x] Customizable storefronts** (`src/lib/service-business/storefront.ts`, `/os/storefront`) — Shopify-style theme (`classic` / `bold` / `workshop`), accent color, logo, cover, about, services, gallery, hours, CTA, section toggles, live preview. Public URL `/nc/[city]/[trade]/[slug]` plus short `/b/[slug]`.
- **[x] Marketplace landing pages + directory homepage** — `/`, `/nc`, `/nc/[city]`, `/nc/[city]/[trade]`, founding listings. Directory starts with three businesses the founder already knows: **Atlas Lot Care** (real) plus two founding-partner slots that rename in the storefront editor (no invented reviews).
- **[x] Revenue dashboard** — `/os/dashboard` (leads, jobs, estimates, allotment, cash collected, warranties due, low stock).
- **[x] Smart job scheduling** — `Job.durationMinutes` / `driveMinutes` / `address`, overlap detection per assignee, `/os/schedule`.
- **[x] `WarrantyRecord` + `InventoryItem`** — coverage dates and due-soon list; SKU/qty/reorder/cost with consume-that-won't-go-negative. `/os/warranty`, `/os/inventory`.
- **[x] OS automations + alerts** — org-scoped rules (`lead_followup`, `review_request`, `job_reminder`, `warranty_reminder`) on `/os/automations`, hourly cron `/api/cron/os-automations`. Distinct from `/automations` (SEO report schedules). Telegram Bot API + Resend email; iMessage is not a public API.

---

## 26. The third leg: the agency stays, on purpose, as the profitability answer

### 26.1 The correction

§25.7 Q4 treated the existing agency/Tools Pro subscription as legacy — something to leave running untouched while the "real" new work (marketplace + self-serve OS) got built elsewhere. The founder corrected that: the agency isn't a separate, tolerated legacy stream. It's the third, permanent leg of the exact same NC service-business mission, and it keeps getting built out — specifically as **heavier, more hands-on, done-for-you service**, sitting alongside (not instead of) the self-serve OS the founder already described (§25's agents/tools/automations/organization, subscribers running their own operation).

So the model is three legs, not two:

1. **Marketplace** — the lead engine (§25.1). Consumer-facing, SEO-driven, NC-first.
2. **Self-serve OS** — the subscription product (§25.1/§25.6). A contractor runs their own scheduling, CRM, estimates, automations, warranty tracking, staff, inventory, alerts, and payments, with AI agents assisting.
3. **Agency / managed services** — Launchabl's own team does the hands-on work *for* a contractor who'd rather pay for outcomes than run software: brand/site/profile setup, local SEO, ongoing marketing, and — as the OS matures — even running a client's OS on their behalf (drafting their estimates, following up their leads, keeping their schedule). This is this codebase's original DNA (§1's "unlimited service for one price" thesis) pointed permanently at the NC service-business vertical instead of at generic businesses.

### 26.2 Why this is the actual answer to "how does this get profitable"

Asked directly, and worth being blunt about it:

- **The marketplace has a cold-start problem, and no amount of good engineering fixes that faster than time and either capital or manual hustle.** A lead marketplace is worth nothing to a contractor until there's real lead volume, and worth nothing to a consumer until there's real contractor density and trust (reviews, listings). That's true of every two-sided marketplace ever built — Thumbtack and Angi both spent years and real money on exactly this before either side's network effects did any work on their own.
- **The self-serve OS has the standard SaaS ramp problem.** It needs to exist, be good, and be discovered before it generates meaningful subscription revenue — and self-serve products convert slowly without either strong inbound (which the marketplace is supposed to eventually provide) or a sales motion (which self-serve products don't have by definition).
- **The agency has neither problem.** It converts on contact, at a real price, using tools that mostly already exist (`local-seo-optimizer`, `schema-generator`, `brand-creator`, `brand-identity-kit`, the domain/hosting tools, and the `website-audit-report`/`landing-page-grader` free-tool funnel that already produces qualified leads). It is the one leg of this business that can generate real revenue this week, not after a build-out.

That's the case for treating it as permanent rather than incidental: it's not a distraction from the "real" pivot, it's what pays for the real pivot.

### 26.3 The bigger unlock: the agency is the marketplace's bootstrapping mechanism, not a separate business

This is the part worth being deliberate about rather than running the agency and the marketplace as two unrelated motions that happen to share a codebase:

- **Every managed-service client becomes a real marketplace listing.** Onboarding a contractor into a "we'll set this up for you" engagement is the same work as onboarding them onto the marketplace (§25.2's repurposed brand/domain/SEO tools) — so agency sales *are* marketplace-supply sales. This solves the marketplace's cold-start problem on the supply (contractor) side directly, with a sales motion instead of waiting for organic self-serve signups.
- **Every managed-service engagement produces a real case study.** §22.2 already documented the cost of a fabricated case study (Riverside Roasters, Northstar Legal) and the fix (an explicit `illustrative` flag). Paying agency clients in the exact target vertical are the source of the real, attributable, non-illustrative case studies this project has been missing since §22.2 — a materially better position than either inventing more examples or waiting years for self-serve users to volunteer testimonials.
- **The agency is a natural feeder into the self-serve OS, not a dead end.** A managed client whose SEO/marketing engine is running well is exactly who should be offered "graduate to running your own operation on the OS, at a lower monthly cost than the managed retainer" — turning a one-time or retainer engagement into a recurring subscription relationship instead of a single payment with no ongoing product relationship (a real weakness of the original flat-fee-for-life model this document never fully resolved).

### 26.4 Proposed packaging (illustrative — confirm before treating as final, same as §25.7's other decisions)

- **Marketplace listing** — free or near-free profile + a share of free/allotted leads, to seed contractor density (supply side of §25.1's flywheel) without a purchase decision in the way.
- **Self-serve OS subscription** — tiered (§25.7 Q1's lead-volume tiers), the contractor runs their own operation.
- **Agency — "Launch"** — a one-time, flat-fee, done-for-you setup (brand, site, marketplace profile, local SEO/schema/GBP foundation): the direct descendant of the original $1,200-lifetime offer, scoped specifically to getting an NC service business fully set up and marketplace-ready.
- **Agency — "Managed Growth"** — an ongoing monthly retainer where Launchabl's team keeps running local SEO, content, and review generation for a contractor who doesn't want to self-serve the OS at all, with a built-in graduation path to the self-serve subscription once their engine is proven out.

### 26.5 Roadmap adjustment

§25.6's phased build order is unchanged for the marketplace/OS (Lead → Job → Estimate → payment → landing page → dashboard, then AI agents/scheduling, then retention features, then SEO scale-out) — this section adds a parallel, immediately actionable track rather than replacing that sequencing:

1. **Now, in parallel with Phase 3.0.** Package and start selling the "Launch" and "Managed Growth" agency tiers explicitly to NC home/local-service contractors, using tools that already exist. This doesn't wait on `Lead`/`Job`/`Estimate` or marketplace liquidity — it's sellable today.
2. **As each agency client is onboarded**, deliberately capture it as marketplace supply (a real `ServiceBusinessProfile` + listing) and, with the client's permission, a real case study — directly seeding §25.5's SEO pages with real density and §22's case-studies page with real, non-illustrative proof instead of more invented examples.
3. **Once the self-serve OS (Phase 3.0/3.1) is far enough along**, offer it as the graduation path for agency clients whose engine is running well. **Corrected per §26.6 Q2 — the agency is not constrained to only the self-serve OS's tools.** It runs like a real agency: a bigger suite of tools and resources than what's exposed to self-serve subscribers, human-delivered, because a real agency does things (manual design, direct consultation, deeper competitive work) the AI-tool suite alone doesn't cover. The software's role here is dual, not singular: it's the OS product *and* a lead engine that feeds the agency's own sales pipeline — a business found through the free-tools funnel or the marketplace that isn't ready to self-serve is exactly who the agency should be selling to.

### 26.6 Founder decisions

1. **Managed-tier structure — decided, prices published.** Launch is **$1,200** one-time (the lifetime-plan descendant). Managed Growth starts at **$497/month**. Multi-location or unusual trades still get a custom quote on top of that floor. OS lead-volume tiers published alongside: listing (free, 5 leads), OS ($49/mo, 25), OS Plus ($149/mo, 80), Managed (200 leads, included in the retainer).
2. **Who delivers it — decided.** The agency runs like a real agency, not "the self-serve tools operated by an employee instead of the client." It uses a bigger suite of tools and resources than the self-serve OS exposes, delivered by people. The platform's software is explicitly both a revenue engine (subscriptions, retainers) and a lead engine (the free-tools funnel and the marketplace itself feed the agency's own sales pipeline, not only self-serve signups).
3. **Public positioning — decided, with a specific target structure (§26.7).** Not "rewrite everything now" — a specific site architecture to build toward: the brand presents primarily as the marketplace/directory, with dedicated pages for the OS and the agency, and CTAs for both placed along the marketplace landing page.
4. **Sourcing — decided, narrowed in §31.** The next agency clients are NC home/local-service contractors. Hunt the **repeat** trades (lawn, cleaning, HVAC membership, junk removal), not every slug on the directory. Still seed the marketplace (§26.3) — not the agency's existing broader clientele.

### 26.7 Site architecture, target state

The decided identity: **the brand presents primarily as a directory/marketplace**, not as a horizontal "tools + agency" site. Dedicated pages exist for the other two legs, with calls-to-action for both surfaced on the marketplace landing page itself:

- **Homepage → the marketplace/directory.** Shipped. The homepage is the NC directory, seeded with the three founding listings, with CTAs for the OS and the agency along the page. `/os` and `/agency` stay dedicated pages.
- **`/os` — shipped this round.** A dedicated page for the self-serve OS, honestly split into what's live vs. still later (AI-drafted estimates as a real agent workflow, iMessage as a Messages provider). Scheduling, automations, warranty, inventory, Telegram/email alerts, payments, and the dashboard are live.
- **`/agency` — shipped this round.** A dedicated page for Launch + Managed Growth, scoped to the launch trades (repeat trades first, §31), with a real contact path (not a fake form) and an explicit note that agency clients get OS access included and can self-serve at any time.
- Both are linked from primary nav now (`OS`, `Agency`) and cross-link each other, ahead of the homepage rebuild — CTAs "along the landing page" become real once the homepage itself is directory-first.

---

## 27. Brutally honest: CRMs, field-service software, and Angi-class directories

§18–§22 asked whether a horizontal AI-tool suite is a company. §23–§24 narrowed to home services. §25–§26 named the actual product: marketplace + OS + agency, NC-first. This section is the competitive picture for *that* product, against the three buyers we actually lose deals to — generic CRMs, service-business / field-service platforms, and consumer directories (Angi’s List / Angi, Thumbtack, Nextdoor). It is not a feature-gap list to close. It is a decision about which gaps are the business and which gaps are a trap.

### 27.1 The one-line verdict

We are not a unicorn today, and we will not become one by matching ServiceTitan’s dispatch board or Angi’s review graph. Those categories already have winners. The only shape that is both **defensible** and **scalable** is the one incumbents do not sell as a bundle: **exclusive demand in a bounded geography + public proof that can only exist because the job ran through the OS + an agency that seeds real supply this week.** Everything we add should reinforce that triangle. Everything that dilutes it (shared leads, invented stars, paid directory placement, a national empty map, FSM feature-parity) is how this becomes a worse Jobber or a smaller Angi.

### 27.2 Three competitor classes, named

These are not the same buyer or the same budget line. Treating “CRM vs Angi vs Jobber” as one comparison is how a pitch slides into mush.

**1. Generic CRMs (HubSpot, Salesforce, generic “pipeline” tools).**
A CRM is a system of record for *conversations and deals*. A lawn or HVAC company does not have a deal stage problem; they have a who-is-on-the-truck, did-the-job-finish, and where-does-the-next-lead-come-from problem. HubSpot will beat us on email sequences, attribution, and enterprise reporting for as long as it exists. That is fine. We should never pretend the OS is a HubSpot replacement. The honest CRM slice we own is **narrow and vertical**: one customer record tied to leads, jobs, estimates, warranties, and invoices for an NC trade. Switching cost here is the job history, not the marketing automation. If we start adding generic pipeline stages, lead scoring, and email-drip builders, we are competing where HubSpot has twenty years of surface area and we have none.

**2. Service-business / field-service companies (Jobber, Housecall Pro, ServiceTitan, Workiz, FieldPulse, plus AI-native Feldy / FieldCamp / Roooster).**
This is the real software competitor for the OS leg. They already own scheduling, quoting, invoicing, and (at the high end) dispatch and telephony.

- Jobber’s published 2026 ladder starts at **$39/mo** (Core, 1 user) and runs to **$599/mo** (Plus, 30 users). Housecall Pro starts around **$69–$79/mo** and tops out near **$499+/mo**. ServiceTitan is quote-only and commonly **$300–$500 per technician per month**, plus **$5k–$25k** implementation. A 10-tech shop’s year-one all-in is on the order of **~$3.3k** on Jobber/HCP versus **~$55k–$90k** on ServiceTitan ([Field Service Software Pricing Index (2026) — Bigger Wrench](https://biggerwrench.com/field-service-software-pricing/); [Best FSM Software (April 2026) — Field Service Guide](https://fieldserviceguide.com/best-field-service-management-software/)).
- Concentration is ugly if the plan is “beat them at FSM.” One 2025 HVAC breakdown puts Housecall Pro, ServiceTitan, and Thryv at **92%** of HVAC shops that already bought FSM software ([HVAC market breakdown — Orbital](https://www.withorbital.com/blog/hvac-market-breakdown-2025/smb-sales-hiring)). Treat that as directional (vendor-adjacent, not an SEC filing) — the point holds either way: the shops that want a full job-book already have one.
- The AI-native wave named in §23.3 (Feldy, FieldCamp, Roooster) is still **software sold to contractors who already have leads**. None of them run a consumer marketplace. That remains the opening.

**What we lose to them today, honestly:** mobile tech app, live dispatch, native VoIP / call tracking, pricebook depth, QuickBooks-class accounting, financing (Wisetack et al.), and years of review-request muscle. A five-tech shop comparing feature lists will pick Housecall Pro. We should not try to win that spreadsheet.

**What we have that they do not sell:** a consumer-facing directory that can put an exclusive quote on their phone, and an agency that will stand up the listing for them. Jobber does not generate the homeowner. Angi does not run the job. That split is the product.

**3. Directories (Angi / Angie’s List, Thumbtack, Nextdoor, Google Business Profile).**
This is the real marketplace competitor. Scale is not close:

- Angi reported **$238.2M** Q1 2026 revenue (−3% YoY) and **$248.0M** Q2 (−11% YoY); H1 2026 revenue was **$486.2M**. Q1 Network Revenue fell **56%** after “homeowner choice” in January 2025. The Q1 10-Q says consumers used Angi businesses for about **16 million projects** in the twelve months ended March 31, 2026, with about **105,000** average monthly active U.S. Pros ([Angi Q1 2026 earnings release](https://ir.angi.com/static-files/06de6d6b-b28c-4f42-8963-b69c58c0f817); [Angi Q1 2026 10-Q](https://www.sec.gov/Archives/edgar/data/1705110/000170511026000044/angi-20260331.htm); [Angi Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/1705110/000170511026000077/q22026earningsrelease.htm)).
- Angi still *sells the same homeowner more than once*. The current Angi Pro agreement says a Lead is “frequently… sent to several other Approved Pros,” and Angi Help says a project request is matched with **no more than five** pros ([Angi Pro Agreement](https://angiads.pactsafe.io/versions/69ea6d277b5696271a549a02.pdf); [Angi Opportunities and Leads FAQ](https://intercom.help/angi/en/articles/6221483-opportunities-and-leads-frequently-asked-questions)).
- That model has a regulatory scar. The FTC charged HomeAdvisor (d/b/a Angi Leads) in March 2022 with deceptive lead marketing — quality, source, match-to-trade/geo, and conversion-rate claims it could not substantiate — and finalized a consent order in April 2023 requiring up to **$7.2M** in redress ([FTC March 2022 complaint announcement](https://www.ftc.gov/news-events/news/press-releases/2022/03/ftc-charges-homeadvisor-inc-cheating-businesses-including-small-businesses-seeking-leads-home); [FTC April 2023 final order](https://www.ftc.gov/news-events/news/press-releases/2023/04/ftc-approves-final-order-against-homeadvisor-inc-deceptively-marketing-its-leads-home-improvement)).
- Thumbtack is a contact auction: the homeowner is shown a list and the pro pays per contact. Nextdoor is a neighborhood graph plus ads, not a dedicated exclusive-lead marketplace. Google Business Profile is the default “directory” every contractor already has — we will not out-rank Google by pretending to be Google.

**What we lose to them today, honestly:** liquidity (we have three founding listings; they have six figures of pros), review volume, brand, national SEO, and the habit of “just Angi it.” Empty city×trade pages are the product telling the truth. Inventing contractors to fill them would repeat §22.2 at marketplace scale.

**What we can win, if we keep the product law:** one request → one listing. No silent assignment to `listings[0]` on a city page. No paid rank. Reviews that cannot exist without a completed job in the OS. That is the opposite of Angi’s shared-lead + star-theater machine, and it is the thing their 2025 “homeowner choice” retreat accidentally admitted was the wound.

### 27.3 How we compare, without the pitch

| Dimension | HubSpot-class CRM | Jobber / HCP / ServiceTitan | Angi / Thumbtack | Launchabl today |
|---|---|---|---|---|
| Who the buyer is | Marketer / sales org | Contractor (software budget) | Contractor (lead budget) + homeowner | Same two sides, one NC account |
| Generates exclusive demand | No | No | No — shared / auctioned | **Yes, if we keep `Lead.exclusive`** |
| Runs the job book | Pipeline, not trucks | **Yes, deeply** | Thin or none | Thin OS — enough for the loop, not ST |
| Public proof of *completed* work | No | Private to the shop | Stars, often unbundled from a job | **OS-verified, or empty** |
| Paid directory placement | N/A | N/A | Core monetization | **Forbidden** — tiers buy volume, not rank |
| Agency that seeds supply | Services arm, generic | Rarely | Ads / sales, not ops setup | **Launch $1,200 + Managed $497** (§26) |
| Geography | Everywhere | Everywhere | National | **NC on purpose** |
| Scale of proof | Millions of seats | Category winners | $486M H1 / 16M projects | Three listings, one real named client |

Read that table as a warning, not a to-do list. The empty cells on our row are not “sprint backlog.” The filled cells on theirs are why cloning them is a death march.

### 27.4 What is actually missing (ranked by whether it is the business)

**Missing and it *is* the business — do these, in this order:**

1. **Liquidity in a handful of NC city×trade cells.** Greensboro lawn, Raleigh HVAC, Triad parking-lot. Density is the marketplace. SEO pages without contractors are honest and also worthless to a homeowner. The agency exists to fill those cells with real names (§26.3), not to write more landing-page copy.
2. **Completed-job volume that can be shown.** The review graph will lose to Angi for years. The substitute is a count of jobs that actually closed in the OS, plus reviews that required a `reviewToken` minted only on `completed`. Empty is allowed. Fake 4.8 is not.
3. **A reason a contractor cannot casually leave.** Not a contractual lock-in — a *public* one: the verified-work badge and job-tied reviews live on the listing because the work ran here. Leave, and that public record does not come with you. That is the switching cost that also helps the homeowner.
4. **Real case studies past Atlas Lot Care.** §22.2 still applies. Agency clients are the only honest factory for them.

**Missing and it is *not* the business — do not build these to “catch up”:**

- Full dispatch, capacity planning, membership/pricebook, native VoIP, tech GPS. ServiceTitan already won that buyer.
- Star widgets, imported Google reviews, “seeded” testimonials, or any public rating that is not attached to a completed job.
- A shared-lead or “broadcast to three pros” mode to juice GMV. That is Angi. It also walks back toward the FTC fact pattern we should be the opposite of.
- Paid “featured” slots on `/nc/[city]/[trade]`. Tiers already buy allotment (§25.7). Selling rank would make the directory a worse Yellow Pages and kill the verified-work sort.
- National expansion before a city×trade is actually dense. An empty map of America is vanity SEO.
- Horizontal CRM features (sequences, lead scoring, territories) aimed at beating HubSpot.
- Tool #52.

### 27.5 The unicorn / moat / scale test

A unicorn here is not “the AI Jobber.” It is **the default exclusive way an NC homeowner hires a trade, and the default OS that trade runs because that is where the work and the proof already live.** Defensibility and scale have to be the same mechanism, or the moat is a sales team.

**Moat that compounds (keep, reinforce, measure):**

1. **Exclusive lead as a type, not a slogan.** `Lead.exclusive` is always `true`. `submitLead` accepts one `listingSlug`. The marketplace POST returns `{ exclusive: true }`. City×trade pages do not own a quote form. A homeowner can still walk to another storefront and send a *second* request — we are not locking people — but *we* never fan one request to a list. Angi’s contract does. That difference is the brand.
2. **Reviews require a completed job.** No token, no review. Token is minted only when status becomes `completed`. One review per job. Automation copy carries `/review/{token}`. This is how §22.2 never recurs at directory scale.
3. **Directory rank = verified work, never money.** `listDirectory` sorts by `proof.completedJobs`, then name. Founding-partner slots are a bootstrap, not a forever #1. This is the opposite of Angi lead-guidance-by-review-count and the opposite of paid placement.
4. **Agency as the cold-start, not a side hustle.** Launch + Managed Growth turn cash this week into listings and case studies. That is the only scalable answer to “how do you get the first ten real contractors in Greensboro lawn.”
5. **NC density before geography.** Repeat the city playbook (agency seed → exclusive demand → OS jobs → public proof → SEO) in the next NC city only after the first cell is real. That is how a state becomes a moat instead of a thin national directory.

**Scale that does *not* require a 200-person sales org:**

- Programmatic `/nc/[city]/[trade]` pages already exist; they get valuable when the listings on them are real.
- Subscriptions buy *volume* of the same exclusive lead, not a worse lead. Held leads are overflow, not junk (§25.3).
- The OS loop (lead → customer → job → invoice → review) is software. Each completed job is a public asset. That is a flywheel a shared-lead marketplace cannot copy without giving up their take-rate.
- We will still lose on mobile/dispatch forever for 25-truck shops. Let ServiceTitan have them. The $49 OS is for the shop Angi burned and Jobber overcharged for software that does not bring the phone.

**What would make this *not* a unicorn, even if it grows:**

- Becoming a lead reseller with a thin OS skin.
- Becoming an FSM clone with a thin directory skin.
- Raising on “51 tools” or “AI for contractors” after §22 already killed that story.

### 27.6 What this round shipped to make the laws real

- **`Lead.exclusive: true`** on every write; `getLead` re-asserts it so older rows cannot drift. Marketplace API returns `exclusive: true`.
- **City×trade pages no longer POST a quote to `listings[0]`.** The form lives on the storefront. Copy says so.
- **`CustomerReview` + `/review/[token]` + `POST /api/marketplace/reviews`.** `submitJobReview` requires a completed job’s token. Jobs mint `reviewToken` only on `completed`.
- **`listing.proof`** — `{ completedJobs, reviews }` — on every public listing. Empty is rendered as empty. Listing cards show a completed-job badge only when the count is > 0.
- **Directory sort by completed jobs.** No paid-placement field exists.
- **`/how-it-works`** — public, indexed, linked from nav, footer, homepage, and city×trade pages. Says we are smaller than Angi and thinner than ServiceTitan on purpose.
- **Tests** in `moat.test.ts`: exclusive lead, reject review without a completed-job token, complete → token → review → proof counts, verified-work rank beats a founding listing with zero jobs.

### 27.7 What this document will not pretend

We have not beaten Angi, Jobber, or HubSpot at anything that shows up in their board decks. We have a product law and a three-listing directory. The work that makes the law valuable is agency sales into NC trades and completed jobs in the OS — not another strategy section, and not another FSM module.

**Sources:**
- [Field Service Software Pricing Index (2026) — Bigger Wrench](https://biggerwrench.com/field-service-software-pricing/)
- [Best Field Service Management Software (April 2026) — Field Service Guide](https://fieldserviceguide.com/best-field-service-management-software/)
- [HVAC market breakdown 2025 — Orbital](https://www.withorbital.com/blog/hvac-market-breakdown-2025/smb-sales-hiring)
- [Angi Q1 2026 earnings release (IR PDF)](https://ir.angi.com/static-files/06de6d6b-b28c-4f42-8963-b69c58c0f817) (May 2026)
- [Angi Q1 2026 Form 10-Q](https://www.sec.gov/Archives/edgar/data/1705110/000170511026000044/angi-20260331.htm)
- [Angi Q2 2026 earnings release](https://www.sec.gov/Archives/edgar/data/1705110/000170511026000077/q22026earningsrelease.htm) (Aug 2026)
- [Angi Pro Agreement (PactSafe)](https://angiads.pactsafe.io/versions/69ea6d277b5696271a549a02.pdf)
- [Opportunities and Leads: Frequently Asked Questions — Angi Help](https://intercom.help/angi/en/articles/6221483-opportunities-and-leads-frequently-asked-questions)
- [FTC charges HomeAdvisor with cheating businesses seeking leads](https://www.ftc.gov/news-events/news/press-releases/2022/03/ftc-charges-homeadvisor-inc-cheating-businesses-including-small-businesses-seeking-leads-home) (Mar 2022)
- [FTC approves final order against HomeAdvisor](https://www.ftc.gov/news-events/news/press-releases/2023/04/ftc-approves-final-order-against-homeadvisor-inc-deceptively-marketing-its-leads-home-improvement) (Apr 2023)

---

## 28. They don't care — what locals will actually use

§27 named exclusive leads, job-tied reviews, and verified-work rank as the moat. The founder was right to call that weak. Those are **constraints** (how we refuse to become Angi). They are not a reason a Greensboro homeowner or a two-truck HVAC shop opens this. Nobody hires a plumber because the lead is exclusive. Nobody switches off a notebook because reviews require a `reviewToken`.

This section replaces "what's unique" with "what they already do, and where we can sit in that path."

### 28.1 Homeowners do not adopt platforms

They adopt a person who will show up. The default path is Google, a Facebook group, a neighbor, or the contractor they already have. Housecall Pro's own 2025 homeowner survey (1,000+ U.S. homeowners) is the honest demand signal, and it is not about directories:

- **80%** say online booking influences who they hire; **80%** also say a professional website matters ([Housecall Pro 2025 Customer Service Report](https://www.housecallpro.com/resources/home-service-customer-service-report-trends-statistics/)).
- Industry write-ups of the same research: **62%** prefer booking home services online vs calling, and **78%** of those want to do it outside business hours; Jobber-cited research: **68%** want estimated pricing before they book ([Home Services Online Self-Service Booking 2026 Guide](https://ustechautomations.com/resources/blog/home-services-online-self-service-booking-how-to-2026)).

Treat vendor-sponsored numbers as directional, not scripture. The behavior is still obvious: a quote form is a hope someone calls back. A Saturday 9:00 slot is a decision. We were selling the hope.

They will never "use Launchabl." They will use **Atlas's booking link** the way they already use a Housecall Pro pay link without knowing the brand. The contractor is the distribution. If we ask the homeowner to join a new directory brand, we lose to Google every time.

### 28.2 Contractors do not adopt philosophy

They adopt something that makes the phone ring or gets them paid faster. A shop already on Jobber/Housecall Pro will not migrate for exclusive NC leads from a three-listing directory — switching cost is weeks of data and training ([FSM migration guides put small-shop cutovers in the 2–6 week range](https://www.fieldproxy.ai/resources/blog/fsm-migration-guide-switch-field-service-software)). Do not waste the next quarter trying to rip Jobber out of a 10-truck shop.

The actual OS buyer is the shop still on **paper, Google Calendar, and a Facebook page**: one owner, 2–8 jobs a day, invoices from a Word doc. They do not want a CRM. They want "the customer picked Saturday and I saw it on my phone." That is also the agency buyer: $1,200 for a page they can text, not for "marketplace supply."

### 28.3 The adoption loop that is not weak

1. **The public page is a calendar, not a brochure.** Weekday slots from the real job book. Starting price if they published one — never invented. A booked slot creates a lead that **cannot be held** (allotment holds are for quote requests; a Saturday on the book is work).
2. **`/b/{slug}` is what the contractor distributes.** Text after a call. Google Business Profile. Truck QR. Invoice. Neighborhood Facebook post *as the business*, not as Launchabl. This is how HCP/Jobber actually get consumer usage.
3. **Agency sells that loop, not "join our directory."** Launch = booking page live on Google + the OS behind it. Managed Growth = keep the page fed. Atlas Lot Care should be the first real send of the booking link to existing customers — one named client, no invented case study.
4. **SEO pages exist so the booking page is findable**, not so we can lecture about Angi. `/nc/greensboro/lawn-care` should say "pick a time," not "we don't sell you five ways."

Exclusive delivery and job-tied reviews stay. They are how we don't rot. They are not the homepage.

### 28.4 What this round shipped

- Public weekday booking against the real calendar (`booking.ts`, `/api/marketplace/bookings`). Overlaps and a slot lock prevent double-booking.
- Storefronts show **next opening** and **starting price** when those exist; empty stays empty.
- Booked slots always deliver (`mustDeliver`) — we do not tell a homeowner they're booked and then hold the lead.
- `/`, `/os`, `/agency`, `/how-it-works`, and city×trade copy lead with the booking loop.

### 28.5 Still missing, and it is not more software

- Atlas (and the next two founding partners) actually texting `/b/{slug}` to real customers.
- A starting price on services that have one — the contractor types it; we do not invent "$45 mows."
- Google Business Profile and Facebook as the place the link lives. That is agency labor, not a feature.
- SMS to the homeowner ("you're on the book Saturday 9am"). Email/Telegram to the shop exists; the customer confirmation is still thin.
- We will still lose after-hours emergency calls to whoever answers the phone. Booking is for scheduled work. Say that out loud.

**Sources:**
- [Housecall Pro 2025 Home Service Customer Service Report](https://www.housecallpro.com/resources/home-service-customer-service-report-trends-statistics/)
- [Housecall Pro 2025 report PDF](https://www.housecallpro.com/wp-content/uploads/2025/12/120425-Customer-Service-Report.pdf)
- [Home Services Online Self-Service Booking: 2026 Guide](https://ustechautomations.com/resources/blog/home-services-online-self-service-booking-how-to-2026)
- [Online Booking: What the Data Says — Runchey](https://www.runcheywebsites.com/blog/online-booking-for-contractors)
- [FSM Migration Guide — FieldProxy](https://www.fieldproxy.ai/resources/blog/fsm-migration-guide-switch-field-service-software)

---

## 29. DoorDash-style dispatch — ping the trade, first claim owns it

§28 shipped the OpenTable path: pick a specific crew and take a weekday slot. The founder then named the other loop locals already understand from DoorDash / Postmates: pick the **job**, not the vendor. We ping every available member in that city×trade. First one to claim it does the quote and the payment in one place.

That is not Angi. Angi **sells the same contact to several pros**. DoorDash **pings many, first accept owns fulfillment**. After claim the job is exclusive (`exclusiveAfterClaim: true`). We do not charge per ping.

### 29.1 Two consumer paths, both stay

1. **Dispatch (this section).** `/nc/{city}/{trade}` — “get this done.” Open offer, 2-hour window, first claim creates the lead + customer + job on that org. Homeowner stays on `/request/{id}` for quote and Stripe Checkout.
2. **Direct book (§28).** `/b/{slug}` or the storefront — “I want this crew.” Calendar slot, `mustDeliver`, no race.

A homeowner who already has a name should not be forced through a blast. A homeowner who just needs a Saturday mow should not have to interview three listings.

### 29.2 What “available” means today

`listAvailableCrews` only pings **published, org-backed** listings in that city×trade with `acceptingOffers !== false`. Founding listings (Atlas + the two placeholders) have `orgId: null`. They **cannot be pinged or claim**. That is honest, not a bug: there is no OS inbox to receive the job.

Cold start: a city×trade that only has founding rows can still create an offer. `pingedCount` will be **0**. The request sits until it expires. We will not invent a crew to take it.

### 29.3 Phone notifications, said honestly

Contractors asked for the ping on their phone and the full quote + transaction in one place.

- **One place** is shipped: claim → dollar quote → homeowner pays the same request URL.
- **Phone** today is Telegram and email (`sendOrgAlert`). iMessage is not a public API. Carrier SMS (Twilio) is not built. Do not put “we text every contractor’s cell” on the homepage until that exists. `/os/offers` is the inbox either way.

### 29.4 What this round shipped

- `offer.ts`: open → claimed → quoted → paid, 2-hour FCFS window, `setNx` claim lock.
- Public `POST /api/marketplace/offers`, `/request/{id}`, city×trade `DispatchForm`.
- Contractor `/os/offers` (claim + quote) and storefront `acceptingOffers`.
- Stripe Checkout on the offer; webhook `metadata.offerId` marks it paid.
- Tests: two Raleigh plumbing orgs both pinged; first claim wins; founding-only city pings 0; expired cannot claim.

### 29.5 Still missing

- SMS to the contractor’s cell. Telegram/email is what we can actually send.
- Founding partners claiming dispatch jobs — they need an org + published storefront first.
- After-hours emergency. A 2-hour board is for scheduled work, same limit as booking.
- We will still lose to whoever answers the phone on a burst pipe. Say that out loud.

---

## 30. How dispatch becomes a business — density, cash, and what not to copy

§29 shipped the DoorDash *loop*. This section is the DoorDash *business*, and why copying it would bankrupt us. The founder asked how to build this properly so it is actually profitable. The answer is not more software. It is one dense board, a cash offer that already exists, and a fee model crews will not flee.

### 30.1 The uncomfortable comparison

DoorDash can take **15% / 25% / 30%** of a delivery subtotal (Basic / Plus / Premier) because the ticket is a $20–$40 meal, the labor is interchangeable, and the same customer orders again this week ([DoorDash merchant pricing](https://merchants.doordash.com/en-us/pricing); [commission explainer](https://merchants.doordash.com/en-us/learning-center/delivery-commission); [2026 rate card](https://www.directorders.com/blog/delivery-app-commission-rates-2026)). Multi-unit operators report an effective all-in closer to the mid-20s once ads sit on top ([OPA Delivery Fee Index, Apr 2026](https://opalink.com/blog/restaurant-delivery-fee-benchmarking-what-multi-unit-operators-actually-pay-in-2026)).

A Saturday mow is not that. LawnStarter’s completed-job average was **$53.59** nationally in 2025; most residential cuts sit **$43–$70** ([LawnStarter cost study](https://www.lawnstarter.com/blog/studies/lawn-care-costs/); [LawnStarter price guide](https://www.lawnstarter.com/blog/cost/lawn-mowing-price/)). Housecall Pro’s 2026 pro guide puts a standard visit at **$45–$90**, most quarter-acres **$50–$55** ([How much to charge for lawn mowing](https://www.housecallpro.com/resources/how-much-charge-lawn-mowing/)). GreenPal’s latest 30-day U.S. average is **$44.37** ([GreenPal newsroom, Mar/Apr 2026](https://www.yourgreenpal.com/newsroom/average-cost-of-lawn-mowing-us-greenpal-report)).

Do the take-rate on that ticket:

| Cut | On a $55 mow | What the crew sees |
|---|---|---|
| DoorDash Premier (30%) | $16.50 | They delete the app |
| LawnStarter-class (15–20%) | $8–$11 | Same fight GreenPal runs ads against |
| GreenPal-class (5%) + Stripe ~2.9% | ~$4.40 + ~$1.60 | Survivable *after* the job is paid on-platform |
| Angi/Thumbtack shared lead | $25–$75 *before* anyone mows | The FTC already burned HomeAdvisor for this (§27) |

Angi commonly bills **$40–$60** per shared lead (often 3–4 other crews on the same contact). Thumbtack is typically **$25–$75** to respond, 4–5 competitors ([Angi vs Thumbtack 2026](https://www.reviewsell.com/blog/angi-vs-thumbtack-vs-bark-leads-2026/); [Thumbtack help: pay for leads](https://help.thumbtack.com/article/pay-for-leads); [Pipeline On lead-cost ranges](https://pipelineon.com/blog/how-much-does-thumbtack-charge-per-lead/)). Close rates on shared leads are ugly; cost per *booked* job is what wrecks a two-truck shop.

**Product law:** we already refused per-ping and shared contacts (§27, §29). Do not reintroduce them as “the profitability plan.” A 20% cut of a $55 mow is the same betrayal with nicer UX.

The closest honest comps are **GreenPal** (about **5%** on completed jobs, bidding free, Stripe payouts, then they nag the homeowner into a weekly route) and **LawnStarter** (up to **~20%** — and vendors complain) ([GreenPal vendor handbook](https://www.yourgreenpal.com/vendor-handbook/getting-started-and-completing-work); [GreenPal on LawnStarter commissions](https://www.yourgreenpal.com/blog/lawnstarter-and-lawn-love-have-high-commission-rates); [LawnStarter fee writeup, Jul 2026](https://bobby.app/compare/lawnstarter-fees)). GreenPal’s real trick is not the first mow. It is the **route**.

### 30.2 What actually pays this company

§26 already named it. Repeat it so we do not “optimize the marketplace” and starve:

| Leg | Published price | When it is cash | Role |
|---|---|---|---|
| Agency Launch | **$1,200** one-time | This week, on a signed SOW | Setup + a real org on the board |
| Agency Managed Growth | **$497**/month | This month, if they stay | Human SEO/reviews; includes 200 leads |
| Self-serve OS | **$49** / **$149** | After a crew is claiming jobs | Board access + the job book |
| Free listing | $0 / 5 leads | Never the P&L | Density bait only |
| Dispatch take-rate | **$0 until paid jobs exist** | Later, and small | Optional 5% *after* Stripe Checkout, never on a ping |

Jobber Core is **$29–$49**/mo. Housecall Pro Basic is **$59**/mo annual / **$79** month-to-month. Neither generates a lead ([Jobber pricing comparison](https://www.getjobber.com/comparison/jobber-vs-housecall-pro/); [Housecall Pro pricing](https://www.housecallpro.com/pricing/)). Our $49 OS is not cheap software. It is **cheap software plus the ping**. That is the only reason a shop still on paper pays us instead of Jobber.

Honest P&L before density (the only P&L that can exist in 2026 for this repo):

- **2 Launch** = $2,400. Pays Twilio, a month of Google/Facebook tests in one city, and the founder’s time to stand up two storefronts.
- **3 Managed** = $1,491/month. That is a micro-business. Ten Managed is $4,970/month. That is a company. Dispatch GMV does not have to appear on this line yet.
- **Marketplace take on 80 mows × $55 × 5%** = $220. Do not build a finance org around $220.

Agency clients **are** marketplace supply (§26.3). If Launch does not produce an org-backed, `acceptingOffers: true` storefront, we sold a brochure. Atlas Lot Care is the only named real client (§22.2). Parking-lot work is low-frequency. It is a case study, not the liquidity proof.

### 30.3 The wedge — one city, one trade, until the board is real

Greensboro lawn-care today: founding listing, `orgId: null`, `pingedCount: 0`. That is not a marketplace. It is a form.

**Wedge (recommended, then widened in §31):** Greensboro first. Hunt **repeat** trades — lawn, cleaning, HVAC (the maintenance book, not the 2 a.m. no-cool), junk removal — not Atlas’s parking lots and not painting. Liquidity is still per city×trade: three claiming lawn crews does not make the junk board real. Do not open ten empty junk pages.

**Done looks like this, and only this:**

1. **≥ 3 published orgs** on that board who have Telegram *or* SMS on and will claim.
2. **≥ 70% of open offers claimed inside 30 minutes** during Saturday-morning hours. (The 2-hour window is a backstop, not the SLA.)
3. **Homeowner pays on `/request/{id}`** for the first job. Cash outside the page does not count.
4. **A second visit exists** — weekly/biweekly on that crew’s calendar (§28), not another blast. Dispatch is the first date. The route is the marriage.

Until those four are true, we do not add a second trade, a second city, a matching algorithm, or a consumer app. Expanding an empty board is how directories die.

How the three crews get there (not a feature list):

1. Sell **Launch** to two Greensboro lawn operators who are still on Facebook + Venmo. The deliverable is: live `/b/{slug}`, published storefront, on the ping board, Telegram or SMS working on the owner’s phone.
2. Atlas (or the founder) **manually sources the first 20 jobs** — existing customers, neighborhood groups, door hangers, a $500 Facebook test. SEO pages do not fill a cold board. People do.
3. Every Launch includes “you answer the ping.” If they will not claim, they are a website client, not supply. Refund the listing part; do not pretend.

### 30.4 Fee model that crews will keep

Keep §25.7: **subscription buys volume, never quality. No pay-per-lead. No charge per ping.**

Phase the money so it matches reality:

1. **Now — $0 take-rate.** Stripe processing only on homeowner Checkout. Crews keep the quote. We keep Launch + Managed + (soon) OS.
2. **When 3 crews are claiming — OS is the board pass.** Free listing can *see* the city page. Claiming requires `os` or `managed`. That is $49–$149 we can defend: Jobber does not ping the city.
3. **When 20+ jobs/month clear Checkout — optional 5% of paid dispatch jobs**, GreenPal-shaped, disclosed on the quote, never on a no-show. Recurring calendar bookings from `/b/{slug}` stay take-rate-free (that is how we steal the route from LawnStarter). If a crew hates the 5%, they can keep regulars on their link.

Do not ship (3) as code until (1) and (2) have real numbers. A take-rate switch with no volume is a scarecrow.

**Official numbers, seasonal calendar, and spend cap are in §35.** `lib/service-business/profit-model.ts` is the code that may not drift from that section.

### 30.5 What “build properly” means (ordered)

Software that is worth writing, in this order, and nothing else until the previous line has a user:

1. **Founding listings become orgs.** Atlas + the two partner slots cannot claim. Until they have `orgId` + published storefront, dispatch is demo-ware in those cities.
2. **A ping they will see in 60 seconds.** Twilio SMS to the owner’s cell, or a hard requirement that Telegram is installed during Launch. Email is not a dispatch channel. iMessage is still not an API.
3. **On-shift, not a checkbox.** `acceptingOffers` is a preference. “Available Saturday 8–12” is the product. A crew that is on a job should not get the ping. That is a schedule read we already have (`/os/schedule`).
4. **Pay-in is the moat.** Quote → Checkout → `markOfferPaid` is already the transaction. Complete the job in the OS → review token. That is the only review that may appear on the city page.
5. **Route conversion.** After paid, one button: “put them on weekly.” That is GreenPal’s actual business, and it is our §28 calendar, not a new marketplace.

Explicitly not next: native app, ML matching, eight-trade statewide scale-out, Jobber feature parity, national brand ads, charging homeowners a “trust fee.”

### 30.6 What this document will not pretend

- We are not DoorDash. We will not have dasher-density or 15–30% take in this vertical.
- We are not Angi. Shared leads are the thing we exist to not be, including when we are broke.
- SEO will not fill the first board. Agency sales and the founder’s phone will.
- Atlas as a named client does not equal a liquid lawn board.
- Profitability in the next stretch is **3–10 Managed retainers and a handful of Launch checks**, not GMV.

If those retainers do not sell, the marketplace is a hobby. Build the sales motion (NC lawn, Greensboro first) with the same seriousness we built `offer.ts`.

**Sources:**
- [DoorDash merchant pricing](https://merchants.doordash.com/en-us/pricing)
- [DoorDash commission explainer](https://merchants.doordash.com/en-us/learning-center/delivery-commission)
- [Delivery app commission rates 2026 — DirectOrders](https://www.directorders.com/blog/delivery-app-commission-rates-2026)
- [OPA Delivery Fee Index, Apr 2026](https://opalink.com/blog/restaurant-delivery-fee-benchmarking-what-multi-unit-operators-actually-pay-in-2026)
- [LawnStarter lawn-care cost study](https://www.lawnstarter.com/blog/studies/lawn-care-costs/)
- [LawnStarter mowing price guide](https://www.lawnstarter.com/blog/cost/lawn-mowing-price/)
- [Housecall Pro: how much to charge for lawn mowing](https://www.housecallpro.com/resources/how-much-charge-lawn-mowing/)
- [GreenPal U.S. mowing average](https://www.yourgreenpal.com/newsroom/average-cost-of-lawn-mowing-us-greenpal-report)
- [GreenPal vendor handbook (5% + Stripe)](https://www.yourgreenpal.com/vendor-handbook/getting-started-and-completing-work)
- [GreenPal on LawnStarter/Lawn Love commissions](https://www.yourgreenpal.com/blog/lawnstarter-and-lawn-love-have-high-commission-rates)
- [LawnStarter fees for pros, Jul 2026](https://bobby.app/compare/lawnstarter-fees)
- [Angi vs Thumbtack vs Bark lead costs 2026](https://www.reviewsell.com/blog/angi-vs-thumbtack-vs-bark-leads-2026/)
- [Thumbtack: how much do I pay for leads](https://help.thumbtack.com/article/pay-for-leads)
- [How much does Thumbtack charge per lead — Pipeline On](https://pipelineon.com/blog/how-much-does-thumbtack-charge-per-lead/)
- [Housecall Pro pricing](https://www.housecallpro.com/pricing/)
- [Jobber vs Housecall Pro pricing](https://www.getjobber.com/comparison/jobber-vs-housecall-pro/)

---

## 31. Target repeat trades — HVAC, junk, lawn, cleaning. Not every slug.

§30 said Greensboro lawn-care because a weekly mow is the closest thing we have to a DoorDash habit. The founder is right that **lawn alone is too thin**. Hunt trades where the same buyer comes back, or where a property manager is a walking route. Do not hunt painting because the directory has a chip for it.

`junk-removal` is now a first-class trade. HVAC was already one. Cleaning was already one. The change is **what we sell Launch into**, and what the homepage leads with (`REPEAT_TRADES`), not a ninth empty promise.

### 31.1 What “repeat” actually means (do not flatten these)

| Trade | Repeat shape | Typical ticket | What we sell | What we do not pretend |
|---|---|---|---|---|
| Lawn care | Weekly / biweekly route | ~$45–$70 per cut (§30) | First mow on dispatch → calendar route | That one Saturday is the business |
| Cleaning | Weekly / biweekly house or office | Same shape as lawn | Same loop | One move-out clean is a project |
| HVAC | **Membership**: 2 tune-ups/year (spring AC, fall heat), $150–$500/yr, most shops **$200–$350**; members spend 3-year **~$3k–$4.5k** vs **~$700–$1.1k** without a plan ([Built on Tenth memberships](https://www.builtontenth.com/hvac-research/hvac-membership-pricing-maintenance-agreements); [Plyrium 2026](https://www.plyrium.com/academy/hvac/hvac-maintenance-agreements-pricing-2026)) | Diagnostic $75–$200; repairs often $150–$650 ([ticket sizes](https://www.builtontenth.com/hvac-research/hvac-average-ticket-size-by-job-type)) | Dispatch for “it’s 90° and the unit is dead” **only if a crew is on-shift**. The money is the plan on `/b/{slug}` | That we beat the shop that answers the phone at 2 a.m. |
| Junk removal | Residential **~80% one-time**; commercial / PM **recurring**. National haul ~**$241–$250**; commercial ~**$550**. One PM relationship is **3–10 jobs/month** ([Angi/Extra Space ~$250](https://www.extraspace.com/moving/guides/trends/how-much-does-junk-removal-cost/); [Deal Sheet industry notes](https://thedealsheet.co/industries/junk-removal); [PM turnovers](https://dropcurb.com/blog/commercial-junk-removal-cost-calculator); [3–10 cleanouts/mo](https://kickbackservices.com/grow-your-junk-removal-business)) | $150–$600 typical residential | Dispatch = first haul. Then the OS is the PM’s book | That homeowners junk-out every Saturday like they mow |

Pressure washing is seasonal (1–2×/year). Plumbing and electrical are mostly emergency — keep the pages, do not staff a sales week on them. Parking-lot is Atlas’s trade and low frequency. Painting is a project.

### 31.2 Agency list, not eight equal chips

Superseded in order by **§33**. Still true: three claiming crews are required **per city×trade** (§30.3). A liquid lawn board does not let us lie on `/nc/greensboro/junk-removal` or `/nc/greensboro/pest-control`. Selling Launch to an HVAC shop and a pest operator *in parallel* is allowed. Pretending four empty boards are a marketplace is not.

### 31.3 What this round shipped

- `junk-removal` in `TRADES` / sitemap / city×trade pages.
- `REPEAT_TRADES` + `tradesForPublicNav()` — homepage and city chips lead lawn, cleaning, HVAC, junk.
- `TRADE_REPEAT` + `tradeMarketplacePitch` — HVAC and junk pages say the honest second sentence (plan / PM book), not a copied mow pitch.
- CRM trade checkboxes read from the same list. No invented junk founding listing.

**Sources:**
- [HVAC maintenance agreement pricing 2026 — Built on Tenth](https://www.builtontenth.com/hvac-research/hvac-membership-pricing-maintenance-agreements)
- [HVAC maintenance agreements 2026 — Plyrium](https://www.plyrium.com/academy/hvac/hvac-maintenance-agreements-pricing-2026)
- [HVAC average ticket by job type](https://www.builtontenth.com/hvac-research/hvac-average-ticket-size-by-job-type)
- [How much does junk removal cost — Extra Space](https://www.extraspace.com/moving/guides/trends/how-much-does-junk-removal-cost/)
- [Junk removal industry notes — The Deal Sheet](https://thedealsheet.co/industries/junk-removal)
- [Commercial junk / apartment turnover costs — Dropcurb](https://dropcurb.com/blog/commercial-junk-removal-cost-calculator)
- [Growing a junk business / PM accounts](https://kickbackservices.com/grow-your-junk-removal-business)

---

## 32. Ranked repeat-purchase frequency (NC-flavored) + roadside / towing

The founder asked for two things: add **roadside assistance** and **tow truck drivers**, and rank **how often the same buyer comes back** across services — specifically in North Carolina.

These are different questions. Do not flatten them.

- **Household cadence** = visits or purchases per year *among people who already buy that service*. That is what this ranking is.
- **Market velocity** = how many pings a city produces in a week. Roadside and towing are high here and **low** on household cadence.
- **NC demand mix** = which trades stay busy because of heat, humidity, pollen, growth, or storms. Busy ≠ weekly-repeat. Roofing after a hurricane is a spike, not a route.

Pest is now in `TRADES` because §33 picked it as the fourth starting-lineup trade (requests + revenue). Pool still stays off the catalog — weekly cadence, thin Greensboro density.

### 32.1 How to read the table

Two published “how often” datasets disagree in useful ways:

- [Thumbtack’s Home Care Price Index](https://blog.thumbtack.com/thumbtack-relaunches-home-care-price-index-to-provide-deeper-insights-into-home-maintenance-trends-807200141331) is **recommended** cadence (what a home *should* buy), used to weight their cost index. House cleaning and lawn mowing are listed as **1×/month**; pest, gutters, windows, and “full-service lawn” as **2×/year**; pressure wash, carpet, chimney, tree, appliance/water-heater/AC maintenance as **1×/year**.
- [HIRI’s home-care survey](https://www.hiri.org/blog/home-care-and-maintenance-services) is **actual purchases among buyers** (2019): lawn/landscaping **8.9 purchases/year** (~$66 each), pest **3.1**, HVAC **1.4**. That is the closest public “repeat purchase frequency” we have for US homeowners. It is national, not NC.

NC overlays, not substitutes:

- [NC State Extension lawn calendars](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar) — Piedmont tall fescue is mowed often enough that late spring is **every 5–7 days**; warm-season Bermuda/zoysia grow hard through the humid summer and are cut until frost. A weekly pro route Mar–Oct/Nov is **~30–40 cuts**, not Thumbtack’s 12.
- [Elev8’s 2026 NC home-services notes](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026) — Charlotte/Triangle growth keeps HVAC, remodeling, and electrical busy; heat + humidity support HVAC, pest, and pressure washing; hurricanes and inland flooding spike roofing, tree, water restoration, and generators. Use this for **which boards will have work**, not for visit counts. Greensboro/Triad leads are cheaper ($26–$75 LSA range on that page).
- Snow removal is effectively **N/A** for most of the state. Do not copy a Northeast route model.

Zipdo-style “2.1 roadside requests per vehicle owner” conflicts with AAA’s published call volume. Treat aggregator blogs as weak; use AAA’s own 2024 numbers.

### 32.2 Ranked by household / buyer cadence (highest first)

| Rank | Service | Cadence among buyers | NC note | In `TRADES`? |
|---|---|---|---|---|
| 1 | House / office cleaning | Among recurring customers, monthly is the modal book (~60%), biweekly ~33%, weekly ~7% ([Keepsake booking mix](https://keepsakepco.com/blog/how-often-should-you-get-your-house-professionally-cleaned/)). Industry write-ups also cite ~**2.3 pro visits/month** ([Gitnux](https://gitnux.org/house-cleaning-industry-statistics/)). Thumbtack recommends **1×/month**. | Year-round. Offices and move-outs are extra, not the route. | Yes — hunt |
| 2 | Pool service | Weekly in season; heat + pollen in the Carolinas often keep that weekly, not “every other week if you’re lucky.” | Strong in Charlotte / Triangle / coastal suburbs. **Not in the catalog this round.** | No |
| 3 | Lawn mowing / basic landscaping | Weekly or every 5–7 days in growth ([NC State tall fescue calendar](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar)). HIRI buyers averaged **8.9 purchases/yr** (many DIY the rest of the year). A professional weekly NC route is **~30–40 cuts** Mar–Nov. | The closest thing we have to a DoorDash habit. Dormant Dec–Feb except leaf/cleanup. | Yes — hunt |
| 4 | Dog walking / pet sitting | Daily or several times/week for the households that buy it. | Urban cores. Not a Launch trade. | No |
| 5 | Mobile car wash / detailing (membership) | Weekly–monthly if they buy a plan; otherwise 2–4×/year. | Complements roadside, is not roadside. | No |
| 6 | Pest control | HIRI **3.1 purchases/yr** among buyers. Routes are quarterly–monthly (4–12). Thumbtack’s index still lists pest as **2×/year** recommended — that is a floor, not an NC route. | Humidity + a long warm season support more pest work than the national average ([Elev8 NC](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026)). NC quarterly plans run ~**$400–$680/yr** ([NC pest pricing 2026](https://pestcontrolpricing.com/north-carolina-pest-control-cost/)). | Yes — hunt (§33) |
| 7 | Oil change / light auto service | Every ~5k–7.5k miles → **2–4×/year** per vehicle. | High market volume, shop-based, not our dispatch. | No |
| 8 | HVAC membership | **2 visits/yr** (spring AC, fall heat), typically $200–$350/yr; HIRI HVAC buyers **1.4 purchases/yr** including repairs (§31). | Heat + humidity make the AC half of the year the money. Hunt the **plan**, not 2 a.m. no-cool. | Yes — hunt |
| 9 | Gutter clean / window clean / “full-service” lawn (fert + weed, not mow) | Thumbtack **2×/year**. Gutters in leafy / stormy lots 2–4× ([Thumbtack gutter guide](https://www.thumbtack.com/guide/content/how-often-to-clean-gutters)). | Fall leaves + tropical remnants argue for the high end in NC. | Partial (lawn) |
| 10 | Pressure wash / carpet / chimney / tree trim / appliance & water-heater maint / dryer vent | Thumbtack **1×/year**. Carpet often 12–18 months. | Pressure wash is busier here because of pollen and mildew. Tree work spikes after storms. | Pressure wash yes; rest no |
| 11 | Plumbing / electrical / garage door / appliance repair | As-needed. Plumbers are the most-called home pro in several DIY-vs-pro surveys; electricians less often. Garage-door pro inspect **1×/year**, lube quarterly (often DIY). | Growth metros keep electricians busy (new construction + panels). Still not a weekly household. | Plumbing + electrical listed, not hunted |
| 12 | Junk removal | Residential **~80% one-time**; a property-manager account is **3–10 jobs/month** (§31). | Hunt PMs, not garage-cleanout Facebook ads. | Yes — listed; PM inbound |
| 12b | Courier / cargo van | Households almost never. A shop, warehouse, or lab that buys it wants **daily/weekly standing lanes** plus STAT when a job is down ([Dispatch Greensboro](https://www.dispatchit.com/company/locations/greensboro); [Carolina Quick Courier](https://www.carolinaquickcourier.com/)). | Same shape as junk: the *buyer* repeats. Not DoorDash. See §34. | Yes — listed, not hunted |
| 13 | Septic pump / inspect | Inspect **1–3 years**; pump **3–5 years** ([EPA](https://www.epa.gov/septic/how-care-your-septic-system)). | Rural / county NC, not the Triangle apartment. | No |
| 14 | Roadside assistance | AAA **>27 million** US calls in 2024, ~**7 million** battery ([AAA Apr 2025](https://newsroom.aaa.com/2025/04/aaa-urges-drivers-to-stay-proactive-on-auto-repair-and-maintenance/); [Tow Times](https://towtimes.com/aaa-received-over-27-million-calls-from-stranded-drivers-in-2024/)). ~**58 million** US members → **~0.47 calls per member-year**. Clubs cap Classic/Plus at **4 calls/year** — a ceiling, not the mean. | NC Memorial Day weekend alone was **~8,000** AAA calls ([AAA Carolinas](https://newsroom.acg.aaa.com/aaa-over-13-million-north-carolinians-to-travel-for-memorial-day-weekend/)). Holiday I-40/I-85/I-77 spikes. Household LTV is terrible unless the “customer” is a fleet, rental lot, or club overflow. | Yes — dispatch-native |
| 15 | Towing | ~**13 million** of those AAA calls were tows (~**0.22 tows per member-year**). Separate trade: hook-and-haul is not a jump-start. | Same NC highway spikes. Impound / repo / dealer lot is the repeat book. | Yes — dispatch-native |
| 16 | Locksmith (home / auto) | Once every few years per household; auto lockout is often billed through roadside. | Overlaps roadside; do not invent a third chip. | No |
| 17 | Moving | Once every few years per household. | College-town August spikes (Chapel Hill, Raleigh, Greensboro). | No |
| 18 | Water restoration / emergency roof tarp | Almost never — until a storm. Then it is the only board that matters for two weeks. | [Elev8](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026): coastal landfalls + inland flooding. | No |
| 19 | Painting / deck stain / parking-lot sealcoat / roof replace | Years between jobs (Thumbtack: deck stain every 2–3 years; duct clean 3–5). Sealcoat often 3–5 years. Roof replace is a decade-scale event unless a storm writes it off. | Atlas’s parking-lot trade stays listed because we already work it, not because it repeats. | Painting + parking-lot listed, not hunted |
| — | Snow / ice | Weekly in season up north. | **N/A** for most of NC. Do not staff a sales week on it. | No |

### 32.3 What we actually added

`roadside-assistance` and `towing` are first-class, **separate** slugs. A jump pack and a wrecker are different trucks, different licenses, different dispatch.

`TRADE_REPEAT` for both is **`dispatch-native`**: first truck claims (same DoorDash loop as lawn), but the city×trade pitch must say households need this rarely. The book worth selling Launch into is fleets, rental lots, and motor-club overflow — same shape as junk + property managers, not lawn + weekly route.

Public nav (`FEATURED_NAV_TRADES`): §33 starting lineup first (lawn, cleaning, HVAC, pest), then junk, then roadside/towing, then the rest, painting last. Do not pretend a household tows like they mow.

No invented roadside or tow founding listings. Liquidity is still per city×trade (§30.3). A liquid Greensboro lawn board does not let us lie on `/nc/greensboro/towing`.

### 32.4 Agency implication

Do **not** insert roadside/towing into the starting lineup. If a wrecker or roadside shop wants Launch, take the $1,200 — the OS and `/b` link still work. Do not spend a sourcing week on them until a fleet or lot is the buyer, or until three claiming trucks exist in one city.

Pest is the fourth starting-lineup trade (§33). Pool stays off the catalog.

**Sources:**
- [Thumbtack Home Care Price Index — recommended frequencies](https://blog.thumbtack.com/thumbtack-relaunches-home-care-price-index-to-provide-deeper-insights-into-home-maintenance-trends-807200141331)
- [Thumbtack — how often to clean gutters](https://www.thumbtack.com/guide/content/how-often-to-clean-gutters)
- [HIRI — home care and maintenance services (8.9 / 3.1 / 1.4 purchases)](https://www.hiri.org/blog/home-care-and-maintenance-services)
- [NC State Extension — tall fescue lawn calendar](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar)
- [Gitnux — house cleaning industry statistics](https://gitnux.org/house-cleaning-industry-statistics/)
- [Keepsake — how often customers actually book cleaning](https://keepsakepco.com/blog/how-often-should-you-get-your-house-professionally-cleaned/)
- [Elev8 — North Carolina home services statistics 2026](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026)
- [AAA — 27M roadside calls in 2024](https://newsroom.aaa.com/2025/04/aaa-urges-drivers-to-stay-proactive-on-auto-repair-and-maintenance/)
- [Tow Times — AAA 2024 call mix (13M tows, 7M battery)](https://towtimes.com/aaa-received-over-27-million-calls-from-stranded-drivers-in-2024/)
- [AAA Carolinas — NC Memorial Day (~8,000 calls)](https://newsroom.acg.aaa.com/aaa-over-13-million-north-carolinians-to-travel-for-memorial-day-weekend/)
- [EPA — septic inspect 1–3 years, pump 3–5](https://www.epa.gov/septic/how-care-your-septic-system)
- [NC pest control cost 2026](https://pestcontrolpricing.com/north-carolina-pest-control-cost/)

---

## 33. Starting lineup — most requests *and* most revenue

§32 ranked **how often the same household comes back**. That is not the same as “what we should sell first.” Requests (pings we can actually win) and revenue (Launch + Managed + later GMV) pull in different directions. The starting lineup is the overlap.

Two numbers we do **not** optimize for:

- **Raw market emergencies.** Roadside and towing produce the most stranded-driver calls in the state ([~8,000 AAA calls in NC on one Memorial Day weekend](https://newsroom.acg.aaa.com/aaa-over-13-million-north-carolinians-to-travel-for-memorial-day-weekend/)). Those calls already have a phone number: AAA, insurance, the shop on the exit. A new board with zero trucks captures none of them. High request *in the world* is not high request *on Launchabl*.
- **One fat ticket.** Painting, parking-lot, roof replace, and a 2 a.m. HVAC changeout look like revenue. They do not refill the board next Saturday. Atlas stays listed; it is not the lineup.

### 33.1 The scoreboard (existing catalog + pest)

Approximate **annual $ from one retained household** × **how often they generate a job we could dispatch or book**:

| Slot | Trade | Why it scores | Why it is not #1 alone |
|---|---|---|---|
| 1 | **Lawn — Greensboro** | Weekly Mar–Nov = 30–40 paid visits if they stay ([NC State](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar)). ~$45–$70/cut (§30) → **~$1,500–$2,500/yr** on a weekly route. Closest consumer habit to DoorDash. Triad leads are cheaper ([Elev8](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026)). | Quiet Dec–Feb. Small ticket. Need three claiming crews before the page is real (§30.3). |
| 2 | **Cleaning — Greensboro** | Highest household cadence we have — monthly is the modal book, weekly/biweekly common ([Keepsake](https://keepsakepco.com/blog/how-often-should-you-get-your-house-professionally-cleaned/)). Year-round, not a growing-season trade. Same dispatch → calendar loop as lawn. | More “I already have a person” than lawn. First request is still a Saturday we have to earn. |
| 3 | **HVAC — Greensboro / Raleigh** | Lowest visit count (2 tune-ups/yr) and the **highest contractor check**. Memberships $200–$350/yr; members spend **~$3k–$4.5k over 3 years** vs ~$700–$1.1k without a plan (§31). NC heat makes the AC half of the year the money. Shops can actually write a $1,200 Launch check. | Do not sell “we will be your 2 a.m. answering service.” On-shift pings + the plan on `/b/{slug}`. |
| 4 | **Pest — Greensboro** | HIRI buyers come back **3.1×/yr** ([HIRI](https://www.hiri.org/blog/home-care-and-maintenance-services)); NC humidity supports quarterly–monthly routes. Quarterly plans here run ~**$400–$680/yr** ([NC 2026 pricing](https://pestcontrolpricing.com/north-carolina-pest-control-cost/)). Recurring like HVAC, more visits than HVAC, cheaper than inventing a roadside network. | Termite bonds are a different sale. Hunt general-pest routes, not one wasp nest. |

That is the starting lineup. Four trades, **Greensboro first** (Raleigh only as the HVAC twin). Not eleven chips.

### 33.2 On the roster, not in the starting five

| Trade | Role |
|---|---|
| **Junk** | Revenue *if* the buyer is a property manager (3–10 jobs/month). Not a consumer-request engine. Sell it when a PM walk-in or a hauler already on Launch wants the OS. Do not spend the first sourcing month on Facebook garage cleanouts. |
| **Courier / cargo van** | Same shape as junk, on wheels. The buyer is a shop or warehouse, not a household. Listed. Not in the remaining-season hunt. See §34. |
| **Roadside / towing** | Listed. Dispatch-native. Take Launch if a fleet, lot, or three trucks walk in. Do not hunt. AAA already owns household requests. |
| **Pressure wash** | Seasonal NC pollen/mildew add-on for a lawn or exterior crew already on the board. Not a fourth Launch target. |
| **Plumbing / electrical** | Pages exist. Emergency, not a route. |
| **Pool** | Would rank #2 on cadence. Thin in Greensboro vs Charlotte / Triangle suburbs. **Stay off the catalog** until the four above have claiming crews. |
| **Painting / parking-lot** | Listed. Not hunted. |

### 33.3 What “start” means — two clocks

§30.3 still governs density. The annual scoreboard in §33.1 is not the hunt order for late 2026. See **§33.5**.

Cash this quarter is still Launch ($1,200) + Managed ($497/mo). The lineup is chosen so those clients (a) get repeat jobs and (b) seed boards people will ping again. A wrecker Launch is $1,200 once. A cleaning + HVAC + pest book is the OS they do not churn from in January.

### 33.4 What this round shipped

- `pest-control` in `TRADES` / sitemap / CRM. Pitch is the quarterly plan, same shape as HVAC membership.
- `REPEAT_TRADES` / `FEATURED_NAV_TRADES` follow the **remaining-season** order in §33.5: cleaning, HVAC, pest, lawn. Junk is no longer a hunt-list equal.
- No invented pest founding listing.

### 33.5 Remaining season — it is mid-September

The founder is right: we do not have a summer left. Today is mid-September 2026. Greensboro Airport’s average **first fall freeze is October 31**; High Point is November 1 ([NC State Extension freeze dates](https://gardening.ces.ncsu.edu/weather-2-2/average-first-and-last-frost-dates/)). Piedmont grass keeps growing until nightly lows sit under ~50°F — most years **late October / early November** ([Piedmont Triad fall lawn checklist](https://lawnlove.com/blog/fall-lawn-care-checklist-piedmont-triad/)). That is **six to eight weekly mows**, then leaf, then a dead board until March.

Do not prove the marketplace on Saturday mows through February. Do not wait until March either.

Two different “starts”:

| Clock | What we do | What we do not do |
|---|---|---|
| **Marketplace requests (next 90 days)** | Prove density on **cleaning** (year-round) and **HVAC fall heat tune-ups / memberships** (this is their Q4). Pest rides the same months — rodents move inside, last outdoor quarter. | Treat lawn dispatch as the live product after Halloween. Flip to roadside because Thanksgiving travel exists (AAA still owns those calls). |
| **Agency sales (this month)** | Sell Launch to lawn operators **now**. They have time, they are selling aeration / fescue overseed / leaf, and they need a `/b` link before March. Same week: cleaning + one HVAC shop. | Sit on lawn outbound until spring. A crew that buys in October and has no ping until April still churns if we promised Saturday volume. |

**Hunt / public-nav order until March:** cleaning → HVAC → pest → lawn. Annual scoreboard in §33.1 does not change — lawn is still the best *year* habit. It is the worst *winter* proof.

Concrete next 90 days, Greensboro:

1. **Cleaning to three claiming orgs** and a paid Checkout job. That board still has work in January. Until that is true, cleaning *is* the product we can show.
2. **HVAC Launch this month** — pitch the **fall heat tune-up + membership**, not no-cool. One GSO or Raleigh shop. On-shift pings only.
3. **Pest Launch** in parallel if the operator writes the check. Quarterly plans do not freeze on Oct 31.
4. **Lawn Launch** is a spring lock-in sale: last cuts, leaf, overseed, calendar for March. Do not staff a lawn-only Facebook test after the last mow. Do not claim `/nc/greensboro/lawn-care` is liquid because three crews exist and nobody is booking.

Pool closing is a two-week spike, then dead until April — still not a catalog add. Pressure wash is a leaf-and-pollen add-on, not a fourth target.

**Sources:**
- [NC State Extension — tall fescue lawn calendar](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar)
- [NC State Extension — average first/last freeze dates (KGSO Oct 31)](https://gardening.ces.ncsu.edu/weather-2-2/average-first-and-last-frost-dates/)
- [Lawn Love — Piedmont Triad fall lawn checklist](https://lawnlove.com/blog/fall-lawn-care-checklist-piedmont-triad/)
- [HIRI — home care purchase frequency](https://www.hiri.org/blog/home-care-and-maintenance-services)
- [Keepsake — cleaning booking mix](https://keepsakepco.com/blog/how-often-should-you-get-your-house-professionally-cleaned/)
- [NC pest control cost 2026](https://pestcontrolpricing.com/north-carolina-pest-control-cost/)
- [Elev8 — NC home services 2026](https://www.elev8operations.com/guides/north-carolina-home-services-statistics-2026)
- [AAA Carolinas — NC Memorial Day calls](https://newsroom.acg.aaa.com/aaa-over-13-million-north-carolinians-to-travel-for-memorial-day-weekend/)

---

## 34. Courier and cargo-van drivers who cannot live on DoorDash

The founder asked about van drivers and couriers who **cannot** do DoorDash or consumer deliveries. That is a real supply pool. It is not a new consumer habit, and it is not the remaining-season starting lineup.

### 34.1 Why they are locked out of food apps (even when the app says “vans OK”)

DoorDash’s public vehicle rules are loose — any car, no model year ([Dasher requirements](https://dasher.doordash.com/en-us/requirements)). Amazon Flex lists vans as eligible ([Flex requirements](https://flex.amazon.com/get-started/requirements/)). That is not the constraint.

The constraint is the **vehicle and the insurance**, not the signup form:

- A Transit / Sprinter / box van is sized and fueled for a **$75–$200 B2B run**, not a $6 burrito. Parking a cargo van at a drive-through for a $4 tip is how those drivers go broke.
- North Carolina cargo vans used for hire need a **commercial auto** policy; a personal policy does not cover for-hire freight ([NC cargo-van insurance](https://pegramonline.com/cargo-van-insurance-north-carolina/); [Insurance.com NC commercial auto](https://www.insurance.com/small-business/commercial-auto-insurance-in-north-carolina/)). Gig-app contingent liability is not cargo coverage.
- What they actually haul — HVAC compressors, auto parts, industrial pieces, legal pouches — is not a DoorDash SKU. Greensboro already has same-day **parts / hotshot** boards ([Dispatch Piedmont Triad](https://www.dispatchit.com/company/locations/greensboro); [Carolina Quick Courier](https://www.carolinaquickcourier.com/); [Reliable Couriers Greensboro](https://www.reliablecouriers.com/service-area/north-carolina/greensboro)). Hoffman and AIR Carolinas sit in this city with warehouses a tech cannot always leave a job to visit ([Hoffman parts](https://www.hoffman-hoffman.com/parts-and-warehouse/); [AIR Carolinas Greensboro](https://www.air-carolinas.com/parts)).

We do **not** claim STAT medical / chain-of-custody / pharma. That is a licensed courier world (temperature, USP, $100k+ cargo). Our pitch is shops and parts, not chemo.

### 34.2 Repeat shape — same as junk, not lawn

Households do not courier weekly. A body shop, HVAC contractor, or warehouse that buys a van **does** — daily or weekly standing lanes, plus a STAT ping when a job is down. Same-day is the premium layer in healthcare last-mile; next-day is still the volume ([US healthcare last-mile](https://www.mordorintelligence.com/industry-reports/united-states-healthcare-parcel-last-mile-delivery-market)). For us the analog is: first van claims the run, then the shop puts that driver on the book.

`TRADE_REPEAT` is **`dispatch-native`**. The city pitch must say the book is shops and parts counters, not “we are DoorDash without food.”

### 34.3 Where it sits on the roster

- **Listed.** `courier` is a first-class slug, separate from junk, roadside, and towing. A haul-away is not a parts run. A wrecker is not a cargo van.
- **Not hunted this quarter.** Remaining-season proof is still cleaning → HVAC → pest (§33.5). Courier does not freeze on Oct 31, which is why we list it — winter supply exists. It does not get a sourcing week until a parts house, HVAC shop, or three vans walk in.
- **Take Launch if they write the $1,200.** The OS and `/b` link are useful to a one-van operator who already has three shops on speed-dial. Do not promise we will fill a cold courier board from homepage chips.
- **No invented courier founding listing.** Liquidity is per city×trade. A liquid cleaning board does not make `/nc/greensboro/courier` real.

This is how we absorb drivers the food apps cannot pay, without becoming a food app.

**Sources:**
- [DoorDash Dasher vehicle requirements](https://dasher.doordash.com/en-us/requirements)
- [Amazon Flex delivery partner requirements](https://flex.amazon.com/get-started/requirements/)
- [Pegram — cargo van insurance in North Carolina](https://pegramonline.com/cargo-van-insurance-north-carolina/)
- [Insurance.com — NC commercial auto](https://www.insurance.com/small-business/commercial-auto-insurance-in-north-carolina/)
- [Dispatch — Greensboro / Piedmont Triad courier](https://www.dispatchit.com/company/locations/greensboro)
- [Carolina Quick Courier](https://www.carolinaquickcourier.com/)
- [Reliable Couriers — Greensboro](https://www.reliablecouriers.com/service-area/north-carolina/greensboro)
- [Hoffman Parts & Warehouse — Greensboro](https://www.hoffman-hoffman.com/parts-and-warehouse/)
- [AIR Carolinas parts](https://www.air-carolinas.com/parts)
- [Mordor — US healthcare last-mile delivery](https://www.mordorintelligence.com/industry-reports/united-states-healthcare-parcel-last-mile-delivery-market)

---

## 35. Official profit model — seasonal requests, seasonal cash, one spend cap

§30 named the legs. §33.5 said lawn dies after Halloween. This section is the **official** model so we do not staff January as if June mows still pay Twilio.

Two books, every month:

| Book | What moves | What we keep |
|---|---|---|
| **Requests** (homeowner / shop pings) | Follows Piedmont season. Lawn ~100 in June, ~8 in January. Cleaning stays ~90. HVAC has two membership windows (Mar–May AC, Sep–Nov heat). Pest shifts from outdoor to rodents; it does not freeze. | Almost nothing until density gates. Then **5% of paid dispatch only**. |
| **Revenue we can live on** | Inverse of how busy the *crew* is. Launch closes when operators have time (Oct–Feb). Managed is flat. OS sticks if the shop has a year-round book. | **Launch $1,200 + Managed $497/mo** is the floor. Forever, including July. |

Do not add those two columns together and call it “marketplace profit.” A dead lawn board in January is not a failed company if three Managed retainers are paying.

### 35.1 Piedmont request calendar (index 100 = that trade’s own peak)

Encoded in `lib/service-business/seasonality.ts`. City×trade pages show the current-month note so we do not advertise Saturday cuts in January.

| Trade | Winter (Dec–Feb) | Shoulder (Mar–Apr, Oct–Nov) | Peak (May–Sep) | What that does to *our* cash |
|---|---|---|---|---|
| Lawn | Dormant. Leaf leftover only. GSO first freeze **Oct 31** (§33.5). | First cuts / last cuts + overseed + leaf. | Weekly route. Closest DoorDash habit. | Dispatch GMV exists ~Mar–Nov. **$0 take assumed Dec–Feb.** Sell Launch in the quiet. |
| Cleaning | Still the modal monthly book. | Spring-clean bump. | Steady. | The winter *request* proof. Year-round OS. |
| HVAC | Heat repair, not tune-up volume. | **The money:** spring AC plan, fall heat plan ([NC HVAC timing](https://www.airtechnc.com/blog/hvac-maintenance-guide-2026); [Charlotte seasonal guide](https://www.callkodiakhvac.com/learning-center/maintenance/charlotte-hvac-seasonal-tips)). | AC no-cool overflow. Do not staff 2 a.m. as the product. | Fat Launch checks. Two membership campaigns per year. |
| Pest | Indoor / rodents ([Terminix Triad calendar](https://www.terminix-triad.com/about/nc-pest-calendar/)). Quarterly plans still bill. | Outdoor ramps up. | Mosquito / general pest. | Retainer-shaped. Does not need summer. |
| Junk | Slow households. | Spring cleanouts. | August college turnovers. | Cash if a PM is on the book. Not a winter consumer engine. |
| Courier | Shops still move parts. | Flat. | Flat + holiday freight. | Winter *supply* exists. Hunt a shop, not a homepage. |
| Roadside / tow | Batteries + holiday travel. | Quieter. | Memorial / July 4 / Thanksgiving / Christmas spikes. | World volume ≠ our volume. AAA owns households. |
| Pressure wash / painting / parking-lot | Off. | Pollen / sealcoat windows. | Exterior season. | Do not put take-rate or ad spend on these in January. |

Cleaning + HVAC + pest are the **year-round request mix**. Lawn is a **seasonal GMV spike**. Courier is a **year-round B2B side door**. Everything else is listed.

### 35.2 Official cash stack (do not reorder)

Code: `lib/service-business/profit-model.ts`. Prices come from `LEAD_TIERS` / `AGENCY_PACKAGES`. If a page and this file disagree, the file is wrong.

**Floor — must cover the month before we talk GMV** (names in §36: Build / Network / Run)

| Line | Price | When it counts |
|---|---|---|
| Build (Launch) | **$1,200** one-time | Closed this month. Best sold Oct–Feb when crews have time. |
| Network | **$99**/month | DoorDash seat. Recurring. 15 seats ≈ three Run retainers. |
| Run (Managed Growth) | **$497**/month | Every month they stay. **Includes Network.** Human SEO/reviews. **The winter floor.** |

**Growth — desk only, not the board**

| Line | Price | Gate |
|---|---|---|
| OS desk | **$49**/mo | Job book without pings. Claiming requires **Network** or **Run** (§36). |
| OS Plus | **$149**/mo | More quote-lead allotment. Still not a Network seat. |

**Bonus — never the plan**

| Line | Price | Gate |
|---|---|---|
| Dispatch take | **5%** of the quote | **3 claiming crews** *and* **20 paid dispatch jobs that month** on that board. Stripe ~2.9% is the processor, not our margin. |
| Calendar booking on `/b/{slug}` | **0%** | Always. That is how we steal the route. |
| Ping / shared lead | **$0** | Forbidden (§27, §29). |

A $55 mow at 5% is **$2.75** (`dispatchTakeUsd`). Eighty of those is **$220**. Three Managed is **$1,491**. Ten Managed is **$4,970**. The company is the retainer line. The take is a bonus on first dates.

### 35.3 The spend cap (how we stay profitable)

```
this month's ads + Twilio + founder cash out  ≤  Run MRR  +  Network MRR  +  Build closed this month
```

`monthlySpendCapUsd({ managedCount, networkCount, launchesClosedThisMonth })`. Network is the DoorDash seat (§36).

OS MRR and dispatch take are **not** in the cap. January will not have lawn take. A Facebook test that assumes June volume is how directories die.

Worked floors (same numbers as §30.2, now law):

| State | Cash in | Meaning |
|---|---|---|
| 0 Managed, 0 Launch | **$0 spend cap** | Do not buy ads. Sell Launch. |
| 2 Launch, 0 Managed | **$2,400** this month only | One-time. Do not hire as if it repeats. |
| 3 Managed | **$1,491**/mo | Micro-business. Winter-survivable. |
| 10 Managed | **$4,970**/mo | A company. Still $0 take-rate required. |
| 3 Managed + 20 paid $55 mows @ 5% | $1,491 + $55 | Nice. Not a reason to raise ad spend. |

### 35.4 Seasonal operating rules

1. **Never staff burn on lawn GMV after first freeze.** Dec–Feb dispatch take from lawn is modeled as **$0**.
2. **Never promise a lawn Launch Saturday volume in October.** Sell leaf, overseed, and March. Churn is a profitability event.
3. **Prove winter density on cleaning** (and HVAC/pest memberships). That is the board we can show in January.
4. **Sell Launch in the crew’s off-season.** Lawn operators in November have time. HVAC shops in March/September have a reason. Do not only sell when they are drowning.
5. **Two year-round trades with claiming crews before we depend on any take-rate.** Lawn alone is a seasonal business we do not own yet.
6. **Do not ship the 5% switch** until a real month has 20 paid dispatch jobs. A take-rate with no volume is a scarecrow (§30.4).
7. **Tools Pro / credit packs** remain a separate, small line. They do not fund Twilio for Greensboro lawn.

### 35.5 What this round shipped

- `seasonality.ts` — Piedmont request indexes + current-month note on `/nc/[city]/[trade]`.
- `profit-model.ts` — prices, gates, spend cap, winter floor. Tests refuse take-rate before 3 crews / 20 jobs, and refuse a spend cap on hope.

If we want to change a price, change `pricing.ts` and this section in the same commit.

**Sources:**
- [NC State Extension — freeze dates (KGSO Oct 31)](https://gardening.ces.ncsu.edu/weather-2-2/average-first-and-last-frost-dates/)
- [NC State Extension — tall fescue calendar](https://content.ces.ncsu.edu/tall-fescue-lawn-maintenance-calendar)
- [Air Tech NC — HVAC service timing 2026](https://www.airtechnc.com/blog/hvac-maintenance-guide-2026)
- [Kodiak — Charlotte HVAC seasonal guide](https://www.callkodiakhvac.com/learning-center/maintenance/charlotte-hvac-seasonal-tips)
- [Terminix Triad — NC pest calendar](https://www.terminix-triad.com/about/nc-pest-calendar/)
- [GreenPal vendor handbook (5% + Stripe)](https://www.yourgreenpal.com/vendor-handbook/getting-started-and-completing-work)

---

## 36. Build and Run — Network is the DoorDash seat

The founder asked for two things at once: **put a price on staying in the network**, and **pivot the company to the first build-and-run agency**, with the client/customer network included. Start with home services. Add medspas, dentists, and vets as booking businesses, not as Saturday-mow trades.

This supersedes the public names “Launch” and “Managed Growth.” The prices do not change except that **Network is now an explicit $99/month SKU**. The 5% take, the spend cap, and the seasonal calendar in §35 still hold.

### 36.1 Official offers

| Offer | Price | What they get | What they do not get |
|---|---|---|---|
| **Build** | **$1,200** one-time | Brand, site, booking calendar, OS, live profile. We stand the business up. | Ongoing pings. Build without Network is a brochure that can book on `/b`. |
| **Network** | **$99**/month | The DoorDash seat. City×trade pings. First claim owns the job. 40 quote leads/month. OS included to claim/quote/pay. | A fee per ping. Shared Angi contacts. Clinical records. |
| **Run** | **$497**/month | We run the front door (SEO, GBP, reviews, the book). **Network is included.** 200 leads/month. | A lock-in. They can take the OS over any time. |

Free **listing** stays. It cannot receive or claim pings (`hasNetworkSeat` is `network` or `managed` only). OS desk at $49 is software without the board.

Still forbidden: charge per ping, pay-per-lead quality tiers, 15–30% DoorDash restaurant take on a $55 mow.

### 36.2 Why $99, not $0 and not 25%

§30 said the OS becomes the board pass after three claiming crews. That left the DoorDash system unpriced until density — which means we would run Twilio for free listings. The seat is the product. $99 is:

- More than Jobber Core ($29–$49) because Jobber does not ping the city.
- Less than a single Angi/Thumbtack shared lead ($25–$75) in a slow week, and those leads are shared.
- Recurring, so January still pays when lawn GMV is $0 (§35).
- **15 Network seats = $1,485** ≈ the three-Run winter floor.

Run at $497 is the agency. Network at $99 is self-serve stay-in. Do not discount Network to $0 to “get density.” Density that cannot pay $99 will not pay a take-rate later.

### 36.3 Two shapes of “network” — do not flatten them

| Group | How demand moves | What we build | What we do not claim |
|---|---|---|---|
| **Home services** (lawn, cleaning, HVAC, pest, …) | DoorDash ping. First crew claims. | City×trade board + `/b` calendar + OS. | That we beat the shop that answers at 2 a.m. |
| **Local care** (medspa, dentist, vet) | Booking, recall, reviews, local search. | Front door: site, calendar, GBP, review cadence, directory listing. | HIPAA-covered charts. Dentrix, ezyVet, Aesthetic Record, or any EMR/PMS. We are not their clinic. |

Do **not** add `dentist` / `medspa` / `vet` to `TRADES` this round. Empty `/nc/greensboro/dentist` pages are the same lie as empty junk pages (§30.3). They live on `/agency` as who we will Build and Run. Hunt order for home services is still §33.5. Local-care outbound is a **second sales motion** after one home-services Run client is live — or if a practice writes the $1,200 first.

No invented medspa case studies (§22.2). Atlas is still the only named real client.

### 36.4 What this does to profitability

Spend cap now counts Network MRR:

`ads + Twilio ≤ Run MRR + Network MRR + Build closed this month`

The 5% take is still a bonus after 3 crews and 20 paid dispatch jobs. Calendar bookings stay 0%. A dentist Run client in January is as good as a cleaner Run client — better than a lawn Network seat with no mows.

### 36.5 What this round shipped

- `LEAD_TIERS.network` at $99. `hasNetworkSeat` gates pings and claims.
- Agency copy is Build / Network / Run. Vertical groups in `verticals.ts`.
- Tests: listing-only published crews are not pinged.

**Sources:**
- Jobber / Housecall Pro pricing already cited in §30.2
- Angi / Thumbtack lead ranges already cited in §30.1

---

## 37. Hunt where people ask — and no platform already owns the ask

The founder asked to focus on services people request a lot that **still do not have a software or platform established**. That is the Build-and-Run wedge. It does not rewind §33.5 (winter proof is still cleaning → HVAC → pest) or §36 (Build / Network / Run). It changes **who we sell the agency to** once the checkbook is open.

Do not read this as “no SaaS product exists.” In 2026 almost every trade has a landing page on [Jobber](https://www.getjobber.com/academy/housecall-pro-competitors/), a QuoteIQ SEO post, or a $29/mo CRM. That is not a platform. A platform is what the **customer already opens** (DoorDash, Rover, Handy, Wrench) or what the **category already lives in** (ServiceTitan for HVAC, Workiz for locksmiths, ServiceCore for dumpsters, Dentrix for dentists). If they still post “anyone know a guy?” on Nextdoor, the platform is not established.

### 37.1 The test (all five, or we do not call it white space)

1. **People ask often.** Household cadence (§32) or live Nextdoor/Facebook volume, not a founder hunch.
2. **No consumer app they already have.** Not DoorDash, Rover, Handy, Wrench/YourMechanic, AAA.
3. **No category-default OS.** Not ServiceTitan / Jobber / Housecall Pro as the shop’s actual system of record. Not Workiz for locksmith/garage/tow. Not ServiceCore for dumpsters/porta/septic. Not Dentrix / ezyVet / Booksy / Vagaro / Mindbody / Brightwheel.
4. **Work still arrives from Google, GBP, Nextdoor, Facebook.** That is the front door we Build and Run.
5. **We can stand them up without becoming their regulator.** No NFPA-certificate product. No EMR. No daycare compliance.

### 37.2 What people are actually asking for (August 2026)

[LeadHall](https://leadhall.com/blog/service-demand-report-2026-08-13) tracked **761,353** neighborhood requests in the 30 days to 13 Aug 2026 (mostly Nextdoor). **North Carolina was 6th** among states (**28,387**). **Charlotte was 4th** among cities (**5,996**).

| Rank | What they asked | Requests | Platform already established? | Our move |
|---|---|---|---|---|
| 1 | Landscaping | 29,013 | Yes — Jobber, GreenPal, LawnStarter | Keep the winter/spring lawn plan (§33.5). Do not pretend we invented lawn software. |
| 2 | Mover | 13,801 | Partial — Dolly, Bellhop, U-Haul in many metros | Take a Build check if a mover walks in. Do not hunt a moving board. |
| 3 | Cleaning | 12,096 | Yes — Jobber, Handy | Still the winter *marketplace* proof. Agency is not “first cleaner OS.” |
| 4 | Auto mechanic | 9,713 | Partial — shops + [Wrench/YourMechanic](https://wrench.com/faq/) (they claim 2,000+ cities, including NC) | Do not launch `/nc/greensboro/mobile-mechanic`. Independents can still buy Build. |
| 5 | Daycare | 8,379 | Yes — Brightwheel and the state | Out. Kids + licensing. |
| 6 | **Appliance repair** | **7,068** | **No.** Angi/HomeServe sell leads. There is no DoorDash and no ServiceTitan-default. | **Agency hunt #1 in this section.** Year-round. More Nextdoor asks than HVAC. |
| 7 | HVAC | 5,898 | Yes — ServiceTitan, Housecall Pro, Jobber ([2026 trade comparisons](https://www.constructionperks.com/blog/jobber-vs-housecall-pro-vs-servicetitan-2026)) | Keep for winter memberships. Not white space. |
| 8 | Junk removal | 5,786 | Partial — Workiz treats junk as an on-demand default ([Workiz vs Service Fusion](https://fieldservicesoftware.io/comparisons/service-fusion-vs-workiz/)) | Listed. PM inbound. Not a white-space story. |
| 9 | Electrical | 5,451 | Yes — same FSM trio as HVAC | Listed, not hunted. |
| 11 | Photographer | 4,208 | Partial — HoneyBook | Booking Build if they write $1,200. No city page. |

Appliance repair out-asks HVAC on the neighborhood board and has no established platform. That is the point.

### 37.3 Agency hunt list (not `TRADES`)

Ranked by (frequent ask) × (no platform) × (we can Build / book / later ping):

| Priority | Vertical | Why it passes | Shape | Do not claim |
|---|---|---|---|---|
| 1 | **Appliance repair** | LeadHall #6. Fridge/washer/dryer die year-round. Operators live on Nextdoor + a van. | Booking + later dispatch | That we are the next ServiceTitan. |
| 2 | **Mobile detailing / wash memberships** | §32 rank 5 (weekly–monthly if they buy a plan). Software is fragmented (QuoteIQ, DetailDeck, Urable — vendor roundups, not a consumer app). No NC DoorDash for a wash. | Dispatch-native once seated | That no detailing CRM exists. |
| 3 | **Exterior cluster** (pressure wash we already list, plus gutter / window / dryer vent) | Thumbtack 1–2×/year; NC pollen and leaves push the high end (§32). Jobber will *host* a gutter calendar. Homeowners still ask the neighborhood. | Add-on to a lawn/exterior Build | Empty `/nc/greensboro/gutter` pages. |
| 4 | **Commercial kitchen hood / grease trap** | Fire code is a recurring B2B ask (monthly–annual by cooking type). HoodOps/MyHoodClean are new specialist tools, not a restaurant’s default app. | Booking / route | NFPA 96 certificates, fire-marshal software, FOG manifests. |
| 5 | **Small-engine / outdoor power** | Every lawn household has a mower. Spring flood of “who can fix this?” RepairDesk/RepairShopr are counter POS, not a consumer board. | Booking, spring lock-in | That we beat the dealer shop. |
| 6 | **Standby generator service** | NC storms. Membership shape like HVAC. GenCore/GenaForce exist for dealers; most independents are still on a clipboard. | Membership booking | That we are Generac’s dealer OS. |

**Local care** (medspa, dentist, vet) stays §36.3 — booking only. Booksy/Vagaro/Mindbody *are* established for salons; Dentrix/ezyVet *are* established for charts. We sell the agency front door, not a clinic.

### 37.4 Forbidden to call “no platform”

| Category | Who already owns it | Why we do not pitch “first OS” |
|---|---|---|
| HVAC / plumbing / electrical | ServiceTitan, Housecall Pro, Jobber | The 2026 comparison pages are written for those three names. |
| Lawn / cleaning / pest / pressure wash | Jobber, GreenPal, FieldRoutes, Handy | We still sell Network + Run. We do not say they have no software. |
| Dumpster / porta / septic | [ServiceCore](https://servicecore.com/features/) | Purpose-built. Quote-per-truck. |
| Locksmith / garage door / tow / on-demand junk | [Workiz](https://www.workiz.com/industries/) (they claim 120k+ pros) | That *is* the established on-demand desk. |
| Mobile mechanic marketplace | Wrench / YourMechanic | They already take the job in many cities. |
| Beauty / wellness | Booksy, Vagaro, Mindbody | |
| Clinics | Dentrix, ezyVet, Aesthetic Record | |
| Pets | Rover, Wag | |
| Daycare | Brightwheel + DHHS | |

### 37.5 What this does to the next 90 days

- **Marketplace density** is still cleaning → HVAC → pest → lawn (§33.5). A liquid Greensboro cleaning board is how we survive January.
- **Agency outbound** adds appliance, detailing, and hood/grease-trap operators **now**. They have year-round or restaurant-night work. They do not need Saturday mows to pay $1,200 / $99 / $497.
- The founder asked to **put the first three on the public list.** `appliance-repair`, `mobile-detailing`, and `gutter-cleaning` (gutters + windows + dryer vents) are in `TRADES` and public nav. Pressure wash was already listed. Empty boards stay honest — no invented crews (§22.2).
- Still **not** in `TRADES`: `window-cleaning` as its own slug (bundled under gutter-cleaning), `kitchen-hood`, `small-engine`, `generator`, dentist / medspa / vet.

### 37.6 What this round shipped

- Third agency vertical group: **No-platform demand**.
- First three no-platform asks are public trades. Hoods and small engines stay agency-only.

**Sources:**
- [LeadHall — service demand 13 Aug 2026](https://leadhall.com/blog/service-demand-report-2026-08-13)
- [Jobber — Housecall Pro competitors / industry list](https://www.getjobber.com/academy/housecall-pro-competitors/)
- [Construction Perks — Jobber vs Housecall Pro vs ServiceTitan 2026](https://www.constructionperks.com/blog/jobber-vs-housecall-pro-vs-servicetitan-2026)
- [Workiz industries](https://www.workiz.com/industries/)
- [Service Fusion vs Workiz 2026](https://fieldservicesoftware.io/comparisons/service-fusion-vs-workiz/)
- [ServiceCore — porta / septic / dumpster](https://servicecore.com/features/)
- [Wrench FAQ — YourMechanic + 2,000 cities](https://wrench.com/faq/)
- Thumbtack / HIRI frequencies already cited in §32

---

## 38. The agency is the company — how we actually operate

§36 priced the seat. §37 named who we hunt. This section is the **operating model** so `/agency` is a firm, not three pricing cards and a mailto.

The founder asked to work the planned model **and** to stop shipping incremental catalog moves as if they were the idea. The idea is: **Nextdoor is the demand engine. The `/b` link is the product. Build/Network/Run is how we get paid. The marketplace is the perk that comes with the agency — not a second Angi.**

This does not rewind §33.5 (cleaning still has to prove January), §35 (spend cap, no per-ping, 5% gated), or §36 (prices). It changes **what Build includes**, **when a board is “open,”** and **when we are allowed to sell Run**.

### 38.1 Official operating rules

| Rule | Law |
|---|---|
| **14-day Build** | Live `/b` calendar, OS job book, and Network profile in **14 days**, or **Build is refunded**. Not “we’ll try.” |
| **90 days of Network with Build** | Complimentary seat through day 89. Day 90+ is **$99/month** or they leave. Solves empty-board density **without** making Network free forever (§36.2 still forbids $0 forever). |
| **Founding density** | A city×trade board is not open until **3 claiming crews** sit on it (`canOpenCityTradeBoard`). Empty stays honest. |
| **Run is a sit-promise** | We sell Run only where we will actually reply to that city×trade’s “anyone know a guy?” posts (`willSellRun`). One city, one trade per Run client until that loop works. |
| **Reply kit on day 1–2** | Nextdoor, Facebook, GBP scripts that **end on `/b`**. We write replies. **We do not scrape Nextdoor or LeadHall.** |
| **`/b` is distribution** | After every call, missed call, invoice, and neighborhood reply. More valuable than another OS feature. |
| **Winter hunt** | `cleaning → appliance-repair → hvac → pest-control → lawn-care`. Appliance sits with cleaning so January still has a board. Lawn is still the spring lock-in. |
| **Atlas is the proof** | [atlaslotcare.com](https://atlaslotcare.com) is the only named real client (§22.2). No invented shops. |
| **Spend cap unchanged** | Complimentary 90-day seats and Run-included seats are **$0 cash** (`billableNetworkMrrUsd`). Do not inflate the ad/Twilio cap with seats we are not collecting. |

### 38.2 Why 90 days, not free forever and not $99 on day 1

A Build with no seat is a brochure (§36.1). A seat at $0 forever is how we run Twilio for people who will never pay a take-rate. Ninety days is long enough to seat three Greensboro appliance or cleaning crews on one board. Day 91 they pay $99 or they are a listing. Density that cannot pay $99 will not pay 5% later.

Run at $497 already includes Network. Do not double-bill.

### 38.3 What “insanely better” means here (and what it does not)

Do:

- Sit on the threads the category already uses. Convert them with a booking link.
- Hand the operator a reply kit before the brand is pretty.
- Open one city×trade at a time.
- Film Atlas. One honest URL beats a logo wall.

Do not:

- Promise a Nextdoor/LeadHall scrape or a “neighborhood data product.”
- Promise Twilio SMS until it is built (alerts today are Telegram/email).
- Promise HIPAA/EMR, NFPA certificates, or clinic charts.
- Invent crews so a city page looks busy.
- Buy ads until this month’s Run + **paid** Network + Builds closed cover the spend.

The Run reply queue shipped in §39. Still next: a seated operator who brings crew two and three gets a month of Network credited.

### 38.4 What this round shipped

- `agency-model.ts` — 14-day SLA, 90-day included Network, founding-crew gate, Run sit-promise, reply kit, intake parser.
- `/agency` rebuilt as the operating page. `/agency/start` is a form a person reads (`POST /api/agency/intake`).
- `REPEAT_TRADES` / public nav put appliance next to cleaning.
- Profit helpers refuse to treat complimentary seats as spend-cap cash.

**Sources:** LeadHall / Jobber / ServiceTitan citations already in §37. Atlas is the live site, not a third-party stat.

---

## 39. Run reply queue — we draft, they send

§38 said the next punch was a queue where we draft the neighborhood reply and they tap send from their phone. This is that product.

It is **not** a Nextdoor integration. We do not scrape. We do not post as the operator. The ask is **pasted by a human**. The send happens in their own Nextdoor / Facebook / GBP app.

### 39.1 Why this is the Run wedge

Build already hands them a reply kit (scripts). Network is the DoorDash seat. **Run is the sit-promise** — we keep watching the threads and writing the next reply. The queue is how that promise shows up on their phone:

1. Agency (or an org owner/admin on a managed account) pastes the ask and writes the draft.
2. We append `/b/{slug}` if they forgot.
3. Telegram/email alert: “Reply ready.”
4. Operator opens `/os/replies`, hits **Copy reply**, pastes, sends, marks **I sent it**.

Self-serve and Network-only accounts see an honest empty state: this is a Run feature. A contractor cannot self-assign `engagementType: "managed"`.

### 39.2 What this round shipped

- `reply-queue.ts` + `reply-queue-shared.ts` — Run gate, pasted source, `/b` enforcement, copy/sent/skip.
- `/os/replies` — phone-first queue. `/admin/replies` — platform drafts for Run orgs we are not a member of.
- Tests refuse a self-serve draft and refuse a scrape-shaped empty ask.

**Do not claim:** we posted the reply, we read Nextdoor via API, or Twilio SMS delivered the ping (alerts are still Telegram/email).



