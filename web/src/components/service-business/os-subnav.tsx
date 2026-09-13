import Link from "next/link";

const LINKS = [
  { href: "/os/dashboard", label: "Dashboard" },
  { href: "/os/offers", label: "Offers" },
  { href: "/os/schedule", label: "Schedule" },
  { href: "/os/inventory", label: "Inventory" },
  { href: "/os/warranty", label: "Warranty" },
  { href: "/os/automations", label: "Automations" },
  { href: "/os/storefront", label: "Storefront" },
  { href: "/crm", label: "CRM" },
] as const;

export function OsSubnav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={
            link.href === current
              ? "rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground"
              : "rounded-full border border-border px-3 py-1 text-muted-foreground hover:text-foreground"
          }
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
