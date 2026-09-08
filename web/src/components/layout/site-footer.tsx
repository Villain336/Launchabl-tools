import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { siteConfig, toolClusters } from "@/lib/site-config";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Tools", href: "/tools" },
      { label: "Solutions", href: "/solutions" },
      { label: "Pricing", href: "/pricing" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    heading: "Clusters",
    links: toolClusters.slice(0, 4).map((c) => ({ label: c.name, href: `/tools#${c.slug}` })),
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy", href: "/legal/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex flex-col items-center gap-5 border-b border-border py-12 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Ready to stop paying a retainer?
          </h2>
          <p className="max-w-md text-sm text-pretty text-muted-foreground">
            Start with a free tool. When you&apos;re ready, {siteConfig.price} once unlocks unlimited
            marketing and design requests.
          </p>
          <Button render={<Link href="/pricing" />} nativeButton={false} size="lg">
            Get unlimited
            <ChevronRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Link href="/" className="text-foreground">
              <BrandMark size={56} />
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.tagline}</p>
          </div>
          {columns.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h3 className="font-heading text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/legal/acceptable-use" className="hover:text-foreground">
              Acceptable use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
