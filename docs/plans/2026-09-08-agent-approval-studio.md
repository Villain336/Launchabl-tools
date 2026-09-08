---
title: Agent Run Studio for delivery tools
date: 2026-09-08
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
origin: docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md
---

# Agent Run Studio for delivery tools

Capabilities the studio must eventually host (images, marketing-site code, SEO, research, accuracy) are catalogued in `docs/superpowers/specs/2026-09-08-agent-capability-catalog.md`. This plan still only ships the studio kernel on the 10 existing delivery tools.

## Goal Capsule

Turn the 10 approval-gated Launchabl tools into a CrewAI-style run studio: the approval DAG is the entire work surface, skills fire as visible tool calls, and export stays locked until the operator approves.

Authority: user request on 2026-09-08 ("approval UI to be the entire interface… work like an agent with tools and skills") plus the design spec at `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md`.
Stop when website audit and watermark ship as studios, the remaining eight delivery tools use the same shell, converters are untouched, and `npm run lint` + `npm run build` in `web/` pass.
Do not add CrewAI, CopilotKit, or a Python agent server in this plan.

## Product Contract

### Requirements

- R1. A delivery-tool page has no "Delivery flow" eyebrow, no instructional paragraph under it, and no separate form card below the canvas.
- R2. The approval DAG and the active-step dock together fill the work area (split studio). Intake, skill log, review, and export all happen in the dock, not in a stacked card.
- R3. Each delivery tool is one agent with a declared skill list. Scan runs those skills in order and renders each as a tool-call card (queued / running / done / failed).
- R4. Review is human-in-the-loop. Export controls (download, copy, print) exist only after Approve, in the deliver dock.
- R5. Client-side tools never upload files. Server skills keep using the existing Next.js API routes.
- R6. About, FAQ, and the unlimited-plan upsell are available from a compact `?` / info drawer, not as competing text bars above the run.
- R7. A thin run bar keeps identity: back to `/tools`, tool name, live/beta badge, processing kind, Reset.
- R8. Converters and other tools without a delivery policy keep today's form layout.
- R9. The `/tools` toolbox map is unchanged.

### Actors

- Operator: the visitor running a tool.
- Agent: the delivery tool bound to one `ApprovalPolicy`.
- Skill: a named capability the agent may invoke (`fetch-page`, `composite-mark`, …).

### Flows

- F1. Audit run: submit URL in dock → scan skill timeline → review findings → approve → download in deliver dock.
- F2. Watermark run: drop image in submit dock → scan composites in-browser → review preview → approve → download PNG.
- F3. Failed skill: scan card marks failed, agent stays on scan, operator can retry; deliver stays locked.
- F4. Reset: run bar Reset returns to submit and clears run state.

### Acceptance examples

- AE1. `/tools/website-audit-report` shows a full-height DAG on the left and a URL field in the right dock. There is no "Delivery flow" label and no second card under the graph. Running `https://example.com` produces at least two skill cards, then findings, then Approve, then Download.
- AE2. `/tools/watermark-generator` never posts the image to a server. Download is absent until Approve.
- AE3. `/tools/qr-code-generator` still renders the old form layout (no studio).
- AE4. `/tools` still shows the catalog map and clay cards.

### Product scope

In: the 10 slugs in `web/src/lib/tool-delivery.ts` (`TOOL_DELIVERY_POLICIES`).
Out: CrewAI Python, CopilotKit chat, accounts, persisted threads, converting the toolbox map into an agent.

## Planning Contract

### Key technical decisions

- KTD1. Interaction model, not the CrewAI runtime. CrewAI's UI (graph + tool calls + HITL + generative UI) is the reference. We keep the existing `@xyflow/react` approval canvas and Next.js API routes. A Python AG-UI server would break in-browser tools and add LLM/ops cost we do not need for this pass.
- KTD2. Split studio, not in-node forms. Graph stays readable (current 256px nodes). The active step's work surface is a right-hand dock. Expanding every node into a mini-app would fight the layout engine we already use (`react-flow-auto-layout`).
- KTD3. Skills are data + functions, not LLM-chosen tools. Each agent declares an ordered skill list per scan. Later we can let a model pick skills; this plan hard-wires the list so watermark and audit stay deterministic.
- KTD4. Shared run state lives in `DeliveryRunProvider`, extended with `input`, `skillLog`, `output`, and `error`. Existing `useDeliveryPhase` + `ApproveGate` are replaced by the studio driving `setPhase` itself so form components stop fighting the graph.
- KTD5. Pilot two tools, then migrate. Website audit (server) and watermark (client) prove both processing kinds. The other eight wrap the same shell with a per-tool `ToolAgent` config.
- KTD6. Info drawer instead of deleting About/FAQ. R6 needs the copy reachable; it must not sit as bars above the canvas.

### Technical design

New module `web/src/lib/tool-agents.ts` describes each delivery tool:

```ts
type SkillStatus = "queued" | "running" | "done" | "failed";

type AgentSkill = {
  id: string;
  label: string;
  processing: "client" | "server";
};

type ToolAgent = {
  slug: string;
  policy: ApprovalPolicy; // from getDeliveryPolicy(slug)
  skills: AgentSkill[];
};
```

Runtime: `web/src/components/tools/agent-run.tsx` (provider) holds:

- `phase`: policy step id
- `skillLog`: `{ skillId, status, detail?, startedAt, endedAt? }[]`
- `intake` / `output` / `error`
- `approve()` / `reset()` / `runScan()`

UI:

- `web/src/components/tools/agent-studio.tsx` — full-height split: `WorkflowCanvas` + dock
- `web/src/components/tools/skill-timeline.tsx` — tool-call cards
- `web/src/components/tools/agent-dock.tsx` — switches on phase + slug
- Per-tool dock sections stay in the existing files (`website-audit-report.tsx`, …) but export `AuditIntake`, `AuditReview`, `AuditExport` instead of one stacked form

`ToolPageLayout` branches: if `getDeliveryPolicy(tool.slug)` then render `AgentStudio`, else today's Card + children.

Node chrome: keep `ApprovalNode` / `TerminalNode`. Do not put inputs inside React Flow nodes in this pass (KTD2). Selecting a completed step can reopen that phase's dock read-only.

### Assumptions

- A1. "No text bars" means the delivery-flow eyebrow, the stacked form card, and the large H1/description block competing with the run — not that the site header or orange announcement bar must disappear.
- A2. We do not need an LLM to feel like an agent if skill cards animate in sequence with real work behind them.
- A3. Default dock width is ~42% on desktop; stacked dock-below-graph on viewports under `md`.

### Sequencing

U1 shell → U2 skill runner → U3 audit → U4 watermark → U5 remaining eight → U6 polish/a11y.

U3 can ship behind the studio even if U5 is incomplete: other delivery tools may keep the old stacked layout until their `ToolAgent` is registered. `AgentStudio` only mounts when a `ToolAgent` exists; until then fall back to the current canvas+card so we never blank a live tool.

## Implementation Units

### U1. Agent studio shell

Files:
- Create: `web/src/components/tools/agent-studio.tsx`
- Create: `web/src/components/tools/agent-dock.tsx`
- Modify: `web/src/components/tools/tool-page-layout.tsx`
- Modify: `web/src/components/tools/delivery-run.tsx`
- Test: `web/src/components/tools/agent-studio.test.tsx` (or a Playwright spec under `web/e2e/` if the repo has no unit-test runner yet — if none, add a `web/src/lib/tool-agents.test.ts` for config and visually verify the shell)

What: Split layout, thin run bar, info drawer, hide delivery-flow copy when a ToolAgent is registered. Dock can render placeholder children per phase. Converters unchanged.

Depends on: none.

Test scenarios:
- Delivery slug with a ToolAgent: no "Delivery flow" text, canvas and dock both visible.
- Converter slug: still the Card form, no dock.
- Info control opens About/FAQ/upsell without covering the whole graph on desktop.

### U2. Skill runner and timeline

Files:
- Create: `web/src/lib/tool-agents.ts`
- Create: `web/src/components/tools/skill-timeline.tsx`
- Modify: `web/src/components/tools/delivery-run.tsx` (skillLog, runScan)

What: Ordered skill execution with status updates. Failures set `error` and do not advance to review. Timeline is the scan dock.

Test scenarios:
- Three skills: log goes queued → running → done in order.
- Middle skill throws: that card is failed, later skills stay queued, phase remains scan.

### U3. Website audit as the first agent

Files:
- Modify: `web/src/components/tools/website-audit-report.tsx` (split intake / review / export)
- Modify: `web/src/lib/tool-agents.ts` (register skills `fetch-page`, `score-page`)
- Modify: `web/src/app/tools/[slug]/page.tsx` only if the studio needs a slot besides `children`

What: Run button in submit dock calls `/api/site-audit`. Skill timeline maps fetch vs score. Review dock shows today's findings UI. Approve unlocks download in deliver dock. `useDeliveryPhase` is removed; the studio owns phase.

Test scenarios:
- AE1 against `https://example.com` (or a mocked `/api/site-audit`).
- Approve absent until review has a result.
- Download absent until approve.

### U4. Watermark as the client-side agent

Files:
- Modify: `web/src/components/tools/watermark-generator.tsx`
- Modify: `web/src/lib/tool-agents.ts`

What: Submit dock is the drop zone. Scan skills composite in-browser. Review dock is the canvas preview plus mark controls (controls may remain editable on scan; freeze them on review). Download only on deliver.

Test scenarios:
- AE2: no `fetch` of the image bytes to a Launchabl API.
- Download missing until approve.

### U5. Remaining delivery tools

Files: the eight components already wired to `ApproveGate` (`brand-creator.tsx`, `brand-identity-kit.tsx`, `copywriter.tsx`, `schema-generator.tsx`, `landing-page-grader.tsx`, `competitor-gap-report.tsx`, `content-campaign-calendar.tsx`, `white-label-report-builder.tsx`) plus `web/src/lib/tool-agents.ts`.

What: Each gets a ToolAgent skill list and dock slices (intake / review / export). Reuse existing logic; delete `useDeliveryPhase` and stacked `ApproveGate` once the studio owns the gate.

Test scenarios:
- Each of the eight mounts AgentStudio (no "Delivery flow" copy).
- Each can reach deliver only after approve.
- QR / image converter still old layout.

### U6. Motion, errors, and keyboard

Files:
- Modify: `web/src/components/tools/agent-studio.tsx`
- Modify: `web/src/components/tools/skill-timeline.tsx`

What: Pending node already pulses via `ApprovalNode`. Skill cards should appear in sequence (existing `motion` is allowed). Escape closes the info drawer. Reset is keyboard-reachable. Failed scan copy lives in the dock, not a banner above the graph.

Test scenarios:
- F3 and F4.
- Drawer closes on Escape.
- `npm run lint` and `npm run build` in `web/`.

## Verification Contract

Repo commands (from `web/`):

- `npm run lint` — ESLint, zero errors.
- `npx tsc --noEmit` — no new type errors.
- `npm run build` — Next.js production build.

Behavioral checks (Playwright-core or the existing Chrome/puppeteer harness against `next start`):

- `/tools/website-audit-report` matches AE1.
- `/tools/watermark-generator` matches AE2.
- `/tools/qr-code-generator` matches AE3.
- `/tools` matches AE4.

No new CI job required unless `web/` already has a test script; if unit tests are added, wire them into `web/package.json` as `test`.

## Definition of Done

Global:
- R1–R9 satisfied for all 10 delivery tools.
- Lint, tsc, and production build clean.
- Spec at `docs/superpowers/specs/2026-09-08-agent-approval-studio-design.md` still matches what shipped (update it if we diverge).

Per unit:
- U1: studio shell on one registered tool, converters untouched.
- U2: skill log unit tests or a documented manual timeline check.
- U3: audit AE1 recorded (screenshot or e2e).
- U4: watermark AE2 recorded.
- U5: eight tools on the studio; no leftover `useDeliveryPhase` in those files.
- U6: reset/error/drawer checks recorded.

## Appendix

### Rejected approaches

- A. CrewAI + CopilotKit + `ag-ui-crewai`: true chat-and-approve agents, but needs a Python process, LLM keys, and uploads. Conflicts with in-browser processing promises.
- B. Chat-only CopilotChat with no DAG: more "agentic" chat, loses the approval canvas we already invested in and the user asked to keep as the system.

### Current files this plan replaces in spirit

- `web/src/components/tools/tool-delivery-canvas.tsx` — absorbed by `agent-studio.tsx` (can delete once all 10 migrate).
- `web/src/components/tools/approve-gate.tsx` — logic moves into the deliver dock.
- `useDeliveryPhase` — studio owns phase.

### CrewAI reference (interaction only)

- https://docs.crewai.com/en/guides/frontend/overview — graph + generative UI + HITL, not chat walls.
- Human-in-the-loop: agent pauses, UI collects a decision, run resumes. Our Approve is that pause, fixed at the review step instead of model-chosen.
