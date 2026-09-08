---
title: Agent Delivery OS — workflow, accuracy, and ship path
date: 2026-09-08
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
origin: docs/superpowers/specs/2026-09-08-agent-capability-catalog.md
---

# Agent Delivery OS — workflow, accuracy, and ship path

Wave 1 (studio kernel) is already specified in `docs/plans/2026-09-08-agent-approval-studio.md`. This plan is how the rest of the catalog gets **wired** so every later capability uses the same run, the same proof, and the same deliver dock.

## Goal Capsule

Build Launchabl so an operator finishes a marketing job the way they already think: brief → watch work with proof → approve the matching gate → leave with a real artifact (report, logo kit, repo, live URL). Accuracy is part of the run, not a later QA pass.

Authority: user request to plan the build so delivery and workflow match what users want, on top of the catalog at `docs/superpowers/specs/2026-09-08-agent-capability-catalog.md` and the studio spec at `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md`.
Stop when Waves 1–10 below have shipped in order, each wave leaving a complete operator loop (not a half-wired API), `npm run lint` and `npm run build` pass in `web/`, and converters plus `/tools` stay as they are.
Do not add CrewAI, CopilotKit, a paste-any-OpenAPI tool store, or a blank chat as the product.

## Product Contract

### Requirements

Workflow (what the page *is*):

- R1. Every job and every approval-gated tool uses the same studio: DAG left, active-step dock right, thin run bar. No "Delivery flow" bars, no form card under a diagram.
- R2. The visible DAG stays four steps: Submit → Scan → Review → Deliver. Extra work (trademark search, git, Vercel) shows as **skills** in Scan and as **gates** in Deliver, not as an eight-node graph.
- R3. Scan is a skill timeline. Each skill has an operator label ("Check the live page"), status queued / running / done / failed, and a one-line result. Internal ids stay out of the UI.
- R4. Review always shows **the thing they will get** before any gate: report, kit preview, copy, file list, and/or Vercel preview iframe. Approve is signing off on that artifact, not on a paragraph of status text.
- R5. Deliver is the only place export, push, and publish controls live. Three gates, used when the job needs them: **Approve** (download/copy), **Approve push** (first write to their GitHub), **Approve publish** (Vercel production / CMS / GBP). A job that only needs a zip never shows push/publish.

Accuracy (what they can trust):

- R6. Every number and ranking in a deliverable carries a source chip: `live fetch`, `Search Console`, `USPTO`, `operator-provided`, or `Vercel`. Missing source → the skill fails or the field is omitted. Never invent rank, traffic, spend, or "you're cleared."
- R7. Required accuracy skills for that job must finish `done` before Review. Examples: research jobs require `verify-url` + `cite-source`; logo jobs require `logo.vector-check` + `trademark.search` (search may return a labeled gap if the register API is down — it may not be skipped); git writes require `git.diff-review`.
- R8. Failed skills keep the run on Scan. Retry is in the dock. Deliver stays locked. No silent fallback scores.
- R9. Gaps are labeled, not filled. "Connect Search Console to see queries" and "Connect GitHub to save a repo" are first-class review copy. The rest of the job still completes on public fetch / zip.

Delivery (what they take away):

- R10. An approved run produces a typed `Deliverable` (see KTD2) saved to Vault when persistence exists. Later jobs can pick it as input (white-label report, Launch).
- R11. Client-side tools never upload files. Server skills use existing or new Next.js routes. Partner skills (GitHub, Vercel, USPTO, image models) use isolated clients — one vendor per module, never a shared "HTTP tool."
- R12. Connections appear as Connect on the skill card that needs them, not a developer settings dump. Anonymous: zip/download only. Account: Vault + OAuth. Unlimited: `Hand off to Launchabl` with the same payload.
- R13. Converters without a delivery policy stay forms. `/tools` stays the catalog map.
- R14. Operator copy never says MCP, function calling, PAT, git remote, or system prompt.

### Actors

- Operator: founder, marketer, freelancer, or small-agency user.
- Agent: one run bound to one job or tool policy.
- Skill: named capability with a typed result (payload + sources + warnings).
- Connection: GitHub, Vercel, GSC, etc., attached to skills that declare `needs`.
- Unlimited human: last skill `handoff-unlimited`, same deliverable.

### Flows

- F1. Diagnostic (audit): URL in Submit → fetch/score skills → Review with sourced findings → Approve → Download report in Deliver.
- F2. Produce (watermark / copy / schema): intake → in-browser or server skills → Review preview → Approve → Download/copy.
- F3. Identity (logo kit): brief → generate + vectorize + USPTO search → Review kit + conflict report → Approve → Download kit (Vault).
- F4. Site (no git): brief → scaffold + SEO inject + a11y → Review iframe → Approve → Download zip.
- F5. Site (connected): same as F4 through Review, then Deliver shows Approve push (file list) then preview URL, then Approve publish (production).
- F6. Crew (Launch / Audits): one Submit, many skills across packs, one Review of the composed package, Deliver gates as needed, optional Hand off.
- F7. Failure: skill fails → Scan stays current → Retry → no gate unlocks.
- F8. Reset: run bar clears intake, log, output, gates.

### Acceptance examples

- AE1. `/tools/website-audit-report` matches the studio plan AE1, and every score/finding names `live fetch` plus `fetchedAt`.
- AE2. Watermark never posts image bytes; Download only after Approve.
- AE3. Logo kit Download is disabled until vector-check passes and trademark search has either hits+citations or an explicit "register unavailable" warning. UI never says "trademark cleared."
- AE4. Launch with GitHub+Vercel connected: after Review, Deliver offers zip, then Approve push (file list), then a preview URL, then Approve publish. Production URL appears only after the last gate.
- AE5. Launch with no connections: zip + kit still deliver; Review lists the two Connect gaps.
- AE6. QR / image converter unchanged. `/tools` map unchanged.

### Product scope

In: studio kernel, typed skill runtime, accuracy envelope, Vault, first crew (audits), logo kit path, Next.js marketing scaffold, GitHub, Vercel, Launch crew.
Out: custom app engineering, ad spend, CrewAI/CopilotKit, OpenAPI tool store, GitLab/Netlify as v1, attorney filing, JS-rendered crawl (labeled gap until a later wave).

## Planning Contract

### Key technical decisions

- KTD1. One studio, four DAG nodes, forever. Scan absorbs new skills. Deliver absorbs new gates. Exploding the graph into Research / Logo / Git / Vercel nodes would train operators to "manage a pipeline." They want to watch one job and ship. Website jobs that need push+publish still use Deliver with stacked gates, not extra nodes.
- KTD2. Typed `Deliverable` is the unit of truth. Skills return `SkillResult`. The agent reduces results into one deliverable the dock can render. Vault stores deliverables, not chat transcripts.

```
SkillResult
  id, label
  status: queued | running | done | failed
  payload: unknown (per-skill)
  sources: { kind, href?, retrievedAt, note }[]
  warnings: string[]

Deliverable
  kind: report | kit | copy | zip | repo | preview | production
  title
  artifacts: { name, mime, bytes? | url? | text? }[]
  sources[]
  warnings[]
  gates: { download?: 'locked'|'ready'|'done', push?: ..., publish?: ... }
```

- KTD3. Accuracy is a runner invariant, not a prompt. `web/src/lib/skills/runtime.ts` will not `advance('review')` while any skill in `agent.requiredAccuracy` is not `done`. The model (when added) may only pick from `agent.skills`. It cannot invent HTTP or skip accuracy ids.
- KTD4. Skills are modules with a registry, not LLM tools. First registry lives in `web/src/lib/skills/`. Each skill is `{ id, label, processing, needs, run(ctx) }`. Studio Wave 1 hard-wires ordered lists (already in the studio plan). Later waves keep that; a model only chooses among declared ids for that job.
- KTD5. Extract engines before adding vendors. `fetch-page` already exists inside `web/src/lib/site-audit.ts` (`auditUrl` returns `url` + `fetchedAt`). Name it and reuse it. Do not wrap a new crawler for logo or Launch. GitHub/Vercel/USPTO/image vendors get their own isolated clients under `web/src/lib/connections/`.
- KTD6. Vault before crews. White-label report and Launch are composition. Composition without memory is copy-paste, which is the workflow users hate. Wave 4 is IndexedDB (anonymous, this browser). Wave 8+ accounts sync the same shape to the server. Do not invent a second "project files" UI.
- KTD7. Next.js + GitHub + Vercel is the default site path. HTML zip and Webflow spec are fallbacks when they refuse git. Do not lead with zip-upload-to-Vercel.
- KTD8. Procedural vectors can ship the logo **workflow** before the image vendor is chosen. `logo.vector-check` and the kit zip and USPTO-shaped search (even stubbed as a labeled gap) are the accuracy wiring. Swap `logo.generate-system` internals later without changing gates.
- KTD9. Accounts are required for OAuth, not for Studio. Wave 1–5 work anonymous. Wave 8 GitHub App install needs a user. Pick Clerk or the existing host auth at execution; isolate it behind `web/src/lib/connections/session.ts` so the studio does not import the vendor SDK.
- KTD10. Interaction model stays CrewAI-like (graph + HITL + generative dock). Runtime stays Next.js. A Python agent server would break in-browser watermark/kit tools.

### Technical design

**Run state** extends `web/src/components/tools/delivery-run.tsx`:

- Keep `policy`, `currentId`, `delivered`, `approve`, `reset`, `setPhase`.
- Add `intake`, `skillLog: SkillResult[]`, `deliverable`, `error`, `runScan()`, `runGate('push'|'publish')`.
- `delivered` today means "download unlocked." Split into `gates` per KTD2 so push/publish are not fake-downloads.

**Studio shell** from the studio plan: `agent-studio.tsx`, `agent-dock.tsx`, `skill-timeline.tsx`. Review dock is a switch on `deliverable.kind`. Deliver dock renders only unlocked gates.

**Skill runner** (`web/src/lib/skills/runtime.ts`): sequential await, update log after each skill, abort to failed, then accuracy check, then `setPhase('review')`.

**Policies:** keep `web/src/lib/tool-delivery.ts` four-step policies for tools. Job crews (`launch`, `audits-reports`) reuse the same `linearPolicy` helper. Do not add DAG nodes for connections.

**New job entry:** `/jobs/launch` (and later `/jobs/get-found`) is a studio page with a `ToolAgent`-shaped config. Tool SKUs remain SEO acquisition; they start the same runtime with a subset of skills. Do not make operators learn two UIs.

**Files (target map):**

| Area | Path |
|---|---|
| Studio UI | `web/src/components/tools/agent-studio.tsx`, `agent-dock.tsx`, `skill-timeline.tsx` |
| Run state | `web/src/components/tools/delivery-run.tsx` |
| Agent configs | `web/src/lib/tool-agents.ts` then `web/src/lib/jobs/*.ts` |
| Skill registry | `web/src/lib/skills/index.ts`, `runtime.ts`, one file per pack (`fetch-page.ts`, `logo.ts`, …) |
| Deliverable types | `web/src/lib/deliverable.ts` |
| Vault | `web/src/lib/vault.ts` (IndexedDB), later `web/src/app/api/vault/` |
| Connections | `web/src/lib/connections/github.ts`, `vercel.ts`, `uspto.ts`, `gsc.ts` |
| Site audit engine | `web/src/lib/site-audit.ts` (keep `AuditResult` shape; call from `fetch-page` skill) |
| Job routes | `web/src/app/jobs/[slug]/page.tsx` |

### Assumptions

- A1. Users want **one job, proof, ship** — not a node editor and not a chat log.
- A2. "Trademark-ready" is the kit + cited search (catalog), not legal certification.
- A3. Preview URLs are more convincing than screenshots; until Vercel exists, in-studio iframe/preview is enough for F4.
- A4. USPTO and image vendors may lag; the **gates** must exist on time even if the partner returns a labeled gap.
- A5. Existing `ApproveGate` and `ToolDeliveryCanvas` go away once a slug is on `AgentStudio` (studio plan U5).

### Sequencing

Do not skip waves. Each wave is a complete loop you can put in front of a user.

```
W1  Studio kernel          audit + watermark (existing studio plan)
W2  Accuracy envelope      SkillResult + sources + requiredAccuracy
W3  Shared engines         fetch-page / score-* named, used by audit tools
W4  Vault                  save approved deliverable, pick as input
W5  Audits crew            audit + grader + gap → one report
W6  Logo kit path          vector-check + search + kit zip on identity kit
W7  Site scaffold          Next.js marketing zip + iframe preview
W8  GitHub                 Approve push, operator-owned repo
W9  Vercel                 preview on push, Approve publish
W10 Launch crew            logo + site + repo + preview in one job
```

W1 is implementation-ready today. W8–W9 need OAuth apps (deferred vendor setup, not deferred product shape). W6 generate-system internals may stay procedural until a licensed image vendor is picked (KTD8).

## Implementation Units

### U1. Studio kernel (Wave 1)

Files: as listed in `docs/plans/2026-09-08-agent-approval-studio.md` (U1–U6 there).
Test: `web/src/lib/tool-agents.test.ts` plus the studio plan's Playwright/puppeteer AEs.
What: Split studio, skill timeline, audit + watermark, then the other eight delivery slugs. Converters untouched.
Depends on: none.
Test scenarios: studio plan AE1–AE4, F3, F4.
Do not start U2 until audit and watermark are studios and export is dock-only.

### U2. Accuracy envelope (Wave 2)

Files:
- Create: `web/src/lib/deliverable.ts`
- Create: `web/src/lib/skills/runtime.ts`
- Create: `web/src/lib/skills/accuracy.ts` (`assertSources`, `requiredDone`)
- Modify: `web/src/components/tools/delivery-run.tsx` (`skillLog`, `deliverable`, `gates`)
- Modify: `web/src/lib/tool-agents.ts` (`requiredAccuracy: string[]`)
- Modify: `web/src/components/tools/website-audit-report.tsx` (source chips on findings)
- Test: `web/src/lib/skills/runtime.test.ts`, `web/src/lib/skills/accuracy.test.ts`

What: Skill results always carry `sources` / `warnings`. Runner will not enter Review if `requiredAccuracy` failed. Audit review shows `live fetch` + timestamp from existing `AuditResult.fetchedAt`. Metrics without a source cannot be added to the deliverable reducer.

Depends on: U1.

Test scenarios:
- Audit finding renderer shows source chip; omitting `fetchedAt` fails the unit test.
- Runner with a failed `cite-source` stays on scan.
- Deliverable reducer drops a field that has no source.

### U3. Shared fetch engine (Wave 3)

Files:
- Create: `web/src/lib/skills/fetch-page.ts` (wraps `auditUrl` / shared fetch)
- Modify: `web/src/lib/site-audit.ts` only if a thin `fetchPage` helper is needed
- Modify: landing grader, competitor gap, broken-links, security-headers, ssl, a11y to call the same helper (server routes already split; unify the fetch, not the scores)
- Test: `web/src/lib/skills/fetch-page.test.ts`

What: One live GET, one `retrievedAt`, many scoring lenses. Studio skill lists for those tools start with `fetch-page`.

Depends on: U2.

Test scenarios:
- Two scoring functions on one fixture HTML produce two reports and one shared `fetchedAt`.
- Existing `/api/site-audit` response shape stays compatible (`AuditResult` fields unchanged).

### U4. Browser Vault (Wave 4)

Files:
- Create: `web/src/lib/vault.ts`
- Create: `web/src/components/tools/vault-picker.tsx`
- Modify: deliver dock to "Save to Vault" after Approve
- Modify: `web/src/components/tools/white-label-report-builder.tsx` intake to pick vault items
- Test: `web/src/lib/vault.test.ts`

What: IndexedDB store of `Deliverable` JSON (no file bytes over a size cap; store blob handles). Anonymous, per-browser. Copy: "Saved on this device until you create an account."

Depends on: U2.

Test scenarios:
- Approve audit → save → reload page → picker lists the report title.
- White-label scan can attach that item without re-pasting scores.
- Clearing site data empties vault (documented, not a bug).

### U5. Audits & reports crew (Wave 5)

Files:
- Create: `web/src/lib/jobs/audits-reports.ts`
- Create: `web/src/app/jobs/audits-reports/page.tsx` (or `/tools/white-label-report-builder` becomes the crew and other tools remain SKU on-ramps)
- Modify: skill list composes fetch + score-seo + score-landing + gap + compose-report
- Test: `web/src/lib/jobs/audits-reports.test.ts`

What: One Submit (your URL + optional competitors + agency brand). One Review (composed report). One Approve. This is the first crew and the freelancer wedge. SKU pages can "Add to report" via Vault instead of forcing the crew.

Depends on: U3, U4.

Test scenarios:
- Crew with one URL still delivers a report (gap section labeled "no competitors").
- Crew with vault audit + fresh grader does not double-fetch if `reuse-fetch` matches URL+day.
- DAG still four nodes.

### U6. Trademark-ready logo path (Wave 6)

Files:
- Create: `web/src/lib/skills/logo.ts`, `web/src/lib/skills/trademark.ts`
- Create: `web/src/lib/connections/uspto.ts` (real client or labeled-gap stub)
- Modify: `web/src/components/tools/brand-identity-kit.tsx` and `brand-creator.tsx`
- Modify: `web/src/lib/tool-agents.ts` requiredAccuracy: `logo.vector-check`, `trademark.search`
- Test: `web/src/lib/skills/logo.test.ts`

What: Kit zip = SVG+PDF+PNG colorways+specimen+guidelines. Vector-check rejects raster-only SVG. Trademark search cites serials or shows "register unavailable." Review shows both kit and conflict report. No "cleared" copy.

Depends on: U2, U4.

Test scenarios: AE3. Kit without PDF/SVG fails vector-check. Stubbed USPTO still reaches Review with a warning, never with a clearance sentence.

### U7. Marketing site scaffold (Wave 7)

Files:
- Create: `web/src/lib/skills/web-scaffold.ts`
- Create: `web/src/lib/jobs/launch-site.ts` (or tool slug `marketing-site-builder`)
- Create: scaffold templates under `web/src/lib/site-templates/marketing/`
- Modify: studio Review dock iframe for `deliverable.kind === 'zip'`
- Test: `web/src/lib/skills/web-scaffold.test.ts`

What: Generate a small Next.js App Router marketing site (Home/About/Contact/legal stubs) with injected title/meta/schema and `public/brand/` placeholders. Preview in iframe (static export or bundled preview). Approve → zip. No GitHub yet.

Depends on: U2. Uses Vault logo if present (U4/U6), otherwise placeholder mark + warning.

Test scenarios:
- Zip contains `app/page.tsx`, `public/brand/`, JSON-LD script.
- `web.a11y-pass` warnings surface in Review; they do not block Approve unless critical (missing H1).
- Four DAG nodes.

### U8. GitHub repo control (Wave 8)

Files:
- Create: `web/src/lib/connections/github.ts`
- Create: `web/src/app/api/connections/github/` callback routes
- Create: `web/src/lib/skills/git.ts`
- Modify: Deliver dock stacked gate Approve push
- Modify: session helper `web/src/lib/connections/session.ts`
- Test: `web/src/lib/skills/git.test.ts` (mock octokit)

What: GitHub App. Create repo, commit branch, open PR. `git.diff-review` lists files in Review/Deliver. Anonymous jobs keep zip only. No force-push, no delete, no secrets in skill log.

Depends on: U7, accounts (KTD9). Deferred: App id/private key in env.

Test scenarios: AE4 push half — file list visible, push button absent until Approve push, zip still available.

### U9. Vercel publish (Wave 9)

Files:
- Create: `web/src/lib/connections/vercel.ts`
- Create: `web/src/lib/skills/vercel.ts`
- Create: `web/src/app/api/connections/vercel/`
- Modify: Deliver dock Approve publish; Review iframe prefers preview URL when present
- Test: `web/src/lib/skills/vercel.test.ts` (mock)

What: Link project to the GitHub repo. Preview URL after push. Production + optional domain after Approve publish. Failed build = failed skill with log summary.

Depends on: U8.

Test scenarios: AE4 full. AE5 (no connection) still zips. Production URL hidden until publish gate.

### U10. Launch crew (Wave 10)

Files:
- Create: `web/src/lib/jobs/launch.ts`
- Create: `web/src/app/jobs/launch/page.tsx`
- Modify: nav CTA from pricing/solutions "Start a launch" → this studio when ready
- Test: `web/src/lib/jobs/launch.test.ts`

What: One Submit (business brief, optional domain, optional connections). Skills: research fetch if URL given, logo pack, scaffold, inject SEO, vault write, optional git/vercel. One Review of kit + iframe/preview + search report + sourced audit if URL. Deliver gates per R5. Hand off button packs the deliverable.

Depends on: U5–U9 (U8/U9 optional at runtime; required to *code* the gates).

Test scenarios: AE4, AE5, and "Hand off" includes vault id + repo url + warnings list. DAG still four nodes.

## Verification Contract

Repo commands (from `web/`):

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

Per wave: unit tests named in each unit. Behavioral checks against `next start` (Chrome/puppeteer as used on the toolbox work):

- After U1: studio plan AE1–AE4
- After U2: audit source chips visible
- After U5: `/jobs/audits-reports` or upgraded white-label crew completes with four nodes
- After U6: AE3
- After U7: zip + iframe
- After U9: AE4 on a throwaway GitHub/Vercel (or recorded mock)

No new CI job required unless `web/package.json` already has `test`; if unit tests are added, wire `"test": "vitest run"` or the runner the repo standardizes on in U2.

## Definition of Done

Global:

- R1–R14 hold for every job/tool on the studio.
- A user can complete F1 and F2 without reading About copy.
- A user can complete F5 when connected, or F4/AE5 when not.
- No deliverable ships a number without a source.
- Lint, tsc, production build clean.
- Catalog and this plan still match; update them if gates or DAG change.

Per unit: the test scenarios in that unit pass, and the operator loop for that wave is demoable without a second UI.

## Appendix

### Why this order

Studio without accuracy types teaches a pretty DAG that still lies. Accuracy types without Vault cannot compose. Logo/git/Vercel without the studio is a settings page. Launch without the pieces is a slide deck. Each wave is something a marketer can finish in one sitting.

### Relationship to other docs

| Doc | Role |
|---|---|
| `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md` | Wave 1 UI |
| `docs/plans/2026-09-08-agent-approval-studio.md` | Wave 1 execution packet (do this first) |
| `docs/superpowers/specs/2026-09-08-agent-capability-catalog.md` | What the agent may do |
| `docs/superpowers/specs/2026-09-08-agentic-marketing-platform.md` | Layers 0–5, inbound vs outbound APIs |
| This file | How it is built so workflow and delivery stay one product |

### Deferred (non-blocking for W1–W5)

- Image + vector vendor commercial license (W6 internals).
- GitHub App vs OAuth App (recommendation remains GitHub App).
- Clerk vs other auth (hide behind `session.ts`).
- USPTO vs multi-register.
- JS-rendered fetch / Lighthouse.
- Outbound Jobs API / MCP (platform layer 4, after W10).

### Rejected

- Chat-first CopilotKit as the operator UI — loses the approval canvas and the "watch it work" loop.
- Per-vendor mini-apps (a GitHub page, a Vercel page) — splits delivery.
- Auto-publish on Approve of the report — marketers get banned; publish is a louder gate.
- Letting the model call arbitrary URLs with OAuth tokens.
