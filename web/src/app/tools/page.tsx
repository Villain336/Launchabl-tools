import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Code2, Sparkles } from "lucide-react";
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
      <div className="mt-8 grid gap-3 sm:grid-cols-2" data-workspaces>
        {WORKSPACES.map((item) => (
          <Link key={item.href} href={item.href} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-[14px] font-semibold text-foreground">
                {item.title}
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">{item.description}</span>
            </span>
          </Link>
        ))}
      </div>
      <ToolsExplorer />
    </Container>
  );
}

const WORKSPACES = [
  { href: "/agent", icon: Sparkles, title: "Launchabl Agent", description: "Every skill in one conversation — chains audits, copy, schema and images into a finished job." },
  { href: "/ide", icon: Code2, title: "Code editor", description: "Open a GitHub repo or a ZIP, edit with live preview, and let the assistant propose diffs you accept file by file. Commit or open a PR when you're done." },
];
