import type { Metadata } from "next";
import { UsageDashboard } from "@/components/admin/usage-dashboard";

export const metadata: Metadata = {
  title: "AI usage",
  robots: { index: false, follow: false },
};

export default function AdminUsagePage() {
  return <UsageDashboard />;
}
