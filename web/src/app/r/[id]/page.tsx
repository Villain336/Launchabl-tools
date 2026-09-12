import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/reports/report-view";
import { loadReport, recordReportView } from "@/lib/reports/storage";
import { siteConfig } from "@/lib/site-config";

/**
 * Public report page. Unlisted: the id is the secret, so search engines are
 * told not to index and there's no listing anywhere on the site.
 */

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) return { title: "Report not found", robots: { index: false, follow: false } };
  return {
    title: report.title,
    description: `A Launchabl report${report.preparedBy ? ` prepared by ${report.preparedBy}` : ""} — ${report.items.filter((i) => i.kind === "tool").length} deliverables.`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({ params }: Params) {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) notFound();
  await recordReportView(id).catch(() => undefined);
  return <ReportView report={report} price={siteConfig.price} />;
}
