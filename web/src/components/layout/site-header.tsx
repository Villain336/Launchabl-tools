"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu as MenuIcon } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { Button } from "@/components/ui/button";
import { HoveredLink, Menu } from "@/components/ui/navbar-menu";
import { HeaderAccountLink } from "@/components/auth/header-account-link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primaryNav, siteConfig } from "@/lib/site-config";

export function SiteHeader() {
  const [, setActive] = useState<string | null>(null);

  return (
    <header data-site-chrome className="sticky top-0 z-50 overflow-visible border-b border-border bg-background/85 text-foreground backdrop-blur">
      <div className="mx-auto flex h-[5.5rem] w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-foreground">
          <BrandMark size={64} withWordmark={false} />
          <EncryptedText
            text={siteConfig.name}
            className="text-xl font-bold tracking-tight"
            encryptedClassName="text-primary/70"
            revealedClassName="text-foreground"
            revealDelayMs={180}
            holdMs={4500}
          />
          <span className="sr-only">{siteConfig.name} home</span>
        </Link>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <Menu setActive={setActive}>
            <HoveredLink href="/nc" className="text-sm font-medium text-foreground hover:text-primary">
              Directory
            </HoveredLink>
            <HoveredLink href="/os" className="text-sm font-medium text-foreground hover:text-primary">
              OS
            </HoveredLink>
            <HoveredLink href="/agency" className="text-sm font-medium text-foreground hover:text-primary">
              Agency
            </HoveredLink>
            <HoveredLink href="/tools" className="text-sm font-medium text-foreground hover:text-primary">
              Tools
            </HoveredLink>
            <HoveredLink href="/pricing" className="text-sm font-medium text-foreground hover:text-primary">
              Pricing
            </HoveredLink>
            <HoveredLink href="/about" className="text-sm font-medium text-foreground hover:text-primary">
              About
            </HoveredLink>
          </Menu>
        </div>

        <HeaderAccountLink className="ml-auto hidden lg:flex" />

        <Button
          render={<Link href="/os" />}
          nativeButton={false}
          className="hidden lg:inline-flex"
        >
          Get listed
          <ArrowRight data-icon="inline-end" aria-hidden="true" />
        </Button>

        <MobileMenu />
      </div>
    </header>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="icon" className="ml-auto lg:hidden" />}
        aria-label="Open menu"
      >
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>
            <BrandMark size={52} />
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
        <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
          <HeaderAccountLink className="justify-center" />
          <SheetClose
            render={<Link href="/os" />}
            nativeButton={false}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Get listed
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
