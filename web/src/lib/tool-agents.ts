import { getDeliveryPolicy } from "@/lib/tool-delivery";
import type { ApprovalPolicy } from "@/lib/approvals-ui/policy";

export type AgentSkill = {
  id: string;
  label: string;
  processing: "client" | "server";
};

export type ToolAgent = {
  slug: string;
  policy: ApprovalPolicy;
  skills: AgentSkill[];
  requiredAccuracy: string[];
  approveLabel: string;
};

function agent(
  slug: string,
  skills: AgentSkill[],
  requiredAccuracy: string[],
  approveLabel: string,
): ToolAgent | null {
  const policy = getDeliveryPolicy(slug);
  if (!policy) return null;
  return { slug, policy, skills, requiredAccuracy, approveLabel };
}

const agents: Record<string, ToolAgent> = Object.fromEntries(
  [
    agent(
      "website-audit-report",
      [
        { id: "fetch-page", label: "Check the live page", processing: "server" },
        { id: "score-page", label: "Score SEO and technical basics", processing: "server" },
        { id: "cite-source", label: "Attach sources", processing: "server" },
      ],
      ["cite-source"],
      "Approve report",
    ),
    agent(
      "watermark-generator",
      [
        { id: "decode-image", label: "Read the image", processing: "client" },
        { id: "composite-mark", label: "Place the watermark", processing: "client" },
        { id: "encode-png", label: "Encode the PNG", processing: "client" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["cite-source"],
      "Approve watermark",
    ),
    agent(
      "landing-page-grader",
      [
        { id: "fetch-page", label: "Check the live page", processing: "server" },
        { id: "score-landing", label: "Grade conversion", processing: "server" },
        { id: "cite-source", label: "Attach sources", processing: "server" },
      ],
      ["cite-source"],
      "Approve grade",
    ),
    agent(
      "competitor-gap-report",
      [
        { id: "fetch-competitors", label: "Fetch each site", processing: "server" },
        { id: "score-page", label: "Score the same signals", processing: "server" },
        { id: "cite-source", label: "Attach sources", processing: "server" },
      ],
      ["cite-source"],
      "Approve comparison",
    ),
    agent(
      "brand-creator",
      [
        { id: "brand.names", label: "Generate name ideas", processing: "client" },
        { id: "domain.availability", label: "Check domains", processing: "server" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["cite-source"],
      "Approve this name",
    ),
    agent(
      "brand-identity-kit",
      [
        { id: "brand.palette", label: "Build the palette", processing: "client" },
        { id: "brand.kit-zip", label: "Assemble the kit", processing: "client" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["cite-source"],
      "Approve kit",
    ),
    agent(
      "copywriter",
      [
        { id: "copy.structured", label: "Write the variants", processing: "server" },
        { id: "cite-source", label: "Attach sources", processing: "server" },
      ],
      ["cite-source"],
      "Approve copy",
    ),
    agent(
      "schema-generator",
      [
        { id: "seo.draft-schema", label: "Draft structured data", processing: "client" },
        { id: "schema-validate", label: "Validate JSON-LD", processing: "client" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["schema-validate", "cite-source"],
      "Approve markup",
    ),
    agent(
      "content-campaign-calendar",
      [
        { id: "calendar.30-day", label: "Build the calendar", processing: "client" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["cite-source"],
      "Approve calendar",
    ),
    agent(
      "white-label-report-builder",
      [
        { id: "compose-report", label: "Compose the report", processing: "client" },
        { id: "cite-source", label: "Attach sources", processing: "client" },
      ],
      ["cite-source"],
      "Approve report",
    ),
  ]
    .filter((value): value is ToolAgent => value !== null)
    .map((value) => [value.slug, value]),
);

export function getToolAgent(slug: string): ToolAgent | null {
  return agents[slug] ?? null;
}

export function listToolAgents(): ToolAgent[] {
  return Object.values(agents);
}
