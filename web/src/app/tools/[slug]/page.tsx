import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ToolPageLayout } from "@/components/tools/tool-page-layout";
import { getToolBySlug, tools } from "@/lib/site-config";
import { MetadataRemover } from "@/components/tools/metadata-remover";
import { ImageConverter } from "@/components/tools/image-converter";
import { QrCodeGenerator } from "@/components/tools/qr-code-generator";
import { WatermarkGenerator } from "@/components/tools/watermark-generator";
import { SchemaGenerator } from "@/components/tools/schema-generator";
import { BrandCreator } from "@/components/tools/brand-creator";
import { DomainAvailabilitySearch } from "@/components/tools/domain-availability-search";
import { Copywriter } from "@/components/tools/copywriter";
import { WatermarkRemover } from "@/components/tools/watermark-remover";
import { FileConverter } from "@/components/tools/file-converter";
import { ComingSoonTool } from "@/components/tools/coming-soon-tool";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};
  return { title: tool.name, description: tool.shortDescription };
}

const toolUi: Record<string, ReactNode> = {
  "metadata-remover": <MetadataRemover />,
  "image-converter": <ImageConverter />,
  "qr-code-generator": <QrCodeGenerator />,
  "watermark-generator": <WatermarkGenerator />,
  "schema-generator": <SchemaGenerator />,
  "brand-creator": <BrandCreator />,
  "domain-availability": <DomainAvailabilitySearch />,
  copywriter: <Copywriter />,
  "watermark-remover": <WatermarkRemover />,
  "file-converter": <FileConverter />,
  "domain-purchase": (
    <ComingSoonTool
      architectureNotes={[
        "Route through a registrar/reseller API or affiliate partner rather than becoming a registrar directly.",
        "Reuse the availability check from the Brand Creator / Domain Availability tools as the entry point.",
        "Bundle free with the unlimited plan for the primary domain; à la carte purchase for everyone else.",
      ]}
    />
  ),
  hosting: (
    <ComingSoonTool
      architectureNotes={[
        "Partner with a managed host or reseller panel rather than operating infrastructure from scratch.",
        "Include hosting for the site we build inside the unlimited plan by default.",
        "Offer a low-cost standalone hosting SKU for tool users who aren't plan members yet.",
      ]}
    />
  ),
};

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) notFound();

  return (
    <ToolPageLayout tool={tool} about={<AboutCopy slug={tool.slug} />}>
      {toolUi[tool.slug] ?? (
        <ComingSoonTool architectureNotes={["This tool's build notes are being written — check back soon."]} />
      )}
    </ToolPageLayout>
  );
}

function AboutCopy({ slug }: { slug: string }) {
  const copy: Record<string, string> = {
    "metadata-remover":
      "Every photo you take carries hidden metadata — camera model, exact GPS coordinates, timestamps, sometimes even the software used to edit it. Sharing that file as-is can leak more than you intend. This tool reads and strips that metadata entirely inside your browser, so nothing about your file (or its metadata) ever touches a server.",
    "image-converter":
      "Different platforms want different image formats: WebP for fast-loading web pages, JPG for broad compatibility, PNG for transparency. This tool re-encodes your image client-side using the Canvas API, so you can move between formats without uploading anything.",
    "qr-code-generator":
      "A QR code is just a compact, scannable link. This generator builds a high-resolution, styleable code entirely in your browser with a high error-correction level, so it still scans reliably even printed small or on textured surfaces.",
    "watermark-generator":
      "Protecting shared images — proofs, previews, social posts — starts with a visible watermark. This tool overlays text watermarks with full control over position, opacity, rotation, and tiling, and never uploads your source image.",
    "schema-generator":
      "Structured data (JSON-LD) tells search engines exactly what's on your page — your business details, your product pricing, your FAQ content — in a format they can parse with certainty instead of guessing from page text. This generator builds valid schema for the most common page types.",
    "brand-creator":
      "Naming a brand and checking whether the domain is actually available are usually two disconnected steps. This tool combines both: generate name and tagline ideas, then immediately see which domains are open, so you can move from idea to claimed domain in one sitting.",
    "domain-availability":
      "A fast way to check a name across the most common top-level domains before you commit to it anywhere else — social handles, business registration, or a logo.",
    copywriter:
      "Structured copy templates for the formats marketers write over and over: ad headlines, landing page heroes, product blurbs, and email subject lines. Pick a format, describe your brand and offer, and get several usable variations back instantly.",
    "watermark-remover":
      "Sometimes you need to clean up a watermark you added yourself — an old proof stamp, a placeholder mark from an earlier draft. This tool is intentionally gated behind an ownership attestation so it can't be used to strip protection from content you don't have rights to edit.",
    "file-converter":
      "Format conversion is one of the most common, most annoying small tasks in marketing work. The CSV/JSON conversion below runs entirely in your browser today; heavier document and media conversions are on the public roadmap and will run through server-side workers.",
    "domain-purchase":
      "Once you've found a domain you like, registering it shouldn't require leaving to compare five different registrars. This tool is designed to route directly to a registrar/reseller partner for checkout.",
    hosting:
      "Hosting is the step most 'launch your brand' tools quietly skip. We're building this to be bundled directly into the unlimited plan, with a standalone option for tool-only users.",
  };

  return <p>{copy[slug] ?? "More detail on this tool is coming soon."}</p>;
}
