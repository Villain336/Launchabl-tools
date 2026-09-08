"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { primaryNav, siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/ui/container";

function Logo() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <Logo />
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button render={<Link href="/pricing" />} nativeButton={false} className="hidden lg:inline-flex">
            Get unlimited
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>

          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="lg:hidden" />}
              aria-label="Open menu"
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-xs">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Logo />
                  {siteConfig.name}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-2">
                {primaryNav.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={<Link href={link.href} />}
                    nativeButton={false}
                    className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <SheetClose
                  render={<Link href="/pricing" />}
                  nativeButton={false}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Get unlimited
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
