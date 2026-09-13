import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { siteConfig, tools } from "@/lib/site-config";

const columns = [
  {
    heading: "Product",
    links: [
      { label: "Directory", href: "/nc" },
      { label: "OS", href: "/os" },
      { label: "Agency", href: "/agency" },
      { label: "Tools", href: "/tools" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    heading: "Popular tools",
    links: ["website-audit-report", "local-seo-optimizer", "schema-generator", "page-speed-audit"]
      .map((slug) => tools.find((tool) => tool.slug === slug))
      .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
      .map((tool) => ({ label: tool.name, href: `/tools/${tool.slug}` })),
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Blog", href: "/blog" },
      { label: "Security", href: "/security" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer data-site-chrome className="w-full border-t border-border bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-6">
        <div className="flex flex-col items-center gap-5 border-b border-border py-12 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            Get listed in North Carolina
          </h2>
          <p className="max-w-md text-sm text-pretty text-muted-foreground">
            A public storefront, leads from the directory, and an OS for the jobs that follow. Agency Launch is still {siteConfig.price} to get set up.
          </p>
          <Button render={<Link href="/os" />} nativeButton={false} size="lg">
            Open the OS
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
            <Link href="/legal/subprocessors" className="hover:text-foreground">
              Subprocessors
            </Link>
            <Link href="/legal/dpa" className="hover:text-foreground">
              DPA
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
