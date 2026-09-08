import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";
import type { StepStatus } from "@/components/approvals-ui/approval-node";

const always = { kind: "always" as const };

function linearPolicy(
  name: string,
  gates: { id: string; label: string; title: string }[],
  deliverLabel: string,
): ApprovalPolicy {
  return {
    name,
    roots: [gates[0].id],
    steps: [
      ...gates.map((gate, index) => ({
        id: gate.id,
        kind: "approval" as const,
        label: gate.label,
        when: always,
        approvers: [{ name: "You", title: gate.title }],
        mode: "any" as const,
        next: [gates[index + 1]?.id ?? "deliver"],
      })),
      {
        id: "deliver",
        kind: "terminal" as const,
        label: deliverLabel,
        when: always,
        outcome: "approved" as const,
        next: [] as string[],
      },
    ],
  };
}

/** Tools whose result is a gated deliverable — not a one-shot converter. */
export const TOOL_DELIVERY_POLICIES: Record<string, ApprovalPolicy> = {
  "website-audit-report": linearPolicy(
    "Website audit",
    [
      { id: "submit", label: "Submit a URL", title: "The page to score" },
      { id: "scan", label: "Scan the page", title: "Fetch and score signals" },
      { id: "review", label: "Review findings", title: "You sign off on the report" },
    ],
    "Deliver report",
  ),
  "landing-page-grader": linearPolicy(
    "Landing page grade",
    [
      { id: "submit", label: "Submit a URL", title: "The page to grade" },
      { id: "scan", label: "Grade conversion", title: "CTA, forms, speed, trust" },
      { id: "review", label: "Review the grade", title: "You sign off on the score" },
    ],
    "Deliver grade",
  ),
  "competitor-gap-report": linearPolicy(
    "Competitor gap",
    [
      { id: "submit", label: "Add the sites", title: "Yours plus competitors" },
      { id: "scan", label: "Compare signals", title: "Side-by-side scoring" },
      { id: "review", label: "Review the gaps", title: "You sign off on the comparison" },
    ],
    "Deliver comparison",
  ),
  "brand-creator": linearPolicy(
    "Brand creator",
    [
      { id: "submit", label: "Describe the business", title: "Seed for name ideas" },
      { id: "scan", label: "Generate names", title: "Palette + tagline options" },
      { id: "review", label: "Pick a name", title: "Check domains, then approve" },
    ],
    "Claim the name",
  ),
  "brand-identity-kit": linearPolicy(
    "Brand identity kit",
    [
      { id: "submit", label: "Enter the name", title: "The brand to kit" },
      { id: "scan", label: "Generate assets", title: "Mark, palette, type" },
      { id: "review", label: "Review the kit", title: "You sign off before download" },
    ],
    "Download kit",
  ),
  copywriter: linearPolicy(
    "AI copywriter",
    [
      { id: "submit", label: "Write the brief", title: "Format, brand, offer, tone" },
      { id: "scan", label: "Generate variants", title: "Drafts to choose from" },
      { id: "review", label: "Approve copy", title: "You sign off before export" },
    ],
    "Export copy",
  ),
  "schema-generator": linearPolicy(
    "Schema markup",
    [
      { id: "submit", label: "Choose a type", title: "Organization, product, FAQ…" },
      { id: "scan", label: "Fill the fields", title: "Name, URL, details" },
      { id: "review", label: "Preview JSON-LD", title: "You sign off before copy" },
    ],
    "Copy markup",
  ),
  "watermark-generator": linearPolicy(
    "Watermark",
    [
      { id: "submit", label: "Upload an image", title: "Stays in your browser" },
      { id: "scan", label: "Place the mark", title: "Text, position, opacity" },
      { id: "review", label: "Approve the preview", title: "You sign off before download" },
    ],
    "Download image",
  ),
  "content-campaign-calendar": linearPolicy(
    "Content calendar",
    [
      { id: "submit", label: "Set the goal", title: "Brand, goal, duration" },
      { id: "scan", label: "Build the calendar", title: "Multi-week plan" },
      { id: "review", label: "Review the plan", title: "You sign off before export" },
    ],
    "Export CSV",
  ),
  "white-label-report-builder": linearPolicy(
    "White-label report",
    [
      { id: "submit", label: "Brand the report", title: "Agency, client, accent" },
      { id: "scan", label: "Add findings", title: "Scores, notes, recs" },
      { id: "review", label: "Approve the layout", title: "You sign off before print" },
    ],
    "Print / download",
  ),
};

export function getDeliveryPolicy(slug: string): ApprovalPolicy | null {
  return TOOL_DELIVERY_POLICIES[slug] ?? null;
}

export function statusesForPhase(
  policy: ApprovalPolicy,
  currentId: string,
  delivered: boolean,
): Record<string, StepStatus> {
  const ids = policy.steps.map((step) => step.id);
  const currentIndex = delivered ? ids.length : ids.indexOf(currentId);
  const statuses: Record<string, StepStatus> = {};
  ids.forEach((id, index) => {
    if (delivered || index < currentIndex) statuses[id] = "approved";
    else if (index === currentIndex) statuses[id] = "pending";
    else statuses[id] = "skipped";
  });
  return statuses;
}
