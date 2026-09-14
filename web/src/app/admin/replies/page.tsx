import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { AdminRepliesPanel } from "@/components/admin/replies-panel";

export const metadata: Metadata = {
  title: "Run reply queue",
  robots: { index: false, follow: false },
};

export default function AdminRepliesPage() {
  return (
    <Container className="py-12 sm:py-16">
      <h1 className="font-heading text-3xl font-bold">Run reply queue</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Draft the neighborhood reply. The operator copies it from /os/replies. We do not scrape and we do not post as them.
      </p>
      <div className="mt-8">
        <AdminRepliesPanel />
      </div>
    </Container>
  );
}
