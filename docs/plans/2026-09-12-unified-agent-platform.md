# One Agent, Forty Doors — from fragmented tools to a unified agentic platform

Date: 2026-09-12
Status: plan (sequenced by capability, not calendar)
Builds on: `docs/STRATEGY.md` (§11–12 tool backlog), `docs/superpowers/specs/2026-09-08-agentic-marketing-platform.md` (vocabulary, five layers), `docs/superpowers/specs/2026-09-08-agent-capability-catalog.md` (skill packs, depth model)

---

## 0. The one-paragraph version

Today Launchabl is 40 self-serve tools: 22 already run on the shared chat kernel (`ToolChat` + a server runtime per slug), 14 are legacy form/canvas tools, 4 are coming-soon. The tools work, but each one is a cul-de-sac: it doesn't know your brand, doesn't remember the last report, and produces the same answer for you as for anyone else. The plan is to invert that. **One agent** with a skill registry, a data layer (your brand, your site, your connections, your past outputs) and a job planner sits in the middle; the 40 tool pages stay as SEO doors that open the same agent pre-scoped. Every skill is held to a production bar — grounded, brand-aware, exportable, controllable, evaluated — and we add the media batch that got missed (transcription → clipping → repurposing) as first-class skills. Positioning doesn't change: tools acquire, the agent retains, the $3,997 agency hand-off monetizes.

---

## 1. Where we actually are

| Layer | Have | Missing |
|---|---|---|
| Engines (deterministic) | `fetch-page`, `html`, `checklist`, `crawl`, `website-audit`, `landing-page`, `compare-sites`, `links`, `canonical`, `performance`, `backlinks`, `voice-search`, `compliance`, `llm-readability`, DNS/TLS/headers checkers, QR renderer, client image ops (resize, convert, watermark, background removal), screen recorder | Media (ffmpeg, ASR), image generation, PDF rendering, external data (Search Console, Ads libraries, USPTO), scheduled monitoring |
| Skills (LLM tools) | 22 chat runtimes, each with `tool()` definitions, prompt, artifact renderer; `SCHEMA_RULES` validation; shared `fetchPage` | A manifest (cost class, side effects, requirements, quality bar); client-executed skills; skills that call other skills |
| Kernel | `ToolChat` (streaming, history, attachments, regenerate, `?q=` handoffs), model fallback chain, rate limits, spend cap, usage accounting, admin dashboard, upsell tracking | Router across skills, multi-step plans with approvals, memory, run log, evals |
| Data | localStorage history per tool; artifact session scratch | Accounts, brand profile, Vault, connections, blob storage, Postgres |
| Surfaces | `/tools/[slug]` pages, `/admin/usage` | `/agent` workspace, job templates, white-label export, API/MCP |

The chat kernel is the asset. Everything below is "make the kernel the product."

---

## 2. What "production-ready, enterprise-grade" means here (the quality bar)

Generic output is the enemy. Every skill must pass these before it is called done:

1. **Grounded.** Every factual claim in an output traces to fetched data, an attachment, or the brand profile. Unknowns are marked `[placeholder]`, never invented. (Schema Generator already does this; make it universal.)
2. **Brand-aware.** Name, URL, audience, tone, colours, banned words and proof points are injected into every generation. Two users never get the same headline.
3. **Real deliverables.** Files a professional would hand over: CSV/JSON/ICS/XML/HTML/PDF/ZIP, validated code (JSON-LD, robots, sitemap, meta), 9:16/1:1/16:9 media with burned captions — not prose that describes a deliverable.
4. **Controllable.** Every artifact exposes its levers: tone, length, audience, variant count, format, aspect ratio. Regenerate one section without losing the rest. Versions with diff. Pin what's right, iterate on what isn't.
5. **Creative by default.** Multiple genuinely different angles (pain, outcome, proof, contrarian, specificity), style presets, references ("make it feel like Linear's site"), optional image generation for heroes, social cards and ad creative.
6. **Honest about method.** Say what was measured and what wasn't ("static HTML, not a Lighthouse run"). Enterprise buyers trust caveats more than claims.
7. **Evaluated.** Each skill has a golden set (URLs, briefs, files) and a rubric; changes to prompts or engines run the set before deploy. Creative skills use an LLM judge with a fixed rubric plus human spot checks.
8. **Operable.** Per-skill cost class, timeouts, partial results on failure, run log with inputs/outputs, no retention by default, exportable, rate-limited, under the daily spend cap.

---

## 3. Target architecture (ground up, five layers)

```
Surfaces    /agent workspace · /tools/[slug] doors · embeds · API/MCP (later) · agency hand-off
Kernel      router · planner · approvals · memory · run log · evals · cost · fallback chain
Skills      manifest + tool() + prompt fragment + artifact + tests + golden set   (server or client)
Data        brand profile · site snapshot · Vault (outputs, assets) · connections · attachments
Engines     fetch/crawl/html/checks · media (ffmpeg, ASR) · image ops/gen · DNS/TLS · external APIs
```

### 3.1 Engines
Pure, deterministic, unit-tested functions. Already the pattern for `lib/web/*`. Add `lib/media/*` (ffmpeg.wasm in browser for trim/reframe/caption burn-in; server ASR), `lib/image/*` (existing client ops plus generation via the gateway), `lib/external/*` (Search Console, GA4, GBP, Meta Ad Library, Google Ads Transparency, USPTO).

### 3.2 Skills
A skill is today's chat runtime, promoted to a first-class unit with a manifest:

```ts
type SkillManifest = {
  id: "audit-website";                    // stable, used by router and Vault
  label: "Audit a page";                  // human name in the UI
  description: string;                    // what the router reads
  input: ZodSchema; output: ZodSchema;    // typed contract
  artifact: "checklist" | "comparison" | "variants" | ...;
  runsIn: "server" | "browser";          // browser for image/media ops (AI SDK onToolCall)
  cost: "free" | "cheap" | "model" | "media";   // drives limits and gating
  sideEffects: "none" | "external-read" | "external-write";  // write ⇒ approval gate
  needs: ("brand" | "site" | "connection:gsc" | ...)[];       // planner resolves or asks
  goldenSet: string;                       // path to eval fixtures
};
```

Every legacy tool becomes a skill. Client-side tools (image converter, watermark, background remover, ad resizer, brand kit, recorder) become **browser skills**: the model calls them, the browser executes, the result comes back as an artifact. Nothing leaves the device, which keeps the privacy pitch.

### 3.3 Kernel
- **Router**: one system prompt that knows every skill's label and description, plus the active scope (a tool page pre-scopes to one skill family; `/agent` is unscoped). Uses the existing model chain.
- **Planner**: for jobs ("launch my site", "monthly SEO report"), produce a visible plan of skill calls; execute; pause at approval gates (anything with `external-write`, anything that costs media minutes, anything the user marked "ask first").
- **Memory**: brand profile + site snapshot + Vault summaries injected per turn; long-term facts extracted from conversations with user confirmation ("Save that your audience is dental practices?").
- **Run log**: every skill call with inputs, outputs, cost, duration, model — the admin dashboard already has the accounting half.
- **Evals**: `npm run evals` runs golden sets against skills; CI blocks prompt changes that regress.

### 3.4 Data
- **Anonymous first** (keeps "no account needed"): brand profile and Vault live in IndexedDB; export/import as a `.launchabl.json`.
- **Accounts when useful**: magic link or passkey; Postgres (Neon) for profiles, Vault index, runs; Vercel Blob or R2 for files; Upstash for limits/usage (already abstracted). Accounts unlock sync, team sharing, scheduled jobs, connections and higher media minutes — never gate single-use actions.
- **Connections**: Google Search Console, GA4, Business Profile, GitHub, Vercel first (inbound only, read-mostly). Meta/Google/TikTok ad libraries need no OAuth.

### 3.5 Surfaces
- `/agent`: chat + artifact rail + plan panel + Vault sidebar. The product.
- `/tools/[slug]`: unchanged for SEO; the same `ToolChat` but scoped, with a "continue in the agent" affordance that carries the conversation across.
- White-label exports (PDF/HTML) for agencies; embeds and an outbound API/MCP later, once skills are stable.
- **Hand off**: any job can be sent to the unlimited-plan humans with the run log attached. Nobody else in this category offers that.

---

## 4. How we beat the competition

| Category | Incumbents | Their edge | Where we win |
|---|---|---|---|
| SEO suites | Semrush, Ahrefs, Screaming Frog, Surfer | Proprietary indexes, backlink graphs, rank tracking | Free, no account, instant; grounded in *your* live page; fixes written for you (handoffs → Schema/Meta/Sitemap); honest caveats; hand-off to humans |
| AI copy | Jasper, Copy.ai, ChatGPT | Brand voice, templates | Brand profile + live-page grounding; variants designed as real A/B tests with measurement plans; artifacts, not chat text |
| Design | Canva | Templates, breadth | Not a competitor for layout; we win on *derived* assets: brand kit, ad sizes, OG cards, QR — generated from the profile in seconds |
| Clipping | OpusClip, Submagic, Descript, BIGVU | ClipAnything, virality scores, reframing, schedulers | Free minutes with no watermark on the first tier; clips as *marketing* deliverables (hook, CTA, brand template) tied to the campaign calendar; transcript reused across repurposing skills; honest "shortlist, not prediction" scoring |
| Automation | Zapier, Make | Breadth of integrations | We don't do plumbing; we do jobs. Planner + approvals instead of a flow builder |
| Site builders | Lovable, Bolt, Framer | Full-site generation | Out of scope for tools; the agency does it. The agent produces the brief, the copy, the SEO and the launch checklist |
| Generic assistants | ChatGPT, Claude, Gemini | Everything | Skills with real engines and deliverables; memory of *this* business; evaluated outputs; a human team one click away |

The moat is compounding: profile → audit → fixes → calendar → clips → report → hand-off, all in one thread with one memory. Point tools cannot follow a user across that arc.

---

## 5. The missed batch (STRATEGY §12.2) and how it lands as skills

| Tool | v1 (skill) | v2 | Depends on | Cost class |
|---|---|---|---|---|
| **Transcriber** | Upload audio/video (≤ 2 h) → transcript with timestamps, speakers, filler-word map; TXT/SRT/VTT/JSON; chapter summary | Live mic mode; translation; glossary from brand profile | Server ASR (Whisper/gpt-4o-transcribe/Deepgram via gateway or direct key); chunked uploads to Blob; 300 s function budget ⇒ chunk by 10 min | media |
| **Clipping** | Transcript → candidate moments ranked by hook/self-containment/topic shift with an *explained* score; in-browser trim via ffmpeg.wasm; caption burn-in with brand template; 9:16/1:1/16:9 crop with manual subject anchor; export MP4 + captions file | Speaker-tracked auto-reframe; natural-language "find the part about pricing" (already possible against the transcript); B-roll suggestions; direct post via connections; XML for Premiere/Resolve | Transcriber; brand kit (fonts/colours); campaign calendar (clips become scheduled entries) | media |
| **Content repurposing** | Transcript or long article → thread, LinkedIn post, newsletter section, quote cards (OG-card engine), show notes | Platform previews; scheduling | Transcriber, OG card generator | model |
| **Demo video captions** | Recorder output → Transcriber → captions burned in | Trim, chapters, branded outro | Transcriber | media |
| **QA test plan generator** | URL → crawl (existing engine) → QA checklist + Playwright skeleton (loads, forms, console errors, links, viewport) | Plain-English flow → test file | crawl engine | model |
| **Competitor ad intelligence** | Domain/page → active ads from Meta Ad Library, Google Ads Transparency, TikTok CCL, LinkedIn; creative themes, hooks, landing pages; CSV | Change alerts | External APIs; scheduled jobs | external |
| **Reverse image lookup** | Redirect to Lens/TinEye/Bing with the image; pHash dedupe across the user's Vault | — | Vault | free |
| **Business name + trademark check** | Extends Brand Creator: USPTO + domain + social handles | Formation partner hand-off | USPTO API | external |
| **Phone lookup, burner email, business formation, supplier intel** | Defer. Partner APIs, abuse surface, or licensed data; none strengthen the agent. Revisit after connections exist. | | | |

Sequencing inside the batch: Transcriber → Clipping v1 → Repurposing → Demo captions (one engine, four skills), then QA generator and Ad intelligence (reuse crawl + external reads), then the checks.

Also add, because the agent needs them and they're cheap: **OG/social card generator** (image from title/brand), **UTM builder**, **ICP/persona generator** (feeds the brand profile), **subject-line deliverability checker**, **press release** (Document skill with a template), **image generation** for heroes and ad creative (gateway image models).

---

## 6. Sequence (capabilities, each wave ships whole)

### Wave A — Everything is a skill
- Skill manifest type + registry; migrate the 22 runtimes with zero behaviour change.
- Convert remaining server legacy tools (DNS/Email Health, Accessibility, Security Headers, SSL, Email Finder) to chat skills — engines exist, each is an afternoon.
- Browser-skill bridge (`onToolCall`) and convert image/media client tools (Converter, Watermark, Metadata Remover, Background Remover, Ad Resizer, Brand Kit, Recorder). Files stay on-device.
- Result: 40/40 tool pages on one kernel; `?q=` handoffs everywhere.

### Wave B — Brand profile, Vault, controls
- Brand profile skill: extract from a URL + attachments (logo colours, voice, audience, proof points), confirm with the user, store in IndexedDB; inject into every skill.
- Vault: artifacts saved with skill id, inputs, version; searchable; referenced by later skills ("use last month's audit").
- Artifact controls: parameter chips, regenerate-section, versions/diff, pin/lock, "more like A".
- Quality: golden sets for every skill; `npm run evals`; LLM-judge rubric for creative skills.

### Wave C — The agent
- `/agent` workspace (chat, artifact rail, plan panel, Vault).
- Router over all skills; planner with approval gates; run log; memory extraction with confirmation.
- Job templates: Launch checklist, Fix my SEO, Monthly client report, Campaign in a week, Local presence.
- Tool pages get "continue in the agent"; upsell hand-off attaches the run log.

### Wave D — Media
- Transcriber → Clipping v1 → Repurposing → Demo captions. ffmpeg.wasm client pipeline; server ASR with chunking; brand caption templates; media-minute budget per client (free tier generous, watermark-free, account for more).

### Wave E — Data and monitoring
- Connections: Search Console, GA4, GBP, GitHub, Vercel. Accounts (magic link/passkey), Neon, Blob.
- Scheduled jobs: page-change monitor, index/rank checks, monthly report → white-label PDF.
- Competitor ad intelligence, QA generator, trademark check, OG cards, UTM, persona, image generation.

### Wave F — Enterprise
- Teams/workspaces, roles, audit log export, SSO, data retention controls, white-label everywhere, outbound API/MCP so agencies can drive the skills from their own stack.

---

## 7. Engineering notes and constraints

- **Function budget**: Vercel Pro fluid compute gives 300 s. Anything longer (ASR on long files, crawls > 100 pages) chunks client-side or runs as a queued job with progress. Don't take on a worker fleet before Wave E.
- **Client compute first**: ffmpeg.wasm, image ops and background removal already run in-browser; that's zero marginal cost and the privacy story. Server only for models, ASR and fetches.
- **Cost classes gate, not paywalls**: free tools stay free; media minutes and scheduled jobs are the natural account triggers.
- **Models**: keep the fallback chain; add an `image` kind and a `transcribe` kind to `modelChain`. Vision is now used (attachments) — Sonnet 4.6 primary.
- **Testing**: engines → vitest; skills → golden sets; UI → the Puppeteer harness we already use, promoted into `web/e2e`.
- **Don't build**: a flow builder, a generic tool registry UI, MCP-in-the-operator-UI, a rival crawl index, people-search.

---

## 8. Decisions to take (don't block Wave A)

1. Account model timing — Wave B anonymous IndexedDB is enough until connections; confirm we hold "no account for single-use" forever.
2. ASR provider and media budget — gateway-routed if transcription is supported, otherwise a direct provider key; agree free minutes/month and the account threshold.
3. Image generation — turn on for heroes/OG/ad creative (cost class `model`, capped) or keep imagery client-derived only.
4. Which two job templates ship first in `/agent` — proposal: "Fix my SEO" (all engines exist) and "Campaign in a week" (calendar + variants + newsletter + clips).

## 9. Immediate next build

Wave A in full (skill manifest, five legacy conversions, browser-skill bridge) plus Transcriber v1 and Clipping v1 as the first media skills — they unblock the batch that was missed and give the agent something no free competitor offers without a watermark.
