import Link from "next/link";
import { ArrowLeft, ShieldCheck, ServerCog, Handshake } from "lucide-react";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";
import type { Tool } from "@/lib/site-config";
import { getDeliveryPolicy } from "@/lib/tool-delivery";
import { getToolAgent } from "@/lib/tool-agents";
import { getChatTool } from "@/lib/ai/chat-tools";
import { DeliveryRunProvider } from "@/components/tools/delivery-run";
import { ToolDeliveryCanvas } from "@/components/tools/tool-delivery-canvas";
import { AgentStudio } from "@/components/tools/agent-studio";

const processingCopy: Record<Tool["processing"], { icon: ReactNode; label: string }> = {
  client: { icon: <ShieldCheck className="h-3.5 w-3.5" />, label: "Runs in your browser" },
  server: { icon: <ServerCog className="h-3.5 w-3.5" />, label: "Processed on our servers, then deleted" },
  partner: { icon: <Handshake className="h-3.5 w-3.5" />, label: "Powered by a trusted partner" },
};

/**
 * Tool pages show the tool and nothing else. The `data-tool-page` marker locks
 * the body to the viewport and hides the footer/announcement (see globals.css),
 * so the tool fills the screen below the header without page scrolling.
 */
export function ToolPageLayout({
  tool,
  children,
  about,
}: {
  tool: Tool;
  children?: ReactNode;
  about: ReactNode;
}) {
  // Chat tools own their whole surface; the studio/approval flow is only for legacy form tools.
  const chat = getChatTool(tool.slug);
  const policy = chat ? null : getDeliveryPolicy(tool.slug);
  const agent = chat ? null : getToolAgent(tool.slug);

  if (policy && agent) {
    return (
      <DeliveryRunProvider policy={policy} agent={agent}>
        <AgentStudio tool={tool} about={about}>
          {children}
        </AgentStudio>
      </DeliveryRunProvider>
    );
  }

  const processing = processingCopy[tool.processing];

  const toolBody = chat ? (
    children
  ) : (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link href="/tools" className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> All tools
        </Link>
        <span className="text-muted-foreground/40">·</span>
        <h1 className="text-[15px] font-semibold text-foreground">{tool.name}</h1>
        <ToolStatusBadge status={tool.status} />
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          {processing.icon}
          {processing.label}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-0.5 pt-0.5 pb-4">
        {policy && <ToolDeliveryCanvas />}
        <Card className="p-6 sm:p-8">{children}</Card>
      </div>
    </div>
  );

  return (
    <div data-tool-page className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-3 py-3 sm:px-6 sm:py-4">
        {policy ? <DeliveryRunProvider policy={policy}>{toolBody}</DeliveryRunProvider> : toolBody}
      </div>
    </div>
  );
}
