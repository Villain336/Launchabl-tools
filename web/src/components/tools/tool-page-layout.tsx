import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, ServerCog, Handshake } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ToolStatusBadge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import type { ReactNode } from "react";
import type { Tool } from "@/lib/site-config";
import { getRelatedTools } from "@/lib/site-config";

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

  return (
    <Container className="py-12 sm:py-16">
      <Link href="/tools" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> All tools
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{tool.name}</h1>
        <ToolStatusBadge status={tool.status} />
      </div>
      <p className="mt-3 max-w-2xl text-lg text-slate-600">{tool.shortDescription}</p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
        {processing.icon}
        {processing.label}
      </div>

      <div className="mt-10 rounded-3xl border border-slate-200 p-6 sm:p-8">{children}</div>

      <p className="mt-3 text-xs text-slate-500">{processing.note}</p>

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">About this tool</h2>
          <div className="prose prose-slate mt-4 max-w-none text-sm text-slate-700">{about}</div>

          {tool.faq.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-slate-900">FAQ</h2>
              <div className="mt-4 space-y-5">
                {tool.faq.map((item) => (
                  <div key={item.question} className="border-b border-slate-200 pb-4">
                    <p className="font-semibold text-slate-900">{item.question}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-indigo-600 p-6 text-white">
            <h3 className="font-semibold">{tool.upsell.headline}</h3>
            <p className="mt-2 text-sm text-indigo-100">{tool.upsell.body}</p>
            <LinkButton href="/pricing" variant="secondary" size="sm" className="mt-4 text-indigo-700">
              See the unlimited plan
            </LinkButton>
          </div>

          {related.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900">Related tools</h3>
              <ul className="mt-4 space-y-3">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link
                      href={`/tools/${r.slug}`}
                      className="flex items-center justify-between text-sm text-slate-600 hover:text-indigo-600"
                    >
                      {r.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
