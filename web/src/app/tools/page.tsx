import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ToolsExplorer } from "@/components/tools/tools-explorer";

export const metadata: Metadata = {
  title: "Free Marketing Tools",
  description:
    "QR codes, meta tags, datasets, agent skills, watermarks, schema markup, brand, domain, and copy tools — free to use, no account needed.",
};

export default function ToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading
        eyebrow="The toolbox"
        title="Free tools. Describe what you need, get a real result."
        description="No account required. Every tool tells you exactly how your data is handled, and every result is something you can download, copy, or embed straight away."
      />
      <ToolsExplorer />
    </Container>
  );
}
