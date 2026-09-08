# Agentic Marketing OS — How Launchabl Becomes a Platform

Date: 2026-09-08
Status: direction (not an implementation plan)
Audience: founders, marketers, freelancers, and small agencies — not developer-tool-calling users
Depends on: `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md`  
Capability catalog (what the agent may do, tools, APIs): `docs/superpowers/specs/2026-09-08-agent-capability-catalog.md`

---

## The trap

A generic agentic platform looks like CrewAI, LangGraph, or OpenAI Agents: a chat box, a tool registry, OpenAPI specs, MCP servers, and a model that picks functions. That product is for people who already think in tools and schemas.

Launchabl's buyer thinks in **jobs**: launch a brand, get found, send a client a report, protect assets before they go live. They already have Google, Shopify, Meta, and a website. They will not paste an OpenAPI spec. They will connect Search Console the same way they connect it to Looker Studio.

So the platform is not "ChatGPT with our tools." It is **crews that do marketing jobs**, with approvals, skills, and connections — named in their language.

Positioning stays the same: tools acquire, the unlimited plan monetizes, case studies convert. Agentic is how tools stop being a junk drawer and start compounding.

## Vocabulary (UI vs internals)

| What we say to them | What it is internally |
|---|---|
| Job | Outcome cluster (`launch`, `get-found`, `audits-reports`, …) |
| Agent | A run that owns one policy and one deliverable |
| Skill | A named capability with a human label (`Check the live page`, `Write 5 headlines`) |
| Connection | OAuth / API key to *their* system (Search Console, Shopify, GBP) |
| Approval | Human-in-the-loop gate before anything ships or downloads |
| Vault | Saved outputs that later jobs can read |
| Hand off | Unlimited-plan humans take the same job the rest of the way |

Never put "MCP," "function calling," or "system prompt" in the operator UI. Those are implementation.

## Two kinds of API — inbound first

**Inbound (do this first).** Launchabl *calls their APIs* as skills.

- Google Search Console, Analytics, Business Profile
- GitHub (their repos) and Vercel (preview + production)
- Shopify / Woo product catalogs
- Webflow / WordPress as an alternate publish path
- Meta / Google Ads libraries (public + their ad accounts)
- HubSpot / email ESP for campaigns they already run
- USPTO TESS/TSDR for trademark search (logo jobs)

Each connection is a skill pack: `gsc.list-queries`, `shopify.list-products`, `gbp.update-description`. The operator sees "Connected: Search Console," not a token form.

**Outbound (do this second).** Launchabl *is* an API for people who already have a stack.

- Jobs API: `POST /v1/jobs/website-audit` with a URL, webhook when the report is approved
- MCP server for agencies who live in Cursor/Claude — same skills, same approvals
- Zapier / Make so a "new Shopify product" can start a schema + OG image run

Outbound is how white-label agencies and technical founders plug Launchabl in. It is not how we acquire the core audience.

## Five layers (build in this order)

```
5  Unlimited humans     same job, people finish what the agent cannot
4  Outbound API / MCP   agencies automate Launchabl from their stack
3  Connections          their Google / Shopify / Meta as skill packs
2  Job crews            one graph, many skills, one client-ready deliverable
1  Agent Run Studio     each heavy tool is already an agent (current plan)
0  Tools + clusters     what exists today
```

Layer 0 is live. Layer 1 is the studio plan (`docs/plans/2026-09-08-agent-approval-studio.md`). How layers 1–5 stay one workflow (accuracy envelope, Vault, crews, GitHub/Vercel gates) is `docs/plans/2026-09-08-agent-delivery-os.md`. Do not skip 1: without a real run surface, crews and APIs have nowhere to show work.

### Layer 1 — One tool, one agent

Website audit is an agent whose skills are `fetch-page` and `score-page`. Watermark's skills stay in the browser. The operator approves before download. This is the kernel every later layer reuses: policy, skill log, approve, export.

### Layer 2 — Job crews

A crew is a bigger DAG for a *job*, not a single tool.

Example: **Get found**

1. Intake: domain (and optional GSC connection)
2. Skills: fetch site, score technical SEO, read GSC queries if connected, draft schema, draft title/meta
3. Review: operator approves the package
4. Deliver: zip + copy-paste snippets; optional "Hand off to unlimited" to implement site-wide

The white-label report builder is the first crew hiding in the product today — it already wants outputs from other tools. Crews make that the default: Vault items become skill inputs.

### Layer 3 — Connections as skills

A connection is not a generic HTTP tool. It is a **narrow, job-shaped pack**:

- Search Console → "queries you already rank for," "pages with impressions but no clicks"
- GitHub → "your site repo," "open a pull request"
- Vercel → "preview URL," "publish the live site"
- Shopify → "products missing description / alt text"
- GBP → "description, categories, Q&A"

Auth is OAuth with the smallest scope. Skills that need a connection show a Connect button in the scan timeline, not a developer settings page. If they skip connect, the crew still runs on public fetch (what we do now) and labels the gap: "Connect Search Console to see query-level gaps."

### Layer 4 — Outbound API / MCP

Same skills, same approval policy, machine entry.

- API keys for agencies (not the free anonymous converter path)
- Every write still hits a review step unless the key is explicitly "auto-approve exports" on a paid seat
- MCP exposes *jobs* (`run_website_audit`, `build_brand_kit`), not raw `fetch`

This is how Launchabl stays the OS when the operator lives in Slack, Cursor, or their own dashboard.

### Layer 5 — Humans as the last skill

The unlimited plan is not a separate product. It is the terminal node when the crew cannot finish: attorney filing for a crowded mark, photography, complex CMS, produce the campaign. The agent already collected the brief, the scan, the repo, and the approval. Hand-off is a skill: `request-unlimited` with the Vault (and repo) payload attached.

## What a skill actually is

```
Skill
  id          fetch-page | gsc.top-queries | composite-watermark
  label       Check the live page
  audience    get-found | audits-reports | protect | …
  processing  client | server | partner
  needs       none | connection:gsc | file:image
  input       typed payload
  output      typed payload other skills can consume
```

Tools on the site are **SKUs** (pages that start a run). Skills are **reusable**. The audit page, the grader, and the gap report already share a fetch engine — that engine is the first shared skill, just not named yet.

The model (when we add one) only *chooses among declared skills for that job*. It cannot invent a new HTTP call. That is how we stay safe and on-brand.

## Approvals stay the product

Marketers ship to customers and to Google. A platform that auto-publishes schema or ads without a gate will get them banned or sued.

Every crew ends in review. Writes to connected systems (GitHub push, Vercel production, GBP update, Shopify description, Webflow publish) are a louder gate: **Approve push** (first repo write) and **Approve publish** (live URL / CMS). Downloads stay the first gate.

Anonymous free runs: no outbound API, no publish connections, still have Approve-to-download. Accounts unlock Vault + connections. Unlimited unlocks humans.

## What we will not build (on purpose)

- A general "add any OpenAPI spec" tool store — that is Zapier's job, and it trains the wrong user
- A blank chat that can do anything — that competes with ChatGPT and dilutes the clusters
- Letting the model call arbitrary URLs with the operator's tokens
- Replacing the unlimited agency with agents — agents brief and draft; humans still ship the hard work

## Sequence that matches the audience

1. Ship Agent Run Studio on audit + watermark (layer 1). They already understand "watch it work, then approve."
2. Name the shared engines as skills in code (`fetch-page`, `score-seo`, `dns-lookup`). No new UI yet.
3. Brand Vault so outputs persist. Crews are useless without memory.
4. First crew: **Audits & reports** (audit + grader + gap → one white-label report). This is the freelancer/agency wedge.
5. First connection: Search Console on Get found. One OAuth, obvious payoff.
6. Jobs API for the same audit the studio already runs. Agencies ask for this; marketers never see it.
7. GitHub + Vercel with Approve push / Approve publish (default website path). Webflow/Shopify remain alternates.
8. MCP for the same jobs, for operators who already live in an IDE.

Each step is still a diagnostic that points at the unlimited plan. That is the strategy, unchanged.

Must-have packs (research, trademark-ready logos, marketing-site code in GitHub, Vercel publish, SEO, accuracy/efficiency) and the service-coverage matrix live in the capability catalog. This document stays the platform shape; that one stays the "what it is allowed to do."

## Success test

A freelancer can: connect GitHub and Vercel, run Launch, approve a trademark-ready logo kit (with a cited register search), approve a push to their repo, open the preview URL, approve production, and still click "Have Launchabl finish this" if they want hosting owned or an attorney to file. They never saw an API key, a prompt, or a tool-calling log labeled as such. They saw a job, skills with plain names, and an approval.
