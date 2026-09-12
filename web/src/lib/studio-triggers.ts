import type { ApprovalQuestion } from "@/components/primitives/ApprovalCard";
import type { ChatMessage } from "@/components/primitives/ChatComposer";

export type TriggerSpec = {
  suggestions: string[];
  placeholder: string;
  questions: ApprovalQuestion[];
  messages: ChatMessage[];
};

const DEFAULT_SPEC: TriggerSpec = {
  suggestions: ["Brief", "Scope", "Output"],
  placeholder: "Tell the run what you need…",
  questions: [
    {
      q: "What should we optimize for?",
      type: "radio",
      options: ["Speed", "Accuracy", "A balanced pass"],
    },
    {
      q: "What should we send back?",
      type: "check",
      options: ["A score", "A written report", "Files I can download"],
    },
  ],
  messages: [
    { label: "Intake", sub: "Brief", time: "1s", body: "I'll turn that into a gated run on this graph." },
    { label: "Next", sub: "Clarify", time: "1s", body: "Answer the questions so I don't guess the wrong output." },
  ],
};

const SPECS: Record<string, TriggerSpec> = {
  "website-audit-report": {
    suggestions: ["Audit", "SEO", "Tech"],
    placeholder: "Paste a URL or describe the page to audit…",
    questions: [
      {
        q: "What should we score first?",
        type: "radio",
        options: ["SEO basics", "Technical health", "Everything on the page"],
      },
      {
        q: "How wide should this pass be?",
        type: "radio",
        options: ["This URL only", "Homepage plus one click later", "Full crawl later"],
      },
    ],
    messages: [
      { label: "Intake", sub: "URL", time: "1s", body: "I'll fetch the live page and score it." },
      { label: "Plan", sub: "Skills", time: "1s", body: "Fetch → score → cite sources. You approve before download." },
    ],
  },
  "landing-page-grader": {
    suggestions: ["Grade", "CTA", "Trust"],
    placeholder: "Paste the landing page URL…",
    questions: [
      {
        q: "What is this page trying to do?",
        type: "radio",
        options: ["Capture leads", "Sell a product", "Book a call"],
      },
      {
        q: "Which signals matter most?",
        type: "check",
        options: ["Calls to action", "Forms", "Speed", "Trust"],
      },
    ],
    messages: [
      { label: "Intake", sub: "URL", time: "1s", body: "I'll grade conversion, not just SEO." },
      { label: "Plan", sub: "Skills", time: "1s", body: "Fetch the page, score the CTA path, then you sign off." },
    ],
  },
  "competitor-gap-report": {
    suggestions: ["Yours", "Rivals", "Gaps"],
    placeholder: "Your site plus the competitors to compare…",
    questions: [
      {
        q: "How many rivals should we hold up?",
        type: "radio",
        options: ["One", "Two", "Three"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Sites", time: "1s", body: "I'll score the same signals side by side." },
      { label: "Plan", sub: "Compare", time: "1s", body: "Fetch each site, then you approve the gaps." },
    ],
  },
  "schema-generator": {
    suggestions: ["Schema", "Type", "Fields"],
    placeholder: "Business name, page type, or what the markup is for…",
    questions: [
      {
        q: "Which schema type?",
        type: "radio",
        options: ["Organization", "Local Business", "Product", "FAQ", "Article"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Type", time: "1s", body: "I'll draft valid JSON-LD from the fields." },
      { label: "Plan", sub: "Validate", time: "1s", body: "Draft → validate → you copy after approve." },
    ],
  },
  "watermark-generator": {
    suggestions: ["Image", "Mark", "Place"],
    placeholder: "Describe the watermark, then drop the image below…",
    questions: [
      {
        q: "How should the mark sit?",
        type: "radio",
        options: ["Tiled across the image", "Corner stamp", "Centered"],
      },
    ],
    messages: [
      { label: "Intake", sub: "File", time: "1s", body: "The image stays in this browser." },
      { label: "Plan", sub: "Composite", time: "1s", body: "Place the mark, then you approve the preview." },
    ],
  },
  "brand-creator": {
    suggestions: ["Name", "Vibe", "Domain"],
    placeholder: "What does the business do, and who is it for…",
    questions: [
      {
        q: "What kind of name should we hunt?",
        type: "radio",
        options: ["Short and invented", "Real words", "A mix"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Seed", time: "1s", body: "I'll generate names from that description." },
      { label: "Plan", sub: "Domains", time: "1s", body: "Check likely domains, then you pick a name." },
    ],
  },
  "brand-identity-kit": {
    suggestions: ["Name", "Mark", "Kit"],
    placeholder: "Brand name to build a kit from…",
    questions: [
      {
        q: "What should the kit include first?",
        type: "check",
        options: ["Palette", "Type pairing", "Monogram", "Favicon"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Name", time: "1s", body: "I'll seed color and type from the name." },
      { label: "Plan", sub: "Zip", time: "1s", body: "Assemble the kit, then you approve the download." },
    ],
  },
  "content-campaign-calendar": {
    suggestions: ["Brand", "Goal", "Days"],
    placeholder: "Brand plus the campaign goal…",
    questions: [
      {
        q: "What is the campaign for?",
        type: "radio",
        options: ["Awareness", "Leads", "Sales", "Retention"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Brief", time: "1s", body: "I'll draft a day-by-day calendar from that." },
      { label: "Plan", sub: "Export", time: "1s", body: "Build the grid, then you approve the CSV." },
    ],
  },
  "white-label-report-builder": {
    suggestions: ["Agency", "Client", "Findings"],
    placeholder: "Agency, client, and what the report should say…",
    questions: [
      {
        q: "What should the report look like?",
        type: "radio",
        options: ["Audit scorecard", "Monthly recap", "Pitch deck notes"],
      },
    ],
    messages: [
      { label: "Intake", sub: "Brand", time: "1s", body: "I'll compose a white-label HTML report." },
      { label: "Plan", sub: "Approve", time: "1s", body: "Fill the fields below, then you sign off before download." },
    ],
  },
};

export function triggerSpec(slug?: string | null): TriggerSpec {
  if (!slug) return DEFAULT_SPEC;
  return SPECS[slug] ?? DEFAULT_SPEC;
}

export function extractUrls(text: string): string[] {
  return text.match(/https?:\/\/[^\s]+/gi) ?? [];
}
