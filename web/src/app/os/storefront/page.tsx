import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { OsSubnav } from "@/components/service-business/os-subnav";
import { StorefrontEditor } from "@/components/marketplace/storefront-editor";

export const metadata: Metadata = {
  title: "Storefront editor",
  description: "Customize your public listing like a Shopify theme — colors, services, photos, and quote form.",
  alternates: { canonical: "/os/storefront" },
};

export default function StorefrontEditorPage() {
  return (
    <Container className="py-12 sm:py-16">
      <OsSubnav current="/os/storefront" />
      <SectionHeading
        eyebrow="OS"
        title="Customize the public page"
        description="Pick a theme, change colors, write the about, add services and photos. The live preview on the right is what homeowners see."
      />
      <div className="mt-10">
        <StorefrontEditor />
      </div>
    </Container>
  );
}
