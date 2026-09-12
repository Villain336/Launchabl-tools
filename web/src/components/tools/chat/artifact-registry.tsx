"use client";

import type { ReactNode } from "react";
import { getToolName } from "ai";
import type { ToolChatMessage } from "@/lib/ai/chat-message";
import type { VariantsDeliverable } from "@/lib/ai/tools/ab-copy-variants";
import type { QrDesignOutput } from "@/lib/ai/tools/qr-designer";
import type { ReviewResult } from "@/lib/ai/tools/review";
import { ReviewArtifact } from "@/components/tools/chat/review-artifact";
import type { MetaTagSet } from "@/lib/ai/tools/meta-tags";
import type { DocumentDeliverable } from "@/lib/ai/tools/documents";
import type { Dataset } from "@/lib/ai/tools/dataset-builder";
import type { FetchPageToolOutput } from "@/lib/ai/tools/shared/fetch-page-tool";
import { MetaTagsArtifact } from "@/components/tools/chat/meta-tags-artifact";
import { DocumentArtifact } from "@/components/tools/chat/document-artifact";
import { DatasetArtifact } from "@/components/tools/chat/dataset-artifact";
import { VariantsArtifact } from "@/components/tools/chat/variants-artifact";
import { BacklinksArtifact, CanonicalArtifact, LinksArtifact, PerformanceArtifact } from "@/components/tools/chat/audit-artifacts";
import type { BacklinksToolOutput, CanonicalToolOutput, LinksToolOutput, PerformanceToolOutput } from "@/lib/ai/tools/seo-audits";
import { ChecklistArtifact, FaqSchemaArtifact } from "@/components/tools/chat/checklist-artifact";
import { EmailArtifact } from "@/components/tools/chat/email-artifact";
import type { ChecklistToolOutput, FaqSchemaDeliverable, LlmReadabilityToolOutput } from "@/lib/ai/tools/site-checks";
import type { EmailDeliverable } from "@/lib/ai/tools/newsletter";
import type { ComparisonToolOutput, LandingPageToolOutput, SitemapToolOutput, WebsiteAuditToolOutput } from "@/lib/ai/tools/site-reports";
import type { CalendarDeliverable, LocalSeoKit, SchemaDeliverable } from "@/lib/ai/tools/marketing-kits";
import { ComparisonArtifact } from "@/components/tools/chat/comparison-artifact";
import { SitemapArtifact } from "@/components/tools/chat/sitemap-artifact";
import { SchemaArtifact } from "@/components/tools/chat/schema-artifact";
import { LocalSeoArtifact } from "@/components/tools/chat/local-seo-artifact";
import { CalendarArtifact } from "@/components/tools/chat/calendar-artifact";
import { EmailFinderArtifact } from "@/components/tools/chat/infra-artifacts";
import type { AccessibilityToolOutput, DnsEmailToolOutput, EmailFinderToolOutput, SecurityHeadersToolOutput, SslToolOutput } from "@/lib/ai/tools/infra-checks";
import type { ImageDeliverable, SocialCardDeliverable } from "@/lib/ai/tools/image-gen";
import { ImageArtifact } from "@/components/tools/chat/image-artifact";
import { SocialCardArtifact } from "@/components/tools/chat/social-card-artifact";
import type { PersonaDeliverable, PressReleaseDeliverable, RepurposeDeliverable, SubjectLinesDeliverable, TestPlanDeliverable, UtmDeliverable } from "@/lib/ai/tools/growth-kits";
import { PersonasArtifact, PressReleaseArtifact, RepurposeArtifact, SubjectLinesArtifact, TestPlanArtifact, UtmArtifact } from "@/components/tools/chat/growth-artifacts";
import { ClipsArtifact, TranscriptArtifact, TranscriptReadNote } from "@/components/tools/chat/media-artifacts";
import type { ClipsDeliverable, TranscriptDeliverable, TranscriptWindow } from "@/lib/ai/tools/media";
import { QrArtifact } from "@/components/tools/chat/qr-artifact";

/**
 * Maps `tool-<name>` parts to rich renderers and status labels. Shared by the
 * chat surface and shareable reports so a deliverable looks the same in both.
 */

export type ToolPart = Extract<ToolChatMessage["parts"][number], { type: `tool-${string}` }>;

export type ArtifactRenderer = (part: ToolPart) => ReactNode;

function auditOrError<T extends { ok: true }>(output: T | { ok: false; error: string }, render: (ok: T) => ReactNode): ReactNode {
  if (!output.ok) return <p className="text-[12.5px] text-red">{output.error}</p>;
  return render(output);
}

/** Maps `tool-<name>` parts to rich renderers. Tools without an entry fall back to a status line. */
export const artifactRenderers: Record<string, ArtifactRenderer> = {
  deliverVariants: (part) => <VariantsArtifact data={part.output as VariantsDeliverable} />,
  designQr: (part) => <QrArtifact design={part.output as QrDesignOutput} />,
  deliverMetaTags: (part) => <MetaTagsArtifact tags={part.output as MetaTagSet} />,
  deliverDocument: (part) => <DocumentArtifact doc={part.output as DocumentDeliverable} />,
  deliverDataset: (part) => <DatasetArtifact data={part.output as Dataset} />,
  analyzeCanonical: (part) => auditOrError(part.output as CanonicalToolOutput, (r) => <CanonicalArtifact report={r.report} />),
  checkLinks: (part) => auditOrError(part.output as LinksToolOutput, (r) => <LinksArtifact report={r.report} />),
  auditPerformance: (part) => auditOrError(part.output as PerformanceToolOutput, (r) => <PerformanceArtifact report={r.report} />),
  checkBacklinks: (part) => auditOrError(part.output as BacklinksToolOutput, (r) => <BacklinksArtifact report={r.report} />),
  analyzeVoiceSearch: (part) => auditOrError(part.output as ChecklistToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  scanCompliance: (part) => auditOrError(part.output as ChecklistToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  analyzeLlmReadability: (part) => auditOrError(part.output as LlmReadabilityToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  deliverFaqSchema: (part) => <FaqSchemaArtifact data={part.output as FaqSchemaDeliverable} />,
  deliverEmail: (part) => <EmailArtifact email={part.output as EmailDeliverable} />,
  auditWebsite: (part) => auditOrError(part.output as WebsiteAuditToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  gradeLandingPage: (part) => auditOrError(part.output as LandingPageToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  compareSites: (part) => auditOrError(part.output as ComparisonToolOutput, (r) => <ComparisonArtifact report={r.report} />),
  generateSitemap: (part) => auditOrError(part.output as SitemapToolOutput, (r) => <SitemapArtifact data={r} />),
  deliverSchema: (part) => <SchemaArtifact data={part.output as SchemaDeliverable} />,
  deliverLocalSeoKit: (part) => <LocalSeoArtifact kit={part.output as LocalSeoKit} />,
  deliverCalendar: (part) => <CalendarArtifact cal={part.output as CalendarDeliverable} />,
  checkDnsEmail: (part) => auditOrError(part.output as DnsEmailToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  checkSecurityHeaders: (part) => auditOrError(part.output as SecurityHeadersToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  auditAccessibility: (part) => auditOrError(part.output as AccessibilityToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  checkSsl: (part) => auditOrError(part.output as SslToolOutput, (r) => <ChecklistArtifact report={r.report} />),
  findEmail: (part) => auditOrError(part.output as EmailFinderToolOutput, (r) => <EmailFinderArtifact result={r.result} />),
  generateImage: (part) => <ImageArtifact data={part.output as ImageDeliverable} />,
  designSocialCard: (part) => <SocialCardArtifact data={part.output as SocialCardDeliverable} />,
  buildUtmLinks: (part) => <UtmArtifact data={part.output as UtmDeliverable} />,
  readTranscript: (part) => <TranscriptReadNote data={part.output as TranscriptWindow} />,
  deliverTranscript: (part) => <TranscriptArtifact data={part.output as TranscriptDeliverable} />,
  deliverClips: (part) => <ClipsArtifact data={part.output as ClipsDeliverable} />,
  reviewDeliverables: (part) => <ReviewArtifact data={part.output as ReviewResult} />,
  deliverPersonas: (part) => <PersonasArtifact data={part.output as PersonaDeliverable} />,
  scoreSubjectLines: (part) => <SubjectLinesArtifact data={part.output as SubjectLinesDeliverable} />,
  deliverPressRelease: (part) => <PressReleaseArtifact data={part.output as PressReleaseDeliverable} />,
  deliverTestPlan: (part) => <TestPlanArtifact data={part.output as TestPlanDeliverable} />,
  deliverRepurposed: (part) => <RepurposeArtifact data={part.output as RepurposeDeliverable} />,
  fetchPage: (part) => {
    const result = part.output as FetchPageToolOutput;
    const url = (part.input as { url?: string } | undefined)?.url ?? "";
    return (
      <p className="text-[12.5px] text-ink-3">
        {result.ok
          ? `Read ${result.page.finalUrl} · ${result.page.wordCount.toLocaleString()} words · HTTP ${result.page.status}`
          : `Couldn't read ${url}: ${result.error}`}
      </p>
    );
  },
};

export const artifactLabels: Record<string, { working: string; done: string }> = {
  deliverVariants: { working: "Writing variants", done: "Variants ready" },
  designQr: { working: "Designing your code", done: "Design ready" },
  deliverMetaTags: { working: "Writing meta tags", done: "Meta tags ready" },
  deliverDocument: { working: "Writing the file", done: "File ready" },
  deliverDataset: { working: "Building the dataset", done: "Dataset ready" },
  fetchPage: { working: "Reading the page", done: "Read the page" },
  analyzeCanonical: { working: "Checking canonicals", done: "Canonical audit ready" },
  checkLinks: { working: "Checking every link", done: "Link check ready" },
  auditPerformance: { working: "Auditing page delivery", done: "Audit ready" },
  checkBacklinks: { working: "Verifying backlinks", done: "Backlink check ready" },
  analyzeVoiceSearch: { working: "Listening to the page", done: "Voice search audit ready" },
  scanCompliance: { working: "Scanning for compliance signals", done: "Compliance scan ready" },
  analyzeLlmReadability: { working: "Reading like an AI crawler", done: "LLM readability report ready" },
  deliverFaqSchema: { working: "Writing the FAQ", done: "FAQ ready" },
  deliverEmail: { working: "Designing the email", done: "Email ready" },
  auditWebsite: { working: "Auditing the page", done: "Audit ready" },
  gradeLandingPage: { working: "Grading the landing page", done: "Grade ready" },
  compareSites: { working: "Fetching and comparing the sites", done: "Comparison ready" },
  generateSitemap: { working: "Crawling the site", done: "Sitemap and robots.txt ready" },
  deliverSchema: { working: "Writing and validating the schema", done: "Schema ready" },
  deliverLocalSeoKit: { working: "Building the local SEO kit", done: "Kit ready" },
  deliverCalendar: { working: "Planning the calendar", done: "Calendar ready" },
  checkDnsEmail: { working: "Reading the domain's DNS", done: "Deliverability report ready" },
  checkSecurityHeaders: { working: "Grading the response headers", done: "Security report ready" },
  auditAccessibility: { working: "Scanning for WCAG barriers", done: "Accessibility report ready" },
  checkSsl: { working: "Opening a TLS connection", done: "Certificate report ready" },
  findEmail: { working: "Reading the company's pages and DNS", done: "Email candidates ready" },
  generateImage: { working: "Rendering the image", done: "Image ready" },
  designSocialCard: { working: "Designing the card", done: "Card ready" },
  buildUtmLinks: { working: "Building tracked links", done: "Links ready" },
  readTranscript: { working: "Reading the transcript", done: "Transcript read" },
  deliverTranscript: { working: "Writing the transcript brief", done: "Transcript ready" },
  deliverClips: { working: "Cutting clips", done: "Clips ready" },
  reviewDeliverables: { working: "Reviewing the deliverables against the brief", done: "Quality check done" },
  loadSkillGuide: { working: "Loading the playbook", done: "Playbook loaded" },
  deliverPersonas: { working: "Defining the ICP and personas", done: "Personas ready" },
  scoreSubjectLines: { working: "Scoring subject lines", done: "Scores ready" },
  deliverPressRelease: { working: "Writing and checking the release", done: "Press release ready" },
  deliverTestPlan: { working: "Writing the test plan", done: "Test plan ready" },
  deliverRepurposed: { working: "Rewriting for each channel", done: "Pieces ready" },
};


export function toolPartName(part: ToolPart): string {
  return getToolName(part);
}
