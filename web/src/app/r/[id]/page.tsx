import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReportView } from "@/components/reports/report-view";
import { loadProjectBrand } from "@/lib/projects/storage";
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
  const brand = report.projectId ? await loadProjectBrand(report.projectId) : null;
  const by = brand?.brand.agencyName ?? (brand?.brand.hideBadge ? null : "Launchabl");
  return {
    title: report.title,
    description: `${by ? `A ${by} report` : "A report"}${report.preparedBy ? ` prepared by ${report.preparedBy}` : ""} — ${report.items.filter((i) => i.kind === "tool").length} deliverables.`,
    robots: { index: false, follow: false },
  };
}

export default async function ReportPage({ params }: Params) {
  const { id } = await params;
  const report = await loadReport(id);
  if (!report) notFound();
  await recordReportView(id).catch(() => undefined);
  const brand = report.projectId ? await loadProjectBrand(report.projectId) : null;
  return <ReportView report={report} price={siteConfig.price} brand={brand} />;
}
