import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { ToolChat } from "@/components/tools/tool-chat";
import { AGENT_TEMPLATES } from "@/lib/agent/templates";
import { tools } from "@/lib/site-config";

const skillCount = tools.filter((t) => t.status === "live" && t.processing === "server").length;

export const metadata: Metadata = {
  title: "Launchabl Agent — every marketing skill in one conversation",
  description: `${skillCount}+ skills — audits, deliverability, copy, schema, images, cards — chained into end-to-end jobs like launching a page, fixing email or outranking a competitor. Free; first run without an account.`,
  alternates: { canonical: "/agent" },
};

/**
 * The unified agent surface. Same locked-viewport treatment as tool pages
 * (`data-tool-page`), a slimmer header row, and the chat owns the rest.
 */
export default function AgentPage() {
  return (
    <div data-tool-page className="flex min-h-0 flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Launchabl Agent",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: metadata.description,
            featureList: AGENT_TEMPLATES.map((t) => t.title),
          }),
        }}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link href="/tools" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> All tools
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <h1 className="text-[15px] font-semibold text-foreground">Launchabl Agent</h1>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> {skillCount} skills · chained into jobs
            </span>
          </div>
          <ToolChat slug="agent" title="Launchabl Agent" />
        </div>
      </div>
    </div>
  );
}
