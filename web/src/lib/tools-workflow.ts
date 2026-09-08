import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";
import { getToolBySlug, getToolsByCluster, toolClusters } from "@/lib/site-config";
import { artForCluster, artForTool, BRAND_LOGO } from "@/lib/marquee-art";

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

export type ToolboxStepDetail = {
  id: string;
  kind: "start" | "cluster" | "tool" | "next" | "terminal";
  title: string;
  blurb: string;
  image: string;
  href: string | null;
  cta: string;
  tools: { name: string; slug: string }[];
};

export function toolboxStepDetail(stepId: string): ToolboxStepDetail | null {
  if (stepId === "start") {
    return {
      id: stepId,
      kind: "start",
      title: "What do you need to ship?",
      blurb:
        "Start with the job, not a random converter. Pick an outcome cluster and Launchabl routes you to a free tool that actually produces something you can use.",
      image: artForCluster("launch"),
      href: toolboxHrefForStep(stepId),
      cta: "Browse tools",
      tools: [],
    };
  }

  if (stepId === "next-step") {
    return {
      id: stepId,
      kind: "next",
      title: "What next?",
      blurb:
        "Keep using the toolbox free, or graduate to the unlimited plan when you want humans to finish the brand, site, content, and SEO — one price, no retainer.",
      image: BRAND_LOGO,
      href: toolboxHrefForStep(stepId),
      cta: "See the unlimited plan",
      tools: [],
    };
  }

  if (stepId === "free-done") {
    return {
      id: stepId,
      kind: "terminal",
      title: "Use it free",
      blurb:
        "Single-file actions stay free. Download the result, come back anytime, no account required for the converters and generators.",
      image: artForCluster("convert-ship"),
      href: toolboxHrefForStep(stepId),
      cta: "Stay in the toolbox",
      tools: [],
    };
  }

  if (stepId === "unlimited") {
    return {
      id: stepId,
      kind: "terminal",
      title: "Unlimited plan",
      blurb:
        "One price, lifetime access. Brand, website, content, and SEO handled by the agency behind these tools — no monthly retainer.",
      image: BRAND_LOGO,
      href: toolboxHrefForStep(stepId),
      cta: "Get unlimited",
      tools: [],
    };
  }

  const cluster = toolClusters.find((c) => c.slug === stepId);
  if (cluster) {
    const clusterTools = getToolsByCluster(cluster.slug);
    return {
      id: stepId,
      kind: "cluster",
      title: cluster.name,
      blurb: cluster.description,
      image: artForCluster(cluster.slug),
      href: toolboxHrefForStep(stepId),
      cta: "Launch cluster",
      tools: clusterTools.map((tool) => ({ name: tool.name, slug: tool.slug })),
    };
  }

  const canvasTool = TOOLBOX_CANVAS_TOOLS.find((t) => t.id === stepId);
  const tool = getToolBySlug(stepId);
  if (canvasTool || tool) {
    const resolved = tool ?? getToolBySlug(canvasTool!.id);
    const image = resolved
      ? artForTool(resolved)
      : artForCluster(canvasTool?.cluster ?? "launch");
    return {
      id: stepId,
      kind: "tool",
      title: resolved?.name ?? canvasTool?.label ?? stepId,
      blurb: resolved?.shortDescription ?? "A free Launchabl tool in this cluster.",
      image,
      href: toolboxHrefForStep(stepId),
      cta: "Launch",
      tools: resolved
        ? getToolsByCluster(resolved.cluster)
            .filter((item) => item.slug !== resolved.slug)
            .slice(0, 5)
            .map((item) => ({ name: item.name, slug: item.slug }))
        : [],
    };
  }

  return null;
}

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
