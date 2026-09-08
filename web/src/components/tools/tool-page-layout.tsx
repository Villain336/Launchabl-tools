import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, ServerCog, Handshake } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ToolStatusBadge } from "@/components/ui/agency-badge";
import { LinkButton } from "@/components/ui/agency-button";
import { Card } from "@/components/ui/card";
import FaqsBlock from "@/components/blocks/faqs-1";
import type { ReactNode } from "react";
import type { Tool } from "@/lib/site-config";
import { getRelatedTools } from "@/lib/site-config";
import { getDeliveryPolicy } from "@/lib/tool-delivery";
import { DeliveryRunProvider } from "@/components/tools/delivery-run";
import { ToolDeliveryCanvas } from "@/components/tools/tool-delivery-canvas";

const processingCopy: Record<Tool["processing"], { icon: ReactNode; label: string; note: string }> = {
  client: {
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Runs entirely in your browser",
    note: "Your files are never uploaded — everything happens on your device.",
  },
  server: {
    icon: <ServerCog className="h-4 w-4" />,
    label: "Processed on our servers",
    note: "Your input is sent securely for processing and deleted immediately after.",
  },
  partner: {
    icon: <Handshake className="h-4 w-4" />,
    label: "Powered by a trusted partner",
    note: "This tool routes to a third-party registrar/hosting partner for live data and checkout.",
  },
};

export function ToolPageLayout({
  tool,
  children,
  about,
}: {
  tool: Tool;
  children: ReactNode;
  about: ReactNode;
}) {
  const processing = processingCopy[tool.processing];
  const related = getRelatedTools(tool);
  const policy = getDeliveryPolicy(tool.slug);

  const toolBody = (
    <>
      {policy && <ToolDeliveryCanvas />}
      <Card className="mt-6 p-6 sm:p-8">{children}</Card>
    </>
  );

  return (
    <Container className="py-12 sm:py-16">
      <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All tools
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{tool.name}</h1>
        <ToolStatusBadge status={tool.status} />
      </div>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{tool.shortDescription}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {processing.icon}
        {processing.label}
      </div>

      {policy ? <DeliveryRunProvider policy={policy}>{toolBody}</DeliveryRunProvider> : toolBody}

      <p className="mt-3 text-xs text-muted-foreground">{processing.note}</p>

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground">About this tool</h2>
          <div className="prose prose-slate mt-4 max-w-none text-sm text-muted-foreground">{about}</div>

          {tool.faq.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-foreground">FAQ</h2>
              <div className="mt-4">
                <FaqsBlock items={tool.faq} compact />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-primary p-6 text-primary-foreground">
            <h3 className="font-semibold">{tool.upsell.headline}</h3>
            <p className="mt-2 text-sm text-primary-foreground/80">{tool.upsell.body}</p>
            <LinkButton
              href="/pricing"
              variant="secondary"
              size="sm"
              className="mt-4 bg-background text-foreground hover:bg-background/90"
            >
              See the unlimited plan
            </LinkButton>
          </Card>

          {related.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-foreground">Related tools</h3>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/tools/${r.slug}`}
                      className="flex items-center justify-between text-sm text-muted-foreground hover:text-primary"
                    >
                      {r.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
