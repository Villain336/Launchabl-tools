# Agent Capability Catalog

Date: 2026-09-08
Status: requirements / direction (not an implementation plan)
Audience: founders, marketers, freelancers, small agencies
Depends on:
- `docs/superpowers/specs/2026-09-08-agentic-marketing-platform.md` (platform layers)
- `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md` (run UI)
- Unlimited-plan services in `web/src/app/solutions/page.tsx`
- Live tools in `web/src/lib/site-config.ts`

This document answers: **what the Launchabl agent is allowed to do**, which **skills / tools / APIs** that takes, and where **humans still ship**. It is not a build order for UI.

---

## 1. Charter

The agent is a **marketing delivery operator**. It does not need to do every marketing job Launchabl sells. It does need to make the jobs we *do* take faster and harder to get wrong.

Default loop (every job):

1. **Intake** — brief, URL, files, optional connections.
2. **Research** — live fetch + public sources, with citations. No invented rankings, spend, or traffic.
3. **Produce** — drafts the operator asked for: copy, images, SEO packages, marketing-site code.
4. **Verify** — check drafts against live pages, schema validators, contrast/a11y heuristics, and the brief.
5. **Approve** — human-in-the-loop. Downloads and publishes stay locked until then.
6. **Deliver or hand off** — zip / snippets / Vault item, or `request-unlimited` with the payload attached.

If a step would require guessing a number Google has not shown us, the agent **stops and labels the gap** ("Connect Search Console" or "Hand off to unlimited") instead of filling it in.

---

## 2. What "does not do everything" means

Launchabl will eventually ship **hundreds of tools**. Those are **SKUs** (pages people search for and launch). The agent is a smaller set of **reusable skills** underneath.

| Layer | Count (order of magnitude) | Role |
|---|---|---|
| Tool SKUs | Hundreds over time | Acquisition, SEO, one-job entry points |
| Skills | Dozens, shared | What the agent actually calls |
| Jobs / crews | A handful of named outcomes | Compose skills into a client-ready package |
| Unlimited humans | Always available | Finish what drafts + verify cannot |

A new tool is usually a new SKU wrapping skills we already have (`fetch-page` + a new scoring lens), not a new agent personality.

**Explicitly out of the agent's job (same as the unlimited plan exclusions):**

- Custom software / app / SaaS engineering
- Paying or managing ad media budgets
- Parallel unlimited-plan queues (product constraint, not a model constraint)
- Arbitrary HTTP with the operator's tokens ("paste any OpenAPI spec")
- Legal clearance (trademark, claims, medical/finance copy) — it can draft and flag; it cannot certify

**Website coding is in.** Custom app coding is out. See §5.3.

---

## 3. Must-haves (non-negotiable skill packs)

These are the capabilities the user named. Everything else in this catalog is support for them, or a later SKU that reuses them.

### 3.1 Research

**Purpose:** Ground every claim in something we fetched or the operator connected.

| Skill (internal id) | Operator label | Needs | Output |
|---|---|---|---|
| `fetch-page` | Check the live page | URL | HTML, headers, detected title/meta/schema/links |
| `fetch-competitors` | Compare competitors | 1–3 URLs | Same as fetch, plus a diff table |
| `cite-source` | Show sources | Any research output | URL + retrieved-at + quoted snippet |
| `extract-claims` | Check claims against the live site | Brief + fetch | Claims that match / contradict / are unverifiable |
| `public-ads.lookup` | See their public ads | Domain / page (Meta Ad Library etc.) | Creative list + caveats on spend |
| `gsc.top-queries` | Queries you already rank for | Connection: Search Console | Query / page / impressions / clicks |
| `serp.outline` | Topics people search | Optional GSC; else operator keywords | Outline with sources labeled |

**Accuracy rules:**

- Every metric in a report names its source (`live fetch`, `Search Console`, `operator-provided`).
- Missing connection → show the gap, still finish on public fetch.
- Never invent "you rank #3 for X" without GSC or an approved third-party rank API.

Live SKUs that already exercise this pack: Website Audit, Landing Page Grader, Competitor Gap, Broken Link Checker, Security Headers, SSL Checker.

### 3.2 Images

**Purpose:** Produce and prepare marketing imagery without a separate design tool for the common cases.

| Skill | Operator label | Processing | Notes |
|---|---|---|---|
| `image.generate-mark` | Make a mark / lockup | Partner (image model) | Starter identity, not trademark-safe custom logo |
| `image.generate-og` | Make the social preview | Partner | From page title + palette |
| `image.generate-social-set` | Make a social set | Partner | Feed / story / LinkedIn crops from one brief |
| `image.generate-ad-variants` | Draft ad creative | Partner | Stills only in v1; operator funds spend |
| `image.remove-bg` | Cut out the subject | Client (existing) | Product / headshot |
| `image.resize-ad-set` | Size for every platform | Client (existing resizer) | One upload → zip |
| `image.watermark` | Stamp the asset | Client (existing) | |
| `image.strip-exif` | Strip hidden data | Client (existing) | |
| `image.convert` | Convert format | Client (existing) | |

**v1 quality bar:** usable drafts and production-ready *prep* (resize, cutout, watermark, OG). Custom photography, illustration systems, and motion campaigns stay unlimited-plan humans.

**APIs:** one image-generation partner (pick at implementation; do not expose model names in the operator UI). Client skills stay in-browser.

### 3.3 Code websites (marketing sites only)

**Purpose:** Ship conversion-focused **landing pages and marketing sites**, not products.

In:

- Single landing or small marketing site (Home, About, Services, Contact, legal stubs)
- HTML/CSS or Next.js App Router scaffold
- Webflow / Framer **spec** (structure + copy + assets) the human or a publish connection can apply
- On-brand sections: hero, proof, offer, FAQ, footer
- Wired SEO: title, meta, canonical, JSON-LD, OG image
- Hosting handoff: zip + README, or Launchabl-managed hosting via the unlimited plan

Out:

- Auth, billing, dashboards, native apps, custom APIs, agent backends
- "Build my SaaS" — that is the pricing exclusion *Custom software / app development*

| Skill | Operator label | Output |
|---|---|---|
| `web.intake-sitemap` | Pages this site needs | IA list from brief |
| `web.scaffold-html` | Build a static landing | HTML/CSS/JS zip |
| `web.scaffold-next` | Build a Next.js marketing site | App Router pages + `public/` assets |
| `web.spec-webflow` | Spec for Webflow | Page map + CMS fields + copy blocks |
| `web.inject-seo` | Fit SEO onto the pages | Title/meta/schema/OG per route |
| `web.preview` | Preview the draft | In-studio preview (later: Vercel preview URL) |
| `web.a11y-pass` | Check the draft | Heuristic a11y on generated markup |
| `web.publish` | Publish | **Approve publish** only; Webflow/hosting connection |

Unlimited humans still: custom design systems, complex CMS, migrations, ongoing edits at volume, production hosting included in the plan.

### 3.4 SEO

**Purpose:** Diagnose, draft fixes, and package technical + on-page SEO. Site-wide implementation is still the plan.

| Skill | Operator label | Live SKU today |
|---|---|---|
| `seo.score-page` | Score this URL | Website Audit |
| `seo.score-landing` | Grade conversion | Landing Page Grader |
| `seo.gap-competitors` | Show the gap | Competitor Gap |
| `seo.draft-schema` | Draft structured data | Schema Generator |
| `seo.validate-schema` | Validate JSON-LD | New (accuracy) — Rich Results-style checks we can run ourselves |
| `seo.draft-titles` | Titles & meta | Partial via copywriter; needs a dedicated skill |
| `seo.sitemap-robots` | Sitemap + robots | Sitemap & Robots Generator |
| `seo.local-pack` | Local / GBP package | Local SEO Optimizer (copy today; GBP API later) |
| `seo.speed-notes` | Speed issues | Audit heuristics; real Lighthouse later |
| `gsc.*` | Your Search Console | Connection, not a public SKU |

**Apply vs draft:** generating a snippet is draft. Pasting it site-wide, or pushing to Webflow/Shopify, is apply → Approve publish or hand off.

### 3.5 Accuracy and efficiency (cross-cutting)

These are not a marketing service. They are why the agent is worth running instead of a chat box.

**Accuracy skills (always on for research/produce jobs):**

| Skill | What it prevents |
|---|---|
| `verify-url` | Copy that describes a page we never fetched |
| `cite-source` | Unsourced "research" |
| `schema-validate` | Invalid JSON-LD that fails Google's tester |
| `contrast-check` | Generated palettes / pages that fail WCAG contrast |
| `a11y-heuristics` | Missing alt, skipped headings on generated markup |
| `no-fake-metrics` | Hallucinated traffic, rank, ROAS, ad spend |
| `ownership-gate` | Watermark-remover class tools without attestation |
| `claims-flag` | Medical / financial / guaranteed-results language |

**Efficiency skills (compounding):**

| Skill | What it saves |
|---|---|
| `vault.read` / `vault.write` | Re-entering brand, domain, last audit |
| `reuse-fetch` | Audit, grader, gap, links, headers sharing one fetch |
| `compose-report` | White-label report from other outputs |
| `batch-variants` | One creative → every ad size; one brief → page + OG + schema |
| `handoff-unlimited` | Humans start from the brief + scan + approval, not from zero |
| `template-calendar` | 30-day plan without a blank chat |

If a proposed feature does not make delivery **more accurate** or **faster to approve**, it is a SKU, not an agent skill.

---

## 4. Coverage matrix — unlimited plan services

Source: `web/src/app/solutions/page.tsx`.  
Legend: **Agent** = draft + verify; **SKU** = live or planned tool page; **Human** = unlimited plan finishes.

### Brand & identity

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Logo & mark | Starter mark + lockup (`image.generate-mark`) | Brand Creator, Brand Identity Kit | Custom identity, trademark-ready files |
| Color + type system | Palette + pairing + contrast-check | Brand Identity Kit | Full system, usage rules, print |
| Brand guidelines doc | Generated PDF/HTML from Vault | Identity kit export | Designed guidelines, photography direction |
| Social profile kit | Sized avatars, banners, OG | Ad resizer + generate-social-set | Campaign photography, motion |

### Website design & build

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Landing pages | `web.scaffold-*` + copy + SEO + OG | Copywriter, grader, schema | Design polish, CRO tests, unique art direction |
| Full site builds | Small marketing sitemap + scaffold | None as a SKU yet (job: Launch) | Multi-page custom, CMS, migrations |
| Ongoing edits & new pages | Diff against live fetch; draft replacement section | Audit / grader as diagnostics | Queue work on the real site |
| Hosting included | Zip + README; later publish connection | Hosting (coming-soon partner) | Managed hosting in the plan |

### Content & copywriting

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Ad & landing copy | Structured templates + claims-flag | AI Copywriter | Voice, testing, campaigns |
| Email sequences | Sequence draft from calendar + copy skills | Calendar + copywriter | ESP setup, deliverability ops |
| Blog & SEO content | Outline from research + draft posts with citations | Partial | Editorial calendar executed, unique reporting |
| Product descriptions | From Shopify connection or pasted catalog | Copywriter | Catalog-wide merchandising |

### SEO & technical marketing

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Structured data across the site | Per-page JSON-LD + validate | Schema Generator | Site-wide implementation |
| Technical SEO audits | Fetch + score + gap | Audit, links, headers, SSL, a11y | Fix pass, JS-rendered crawl, monitoring |
| Site speed fixes | Heuristics + image convert notes | Audit + Image Converter | Real performance engineering |
| Local SEO setup | GBP copy pack; later GBP API | Local SEO Optimizer | Citations, reviews program, GBP management |

### Social & campaign design

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Social templates | Generate set + resize | Ad Creative Resizer | Original design system for social |
| Ad creative variations | Generate + resize; **no spend** | Resizer; Ad Intelligence (backlog) | Concepting, motion, media buying (they pay spend) |
| Launch campaign kits | Calendar + copy + creative + landing scaffold | Calendar, copy, brand kit | Orchestration, paid, PR |
| Presentation design | Outline + branded slides (later SKU) | — | Designed decks |

### Domain, hosting & setup

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Domain registration | Availability check; purchase is partner | Domain Availability / Purchase | Register + own the relationship |
| DNS & email setup | Diagnose SPF/DKIM/DMARC/MX | DNS & Email Health | Configure records for real |
| Managed hosting | Scaffold + partner handoff | Hosting (coming-soon) | Hosting included in plan |
| SSL & security basics | Check cert + headers | SSL Checker, Security Headers | Remediation, monitoring |

---

## 5. Skill packs (the agent's actual toolbox)

Packs are what crews import. SKUs pick a subset. The model (when added) may only choose among skills **declared for that job**.

### Pack: Research
`fetch-page`, `fetch-competitors`, `cite-source`, `extract-claims`, `public-ads.lookup`, `gsc.*`, `serp.outline`

### Pack: Images
`image.generate-*`, `image.remove-bg`, `image.resize-ad-set`, `image.watermark`, `image.strip-exif`, `image.convert`

### Pack: Websites
`web.intake-sitemap`, `web.scaffold-html`, `web.scaffold-next`, `web.spec-webflow`, `web.inject-seo`, `web.preview`, `web.a11y-pass`, `web.publish`

### Pack: SEO
`seo.score-page`, `seo.score-landing`, `seo.gap-competitors`, `seo.draft-schema`, `seo.validate-schema`, `seo.draft-titles`, `seo.sitemap-robots`, `seo.local-pack`, `seo.speed-notes`

### Pack: Copy & campaigns
`copy.structured` (existing templates), `copy.claims-flag`, `calendar.30-day`, `utm.build` (backlog SKU), `og.card` (backlog)

### Pack: Brand
`brand.names`, `brand.palette`, `brand.kit-zip`, `domain.availability`

### Pack: Accuracy
Always imported: `verify-url`, `cite-source`, `schema-validate`, `contrast-check`, `a11y-heuristics`, `no-fake-metrics`, `ownership-gate`

### Pack: Connections (inbound APIs)
Each connection is a narrow pack, not a generic HTTP tool. See §6.

### Pack: Hand off
`vault.read`, `vault.write`, `compose-report`, `handoff-unlimited`

---

## 6. APIs and partners

Three classes. Do not share one client wrapper across them.

### 6.1 Inbound (Launchabl calls *their* systems)

Do these as job-shaped packs with smallest OAuth scope. Operator sees "Connected: Search Console."

| Connection | Skills it unlocks | First job that needs it |
|---|---|---|
| Google Search Console | queries, pages, coverage | Get found |
| Google Analytics 4 | traffic that is *theirs*, never guessed | Get found / reports |
| Google Business Profile | description, categories, Q&A (read then Approve publish) | Local SEO |
| Shopify / Woo | products missing copy/alt/schema | Content + SEO |
| Webflow / WordPress | publish drafts | Websites |
| Meta / Google Ads *accounts* | their creatives (not spend we pay) | Campaigns |
| Meta Ad Library + other **public** ad libraries | competitor creative, with spend caveats | Research |
| Registrar / hosting reseller | availability, checkout redirect | Launch |
| Email ESP (later) | sequence install | Content |

Auth failures: label the gap and continue on public fetch. Never send both Bearer and leftover API-key headers if we add eToro-like dual auth elsewhere — keep each vendor's client isolated.

### 6.2 Generation (Launchabl calls *models*)

| Partner | Used by | Constraint |
|---|---|---|
| LLM (server proxy only) | Copy, outlines, site IA, research synthesis | Structured templates first; no blank "do anything" chat as the product |
| Image model | Marks, OG, social/ad stills | Draft quality; humans for identity |
| ASR (later) | Transcriber → clips / captions | Cost-gated |
| Inpainting (later) | Watermark remover on *owned* assets | Ownership attestation required |

Keys never ship to the browser. Client tools stay client.

### 6.3 Platform outbound (later)

Launchabl *is* an API for agencies: Jobs API / MCP / Zapier. Same skills, same approvals. Not how we acquire the core audience. See the OS spec.

### 6.4 We will not add as agent APIs

- People-search / phone lookup marketed as "find anyone"
- Supplier/customs intelligence without a licensed data partner
- Inbox/Drive deep search before we have a privacy review
- A user-pasted OpenAPI tool store

---

## 7. Jobs the agent should eventually run

Named in operator language. Each is a crew: intake → skills → review → deliver / hand off.

| Job | Must-have packs | First honest deliverable |
|---|---|---|
| **Launch** | Brand, Images, Websites, Copy, Domain | Name + palette + landing scaffold + OG + schema |
| **Get found** | Research, SEO, Accuracy, optional GSC | Audit + titles/meta + schema zip, gaps labeled |
| **Audits & reports** | Research, SEO, compose-report | White-label PDF/HTML from live fetches |
| **Protect** | Images (watermark, exif) | Approved download, files never uploaded |
| **Campaign** | Copy, Images, Calendar | 30-day plan + creative set + UTM later |
| **Local** | SEO local + GBP connection | Description/Q&A pack; publish gated |
| **Convert & ship** | Usually **not** an agent | One-shot converters stay forms |

Converters (QR, image convert, metadata, file convert) stay non-agent SKUs. They are efficiency utilities, not jobs.

---

## 8. Live tools vs agent vs later SKU

### Already live — wrap as skills when Studio ships

Approval-gated (agent-shaped today): website audit, landing grader, competitor gap, brand creator, brand identity kit, copywriter, schema generator, watermark generator, content calendar, white-label report.

Still forms (keep as forms): QR, image converter, metadata remover, and other one-shot converters.

Diagnostics that should become Research/SEO skills (may stay SKUs): broken links, a11y, security headers, SSL, DNS/email, sitemap/robots, local SEO, email finder, background remover, demo video, ad resizer.

### Strategy backlog — only agent-relevant highlights

Worth turning into skills because they feed accuracy or the must-haves:

- Competitor Ad Intelligence → `public-ads.lookup`
- OG / social preview generator → Images + Websites
- Transcriber + clipping → Create pack (later; not blocking Studio)
- GBP API on Local SEO → Connections
- Full-site crawl / JS render → Research accuracy upgrade
- Lighthouse / CrUX → SEO speed, still sourced

Not agent core (SKU or partner only): business formation, burner email, phone lookup, developer utilities cluster, invoice/contract generators.

---

## 9. Depth model (so we do not over-promise)

Every capability is one of:

1. **Diagnose** — read live or connected data  
2. **Draft** — generate an artifact  
3. **Verify** — check the draft  
4. **Package** — zip, report, Vault  
5. **Apply** — write to their CMS/GBP/Shopify (**Approve publish**)  
6. **Finish** — unlimited human

The agent **owns 1–4** for the must-haves. It **may 5** only with a connection and a louder gate. It **never 6** except by calling `handoff-unlimited`.

Example: "code websites"

- Diagnose: fetch current site  
- Draft: Next/HTML scaffold  
- Verify: a11y + schema-validate + preview  
- Package: zip + README  
- Apply: Webflow publish if connected  
- Finish: design system, hosting, ongoing edits

---

## 10. What we tell operators (vocabulary)

Never: MCP, function calling, system prompt, "I called `fetch-page`."  
Always: job name, plain skill labels ("Check the live page"), Connected: X, Approve, Hand off to Launchabl.

Internal ids in this catalog are for implementers.

---

## 11. Sequence (capabilities, not calendar)

Does not replace the Studio implementation plan. Studio is still layer 1 — without it, these packs have no run surface.

1. **Studio kernel** on audit + watermark (skills visible, approve-to-export).  
2. **Name shared engines** in code: `fetch-page`, `score-seo`, `dns-lookup`, `compose-image`.  
3. **Accuracy pack** on every research/produce job (`verify-url`, `cite-source`, `no-fake-metrics`).  
4. **Vault** so brand + last fetch reuse.  
5. **First crew: Audits & reports** (existing heavy tools composed).  
6. **Image generate** (OG + social set) as the first *new* produce skill — highest overlap with sites + campaigns.  
7. **Website scaffold** (HTML landing first, then Next) + `web.inject-seo`.  
8. **First connection: Search Console** on Get found.  
9. **Approve publish** (Webflow or GBP), not sooner.  
10. Outbound Jobs API for the same audit/scaffold jobs agencies already run in Studio.

Skipping 6–7 would leave the must-haves as a promise. Skipping 1–5 would make 6–7 a chat demo with no approvals.

---

## 12. Success test

A founder can, in one Launch job:

- Research the current site (cited fetch, no fake ranks)
- Get a starter mark + OG image
- Get a landing-page scaffold with copy, schema, and meta
- See contrast/a11y/schema checks on that draft
- Approve and download a zip
- Click hand off if they want Launchabl to host and finish the identity

They never paid ad spend, never got a custom app, and never saw an API key. If Search Console was not connected, the SEO package still shipped from live fetch and said so.

---

## 13. Open decisions (do not block Studio)

- Which image-generation vendor (quality vs cost vs license for commercial marks).
- HTML-first vs Next-first for `web.scaffold-*` (HTML is the faster verify; Next matches this repo).
- Whether generated marks are labeled "starter / not a substitute for custom identity" in the UI (recommendation: **yes**, always).
- Rank API (optional, paid) vs GSC-only for "what you rank for."
- JS-rendered fetch (headless) as a billed or plan-gated accuracy upgrade.

None of these change the charter: research with citations, images, marketing-site code, SEO, verify, approve, or hand off.
