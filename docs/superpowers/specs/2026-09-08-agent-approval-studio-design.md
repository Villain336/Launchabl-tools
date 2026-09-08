# Agent Run Studio — Design Spec

Date: 2026-09-08
Status: proposed — awaiting review before implementation
Scope: the 10 delivery tools that already use an approval policy

---

## Problem

Those tools currently have two UIs stacked on one page: a small approval canvas (plus "Delivery flow" copy) and a separate form card underneath. The canvas is a diagram of the work. The form is where the work actually happens. That split is why it feels like a label, not an agent.

CrewAI's frontend (via CopilotKit / AG-UI) is the opposite: the run *is* the interface. You watch an agent use tools, you approve mid-run, and the result is live UI — not a wall of text under a flowchart.

## What "CrewAI-like" means here

We copy the **interaction model**, not the Python stack.

| CrewAI / CopilotKit idea | Launchabl equivalent |
|---|---|
| Crew / Flow graph | Existing approval DAG (`submit → scan → review → deliver`) |
| Agent | The tool, running as a single operator with a role |
| Tools | Named skills the run can invoke (`fetch-page`, `score-audit`, `place-watermark`) |
| Skills | Shared capability modules those tools call |
| Human-in-the-loop | The review gate: nothing exports until you approve |
| Generative UI | The active-step dock: intake, skill log, findings, download — rendered as components, not paragraphs |

We will **not** add a CrewAI Python server, CopilotKit runtime, or LLM chat sidebar in this pass. Client-side tools (watermark, identity kit) must stay in the browser. A Python agent process would force uploads and a new ops surface we do not need yet.

## Desired interface

A delivery tool page is a **run studio**, full viewport, no instructional bars.

```
┌─────────────────────────────────────────────────────────────┐
│ ← Tools    Website Audit Report  Live    in-browser / server │
├──────────────────────────┬──────────────────────────────────┤
│                          │  Active step: Submit a URL       │
│   Approval DAG           │                                  │
│   submit → scan →        │  [ URL field ]                   │
│   review → deliver       │  [ Run ]                         │
│                          │                                  │
│   pending node glows     │  Skills this step will use:      │
│                          │   • fetch-page                   │
│                          │   • score-seo                    │
│                          │   • score-tech                   │
└──────────────────────────┴──────────────────────────────────┘
```

After Run, the scan node is pending and the dock becomes a **skill timeline**: each skill appears as a card as it starts, streams status, then marks done. Review shows findings in the dock with **Approve**. Deliver unlocks the export control in the dock (and only there).

No "Delivery flow" eyebrow. No separate form card below the canvas. About / FAQ / upsell move into a `?` drawer so they do not compete with the run.

## Actors

- Operator (the visitor): supplies intake, watches skills, approves, exports.
- Agent (the tool): owns the policy, picks which skills to run, cannot skip review.
- Skills: pure functions with a label, client/server kind, and a result payload.

## Core flows

### Website audit (pilot)

1. Operator lands on `/tools/website-audit-report`. Studio fills the page. Submit is pending.
2. Operator types a URL in the dock and hits Run.
3. Agent moves to scan. Dock shows `fetch-page` then `score-seo` / `score-tech` as tool-call cards.
4. Agent moves to review. Dock shows the score and findings. Export is hidden.
5. Operator hits Approve. Deliver becomes current. Dock shows Download.
6. Reset returns to submit without leaving the studio.

### Watermark (second, client-side)

Same studio. Skills are `decode-image`, `composite-mark`, `encode-png`. Intake is a drop zone in the submit dock. Preview lives in the review dock. Download is locked until Approve.

The other eight delivery tools follow the same four-step skeleton with their own skill lists.

## Out of scope

- One-shot converters (QR, image convert, metadata strip, etc.) stay as forms.
- The `/tools` toolbox map stays a catalog diagram, not an agent run.
- Real CrewAI / CopilotKit / AG-UI integration.
- Multi-agent crews (one tool is one agent).
- Persisted run history / accounts.

## Success

A stranger can finish an audit without reading any explanatory copy: intake in the graph, watch skills fire, approve, download. If they screenshot the page, the canvas *is* the product.
