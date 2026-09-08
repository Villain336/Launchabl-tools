import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";

const always = { kind: "always" as const };

/** Flagship tools shown on the canvas — one per outcome cluster. */
export const TOOLBOX_CANVAS_TOOLS: { id: string; label: string; cluster: string; title: string }[] = [
  { id: "brand-creator", label: "Brand Creator", cluster: "launch", title: "Free tool" },
  { id: "watermark-generator", label: "Watermark Generator", cluster: "protect", title: "Free tool" },
  { id: "schema-generator", label: "Schema Markup", cluster: "get-found", title: "Free tool" },
  { id: "qr-code-generator", label: "QR Code Generator", cluster: "convert-ship", title: "Free tool" },
  { id: "website-audit-report", label: "Website Audit", cluster: "audits-reports", title: "Free tool" },
  { id: "demo-video-creator", label: "Demo Video Creator", cluster: "create-produce", title: "Free tool" },
];

const CLUSTERS: { id: string; label: string; title: string }[] = [
  { id: "launch", label: "Launch a brand", title: "Outcome cluster" },
  { id: "protect", label: "Protect & clean", title: "Outcome cluster" },
  { id: "get-found", label: "Get found", title: "Outcome cluster" },
  { id: "convert-ship", label: "Convert & ship", title: "Outcome cluster" },
  { id: "audits-reports", label: "Audits & reports", title: "Outcome cluster" },
  { id: "create-produce", label: "Create & produce", title: "Outcome cluster" },
];

export const toolboxHrefForStep = (stepId: string): string | null => {
  if (stepId === "start") return "/tools";
  if (stepId === "unlimited") return "/pricing";
  if (stepId === "free-done") return "/tools";
  if (stepId === "next-step") return "/pricing";
  if (CLUSTERS.some((c) => c.id === stepId)) return `/tools#${stepId}`;
  if (TOOLBOX_CANVAS_TOOLS.some((t) => t.id === stepId)) return `/tools/${stepId}`;
  return null;
};

/**
 * Approval-style DAG of the Launchabl toolbox: pick a job, enter a cluster,
 * use a free tool, then either keep going free or graduate to the unlimited plan.
 */
export const toolboxPolicy = {
  name: "Launchabl toolbox",
  roots: ["start"],
  steps: [
    {
      id: "start",
      kind: "approval",
      label: "What do you need to ship?",
      when: always,
      approvers: [{ name: "You", title: "Founder, marketer, or operator" }],
      mode: "any",
      next: CLUSTERS.map((c) => c.id),
    },
    ...CLUSTERS.map((cluster) => ({
      id: cluster.id,
      kind: "approval" as const,
      label: cluster.label,
      when: always,
      approvers: [{ name: "Launchabl", title: cluster.title }],
      mode: "any" as const,
      next: TOOLBOX_CANVAS_TOOLS.filter((t) => t.cluster === cluster.id).map((t) => t.id),
    })),
    ...TOOLBOX_CANVAS_TOOLS.map((tool) => ({
      id: tool.id,
      kind: "approval" as const,
      label: tool.label,
      when: always,
      approvers: [{ name: tool.label, title: tool.title }],
      mode: "any" as const,
      next: ["next-step"],
    })),
    {
      id: "next-step",
      kind: "approval",
      label: "What next?",
      when: always,
      approvers: [{ name: "You", title: "Keep going free, or go unlimited" }],
      mode: "any",
      next: ["free-done", "unlimited"],
    },
    {
      id: "free-done",
      kind: "terminal",
      label: "Use it free",
      when: always,
      outcome: "approved",
      next: [],
    },
    {
      id: "unlimited",
      kind: "terminal",
      label: "Unlimited plan",
      when: always,
      outcome: "approved",
      next: [],
    },
  ],
} satisfies ApprovalPolicy;
