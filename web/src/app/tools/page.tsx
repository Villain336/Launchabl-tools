import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { ToolsExplorer } from "@/components/tools/tools-explorer";

export const metadata: Metadata = {
  title: "Free Marketing Tools",
  description:
    "QR codes, meta tags, datasets, agent skills, watermarks, schema markup, brand, domain, and copy tools — free to use — your first run needs no account.",
};

export default function ToolsPage() {
  return (
    <Container className="py-12 sm:py-16">
      <SectionHeading
        eyebrow="The toolbox"
        title="Free tools. Describe what you need, get a real result."
        description="Your first run needs no account; after that a free email sign-in unlocks unlimited runs. Every tool tells you exactly how your data is handled, and every result is something you can download, copy, or embed straight away."
      />
      <ToolsExplorer />
    </Container>
  );
}
