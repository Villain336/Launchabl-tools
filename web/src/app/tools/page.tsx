import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ToolsExplorer } from "@/components/tools/tools-explorer";

export const metadata: Metadata = {
  title: "Free Marketing Tools",
  description:
    "Watermark, metadata, QR, schema markup, brand, domain, and copy tools — free to use, organized by what you're actually trying to accomplish.",
};

export default function ToolsPage() {
  return (
    <Container className="py-16 sm:py-24">
      <SectionHeading
        eyebrow="The toolbox"
        title="Free tools, organized by outcome"
        description="No account required for single-file actions. Every tool tells you exactly how your data is handled, and every result points at a clear next step."
      />
      <ToolsExplorer />
    </Container>
  );
}
