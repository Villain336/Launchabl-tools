import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
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
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-slate-600">{siteConfig.description}</p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-slate-900">{col.heading}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>Built as a strategy + platform scaffold — see <code className="rounded bg-slate-200 px-1.5 py-0.5">docs/STRATEGY.md</code>.</p>
        </div>
      </Container>
    </footer>
  );
}
