import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { siteConfig, toolClusters } from "@/lib/site-config";

const footerColumns = [
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
    heading: "Tool clusters",
    links: toolClusters.map((c) => ({ label: c.name, href: `/tools#${c.slug}` })),
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Acceptable Use", href: "/legal/acceptable-use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <section className="border-t border-border bg-muted/30 px-4 py-16 text-foreground sm:px-6">
      <footer className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-6">
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {siteConfig.description}
            </p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.heading} className="flex flex-col gap-3">
              <h3 className="font-heading text-sm font-semibold text-foreground">{column.heading}</h3>
              <ul className="flex flex-col gap-2.5">
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
            </nav>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built as a strategy + platform scaffold — see{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">docs/STRATEGY.md</code>.
          </p>
        </div>
      </footer>
    </section>
  );
}
