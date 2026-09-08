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
3. **Produce** — drafts the operator asked for: trademark-ready logo kits, copy, images, SEO packages, marketing-site code in a real repo.
4. **Verify** — check drafts against live pages, USPTO search hits, schema validators, contrast/a11y heuristics, and the brief.
5. **Approve** — human-in-the-loop. Downloads, git pushes, and Vercel production publishes stay locked until then.
6. **Deliver or hand off** — zip / repo / live preview URL, or `request-unlimited` with the payload attached.

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
- Practicing law or guaranteeing a trademark will register — it **does** produce filing-ready logo kits and a cited USPTO search; it **does not** file as attorney of record or certify registrability
- Claims / medical / finance copy certification — it can draft and flag; it cannot certify

**Website coding is in.** Custom app coding is out. See §3.3.  
**Trademark-ready logo kits are in.** Attorney filing is out. See §3.2.  
**Repo control and Vercel publish are in.** Arbitrary git-forge admin and non-marketing apps are out. See §3.4.

---

## 3. Must-haves (non-negotiable skill packs)

These are the capabilities the user named, plus the ship path they asked to add. Everything else in this catalog is support for them, or a later SKU that reuses them.

Must-haves: **research**, **trademark-ready logos**, **marketing-site code**, **SEO**, **accuracy/efficiency**, plus **GitHub repo control** and **Vercel publishing**.

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

### 3.2 Images — including trademark-ready logos

**Purpose:** Produce marketing imagery **and** a logo system an operator can actually file and ship, not a disposable monogram.

**Trademark-ready** here means the **artwork package** used for a USPTO (or equivalent) filing, plus a cited search. It does **not** mean Launchabl is their lawyer or that registration is guaranteed.

A logo kit is not done until all of these exist:

- Distinctive mark (icon + wordmark + at least one lockup), not initials-in-a-circle as the only option
- True vectors (SVG + PDF), not a PNG wrapped in an `.svg`
- Colorways: full color, black, white, one-color
- Clear-space and minimum-size rules
- Raster exports (PNG @1x/@2x, favicon, app icon) derived from the vectors
- USPTO-style specimen (the mark as it appears on the generated site or a mock usage)
- `trademark.search` report with cited serial numbers and conflict flags

| Skill | Operator label | Processing | Notes |
|---|---|---|---|
| `logo.brief` | What this mark has to do | Server | Name, industry, Nice classes if they have them, distinctiveness notes |
| `logo.generate-system` | Design the logo system | Partner (image + vector pipeline) | Multiple directions; operator picks one in review |
| `logo.vectorize` | Make real vectors | Partner / server | SVG + PDF; reject raster-only output |
| `logo.colorways` | Color, black, white | Server | Contrast-check each |
| `logo.export-kit` | Package for filing and web | Server | Zip: vectors, rasters, specimen, guidelines HTML/PDF |
| `trademark.search` | Search the trademark register | Partner (USPTO TESS/TSDR; later EUIPO etc.) | Cite hits; never "you're clear" |
| `trademark.conflict-report` | Show likely conflicts | Server | Sourced from search; hand off if crowded |
| `trademark.specimen` | How the mark is used | Server | From the site scaffold or a usage board |
| `image.generate-og` | Make the social preview | Partner | From page title + palette + approved mark |
| `image.generate-social-set` | Make a social set | Partner | Feed / story / LinkedIn crops |
| `image.generate-ad-variants` | Draft ad creative | Partner | Stills only in v1; operator funds spend |
| `image.remove-bg` | Cut out the subject | Client (existing) | Product / headshot |
| `image.resize-ad-set` | Size for every platform | Client (existing resizer) | One upload → zip |
| `image.watermark` | Stamp the asset | Client (existing) | Uses the approved mark when Vault has one |
| `image.strip-exif` | Strip hidden data | Client (existing) | |
| `image.convert` | Convert format | Client (existing) | |

**Quality bar:** the operator can download a kit a trademark attorney could attach to an application, and use the same files on the Vercel site. Custom photography, illustration systems, and motion stay unlimited-plan humans. If the search is crowded, the agent says so and offers regenerate or hand off — it does not invent clearance.

**APIs:** image + vector pipeline (pick at implementation; commercial-use license required for marks). USPTO search partner. Do not expose model names in the operator UI. Client prep skills stay in-browser.

### 3.3 Code websites (marketing sites only)

**Purpose:** Ship conversion-focused **landing pages and marketing sites**, not products. Default ship path is **Next.js → their GitHub repo → Vercel preview → Approve publish → production**.

In:

- Single landing or small marketing site (Home, About, Services, Contact, legal stubs)
- Next.js App Router scaffold as the default (this repo's stack)
- HTML/CSS zip as a fallback when they refuse git
- Webflow / Framer **spec** as an alternate for operators who will not use GitHub
- On-brand sections: hero, proof, offer, FAQ, footer
- Wired SEO: title, meta, canonical, JSON-LD, OG image
- Logo kit dropped into `public/brand/`
- Preview URL on Vercel; custom domain after Approve publish

Out:

- Auth, billing, dashboards, native apps, custom APIs, agent backends
- "Build my SaaS" — that is the pricing exclusion *Custom software / app development*

| Skill | Operator label | Output |
|---|---|---|
| `web.intake-sitemap` | Pages this site needs | IA list from brief |
| `web.scaffold-next` | Build a Next.js marketing site | App Router pages + `public/` assets |
| `web.scaffold-html` | Build a static landing | HTML/CSS/JS zip (no-git fallback) |
| `web.spec-webflow` | Spec for Webflow | Page map + CMS fields + copy blocks |
| `web.inject-seo` | Fit SEO onto the pages | Title/meta/schema/OG per route |
| `web.preview` | Preview the draft | In-studio preview **and** Vercel preview URL once connected |
| `web.a11y-pass` | Check the draft | Heuristic a11y on generated markup |
| `web.publish` | Publish production | **Approve publish**; Vercel production + domain (Webflow only if that connection is the one they chose) |

Unlimited humans still: complex CMS, migrations, high-volume ongoing edits, photography. They are not required for "the site is live on Vercel."

### 3.4 Repo control and Vercel

**Purpose:** The generated site is a real codebase the operator owns, with preview deploys and a production URL. This is how Launchabl ships websites, not an optional developer extra.

Operator labels: "Connected: GitHub", "Connected: Vercel", **Approve push**, **Approve publish**. Never "clone", "PAT", or "git remote" as the primary UI.

#### GitHub (repo control)

Smallest GitHub App scope that can create a repo, push branches, and open PRs on repos the operator grants. Prefer a GitHub App over a personal access token in the operator UI.

| Skill | Operator label | Gate |
|---|---|---|
| `git.create-repo` | Create the site repo | Account + GitHub connected |
| `git.commit` | Save this version | **Approve push** on the first write to a repo they own |
| `git.branch` | Work on a branch | Same |
| `git.open-pr` | Open a pull request | Approve push; Vercel preview follows |
| `git.read-tree` | Read the current site | Needed for ongoing edits |
| `git.invite` | Give Launchabl access | Optional; unlimited plan may keep a collaborator |

Rules:

- Anonymous runs: zip only. No repo create.
- First commit to *their* org/user: Approve push, show the file list.
- Later commits on a Launchabl-created branch: still visible in the skill log; production still needs Approve publish.
- The agent does not force-push `main`, delete repos, or rotate org secrets.
- Default: operator-owned repo. Unlimited plan may instead host under a Launchabl org with them as collaborator (managed hosting).

#### Vercel (publish)

Git integration is the product: the GitHub repo is the source of truth; Vercel builds from it. Do not make "upload a zip to Vercel" the primary path.

| Skill | Operator label | Gate |
|---|---|---|
| `vercel.create-project` | Connect this repo to Vercel | GitHub repo exists |
| `vercel.preview` | Preview URL | Push to a branch / PR (no extra gate beyond Approve push) |
| `vercel.promote-production` | Publish the live site | **Approve publish** |
| `vercel.attach-domain` | Use this domain | Approve publish; DNS skill may follow |
| `vercel.env` | Project settings | Marketing sites should need none; never dump secrets into the skill log |

Rules:

- Preview URLs are the review surface for website jobs (alongside in-studio preview).
- Production + custom domain is Approve publish — louder than download.
- Unlimited "hosting included" = Launchabl Vercel team + domain they already registered, still with Approve publish on first go-live.
- Failed builds surface as a failed skill with the Vercel log summary, not a fake green deploy.

### 3.5 SEO

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

**Apply vs draft:** generating a snippet is draft. Committing it to their GitHub repo and promoting Vercel production (or pushing to Webflow/Shopify) is apply → Approve push / Approve publish or hand off.

### 3.6 Accuracy and efficiency (cross-cutting)

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
| `trademark.search` | Shipping a mark with no register check |
| `logo.vector-check` | Raster-only "SVG" in a filing kit |
| `git.diff-review` | Pushing files the operator never saw |

**Efficiency skills (compounding):**

| Skill | What it saves |
|---|---|
| `vault.read` / `vault.write` | Re-entering brand, domain, last audit |
| `reuse-fetch` | Audit, grader, gap, links, headers sharing one fetch |
| `compose-report` | White-label report from other outputs |
| `batch-variants` | One creative → every ad size; one brief → page + OG + schema |
| `git.open-pr` | Edits as a preview URL instead of a zip round-trip |
| `vercel.preview` | Review the real site before production |
| `handoff-unlimited` | Humans start from the brief + scan + repo, not from zero |
| `template-calendar` | 30-day plan without a blank chat |

If a proposed feature does not make delivery **more accurate** or **faster to approve**, it is a SKU, not an agent skill.

---

## 4. Coverage matrix — unlimited plan services

Source: `web/src/app/solutions/page.tsx`.  
Legend: **Agent** = draft + verify; **SKU** = live or planned tool page; **Human** = unlimited plan finishes.

### Brand & identity

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Logo & mark | Trademark-ready kit: vectors, colorways, specimen, cited USPTO search (`logo.*`, `trademark.*`) | Brand Creator, Brand Identity Kit (upgrade from monogram) | Attorney filing, crowded-class redesign, photography |
| Color + type system | Palette + pairing + contrast-check, baked into the kit | Brand Identity Kit | Print production, extended type licensing |
| Brand guidelines doc | Generated PDF/HTML from the same kit | Identity kit export | Art-directed books, photography direction |
| Social profile kit | Sized avatars, banners, OG from the approved mark | Ad resizer + generate-social-set | Campaign photography, motion |

### Website design & build

| Deliverable | Agent | SKU today | Human |
|---|---|---|---|
| Landing pages | `web.scaffold-next` + copy + SEO + OG + logo in `public/brand/` | Copywriter, grader, schema | CRO tests, photography |
| Full site builds | Marketing sitemap → Next repo on GitHub → Vercel | None as a SKU yet (job: Launch) | Complex CMS, migrations, app features |
| Ongoing edits & new pages | `git.read-tree` → branch → PR → Vercel preview | Audit / grader as diagnostics | High-volume queue on unlimited |
| Hosting included | Vercel production + domain (`vercel.*`) | Hosting (coming-soon) becomes this connection | Launchabl-owned Vercel project when they buy the plan |

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
| Managed hosting | Vercel project + production URL | Hosting (coming-soon → Vercel) | Launchabl team hosting on unlimited |
| SSL & security basics | Check cert + headers | SSL Checker, Security Headers | Remediation, monitoring |

---

## 5. Skill packs (the agent's actual toolbox)

Packs are what crews import. SKUs pick a subset. The model (when added) may only choose among skills **declared for that job**.

### Pack: Research
`fetch-page`, `fetch-competitors`, `cite-source`, `extract-claims`, `public-ads.lookup`, `gsc.*`, `serp.outline`

### Pack: Images
`image.generate-og`, `image.generate-social-set`, `image.generate-ad-variants`, `image.remove-bg`, `image.resize-ad-set`, `image.watermark`, `image.strip-exif`, `image.convert`

### Pack: Logo (trademark-ready)
`logo.brief`, `logo.generate-system`, `logo.vectorize`, `logo.colorways`, `logo.export-kit`, `logo.vector-check`, `trademark.search`, `trademark.conflict-report`, `trademark.specimen`

### Pack: Websites
`web.intake-sitemap`, `web.scaffold-next`, `web.scaffold-html`, `web.spec-webflow`, `web.inject-seo`, `web.preview`, `web.a11y-pass`, `web.publish`

### Pack: Git
`git.create-repo`, `git.commit`, `git.branch`, `git.open-pr`, `git.read-tree`, `git.invite`, `git.diff-review`

### Pack: Vercel
`vercel.create-project`, `vercel.preview`, `vercel.promote-production`, `vercel.attach-domain`, `vercel.env`

### Pack: SEO
`seo.score-page`, `seo.score-landing`, `seo.gap-competitors`, `seo.draft-schema`, `seo.validate-schema`, `seo.draft-titles`, `seo.sitemap-robots`, `seo.local-pack`, `seo.speed-notes`

### Pack: Copy & campaigns
`copy.structured` (existing templates), `copy.claims-flag`, `calendar.30-day`, `utm.build` (backlog SKU), `og.card` (backlog)

### Pack: Brand
`brand.names`, `brand.palette`, `brand.kit-zip`, `domain.availability` (logo pack is the mark itself)

### Pack: Accuracy
Always imported: `verify-url`, `cite-source`, `schema-validate`, `contrast-check`, `a11y-heuristics`, `no-fake-metrics`, `ownership-gate`. Logo jobs also import `trademark.search` and `logo.vector-check`. Git writes import `git.diff-review`.

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
| GitHub | create repo, commit, branch, PR, read tree | Launch / website edits |
| Vercel | project, preview, production, domain | Launch / hosting |
| USPTO TESS/TSDR (and later other registers) | trademark.search | Brand / Launch |
| Google Search Console | queries, pages, coverage | Get found |
| Google Analytics 4 | traffic that is *theirs*, never guessed | Get found / reports |
| Google Business Profile | description, categories, Q&A (read then Approve publish) | Local SEO |
| Shopify / Woo | products missing copy/alt/schema | Content + SEO |
| Webflow / WordPress | alternate publish for no-git operators | Websites (not the default) |
| Meta / Google Ads *accounts* | their creatives (not spend we pay) | Campaigns |
| Meta Ad Library + other **public** ad libraries | competitor creative, with spend caveats | Research |
| Registrar | availability, checkout redirect; DNS for Vercel domain | Launch |
| Email ESP (later) | sequence install | Content |

Auth failures: label the gap and continue on public fetch. Never send both Bearer and leftover API-key headers if we add eToro-like dual auth elsewhere — keep each vendor's client isolated.

### 6.2 Generation (Launchabl calls *models*)

| Partner | Used by | Constraint |
|---|---|---|
| LLM (server proxy only) | Copy, outlines, site IA, research synthesis | Structured templates first; no blank "do anything" chat as the product |
| Image + vector pipeline | Logo system, OG, social/ad stills | Commercial-use license; vectors required for logo kits |
| USPTO (or search aggregator) | Trademark search | Cite serials; never "cleared" |
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
| **Launch** | Logo, Brand, Git, Vercel, Websites, Copy, Domain | Trademark-ready kit + Next repo + Vercel preview URL |
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
- Business Name + Trademark Availability Checker → `trademark.search` SKU on-ramp
- Full-site crawl / JS render → Research accuracy upgrade
- Lighthouse / CrUX → SEO speed, still sourced

Not agent core (SKU or partner only): business formation *filing*, burner email, phone lookup, developer utilities cluster, invoice/contract generators. GitHub/Vercel for marketing sites **are** agent core; a general developer-tools cluster is not.

---

## 9. Depth model (so we do not over-promise)

Every capability is one of:

1. **Diagnose** — read live or connected data  
2. **Draft** — generate an artifact  
3. **Verify** — check the draft  
4. **Package** — zip, report, Vault  
5. **Apply** — write to GitHub, Vercel, CMS/GBP/Shopify (**Approve push** / **Approve publish**)  
6. **Finish** — unlimited human (attorney filing, photography, app engineering, crowded trademark redesign)

The agent **owns 1–4** for the must-haves, including trademark-ready logo kits and a Next.js marketing site. It **does 5** for GitHub and Vercel (and later CMS) with the louder gates. It **never 6** except by calling `handoff-unlimited`.

Example: "code websites"

- Diagnose: fetch current site  
- Draft: Next.js scaffold + logo kit in `public/brand/`  
- Verify: a11y + schema-validate + Vercel preview  
- Package: GitHub repo (Approve push)  
- Apply: Vercel production + domain (Approve publish)  
- Finish: CMS/migrations, or unlimited if they want Launchabl to own hosting

Example: "trademark-ready logo"

- Diagnose: brief + `trademark.search`  
- Draft: logo system directions  
- Verify: vector-check + contrast + conflict-report  
- Package: filing zip + specimen  
- Apply: commit brand files into the site repo  
- Finish: attorney files the application; agent does not

---

## 10. What we tell operators (vocabulary)

Never: MCP, function calling, system prompt, "I called `fetch-page`."  
Always: job name, plain skill labels ("Check the live page", "Search the trademark register", "Save to GitHub", "Publish on Vercel"), Connected: X, Approve / Approve push / Approve publish, Hand off to Launchabl.

Internal ids in this catalog are for implementers.

---

## 11. Sequence (capabilities, not calendar)

Does not replace the Studio implementation plan. Studio is still layer 1 — without it, these packs have no run surface.

**How to build it** (workflow, accuracy wiring, waves): `docs/plans/2026-09-08-agent-delivery-os.md`. Execute Wave 1 from `docs/plans/2026-09-08-agent-approval-studio.md`, then Waves 2–10 in that delivery-OS plan. Do not skip waves: each one is a complete operator loop.

Capability order inside those waves:

1. **Studio kernel** on audit + watermark (skills visible, approve-to-export).  
2. **Accuracy envelope** (`SkillResult` sources, required accuracy skills, no fake metrics).  
3. **Named shared engines** (`fetch-page`, `score-seo`, `dns-lookup`).  
4. **Vault** so brand + last fetch reuse.  
5. **First crew: Audits & reports** (existing heavy tools composed).  
6. **Logo system + trademark search** (vectors, colorways, cited register hits).  
7. **Website scaffold (Next first)** + iframe preview + zip.  
8. **GitHub connection** — Approve push, repo is the source of truth.  
9. **Vercel connection** — preview on push; Approve publish for production + domain.  
10. **Launch crew** — one job composing 6–9.  
11. **Search Console** on Get found, then outbound Jobs API.

Webflow/GBP publish stay real, but they are not the default website path. Skipping 6–9 would leave logos, repos, and go-live as a promise. Skipping 1–5 would make 6–9 a chat demo with no approvals.

---

## 12. Success test

A founder can, in one Launch job:

- Research the current site (cited fetch, no fake ranks)
- Get a trademark-ready logo kit (vectors, colorways, specimen) plus a cited USPTO search that never says "cleared"
- Get a Next.js marketing site in **their** GitHub repo after Approve push
- Open a Vercel preview URL, then Approve publish to production (optional custom domain)
- See contrast/a11y/schema checks on that draft
- Click hand off if they want an attorney to file the mark or Launchabl to own hosting

They never paid ad spend, never got a custom app, and never pasted a GitHub token into a chat. If GitHub/Vercel were not connected, they still got the kit + zip and the UI said so.

---

## 13. Open decisions (do not block Studio)

- Image + vector vendor (quality vs cost vs **commercial-use license for marks**). Raster-then-trace is acceptable only if `logo.vector-check` passes.
- GitHub App vs OAuth App (recommendation: **GitHub App**, operator installs on the org they want).
- Operator-owned Vercel team vs Launchabl-owned team for free vs unlimited (recommendation: **their team** when connected; **Launchabl team** when hosting is included).
- USPTO-only search vs multi-register (EUIPO, UKIPO) in v1 (recommendation: USPTO first, others as labeled gaps).
- Rank API (optional, paid) vs GSC-only for "what you rank for."
- JS-rendered fetch (headless) as a billed or plan-gated accuracy upgrade.

These do not change the charter: research with citations, **trademark-ready logo kits**, marketing-site code **in GitHub**, **Vercel preview and production**, SEO, verify, Approve push / Approve publish, or hand off.
