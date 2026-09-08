"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu as MenuIcon } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { EncryptedText } from "@/components/ui/encrypted-text";
import { Button } from "@/components/ui/button";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { primaryNav, siteConfig, toolClusters } from "@/lib/site-config";
import { artForCluster } from "@/lib/marquee-art";

export function SiteHeader() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-background/85 text-foreground backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3 text-foreground">
          <BrandMark size={56} withWordmark={false} />
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
            <MenuItem setActive={setActive} active={active} item="Tools">
              <div className="grid grid-cols-2 gap-4 p-2 text-sm">
                {toolClusters.map((cluster) => (
                  <ProductItem
                    key={cluster.slug}
                    title={cluster.name}
                    href={`/tools#${cluster.slug}`}
                    src={artForCluster(cluster.slug)}
                    description={cluster.description}
                  />
                ))}
              </div>
            </MenuItem>
            <MenuItem setActive={setActive} active={active} item="Solutions">
              <div className="flex flex-col space-y-3 text-sm">
                <HoveredLink href="/solutions">All solutions</HoveredLink>
                <HoveredLink href="/solutions">Brand & identity</HoveredLink>
                <HoveredLink href="/solutions">Website design & build</HoveredLink>
                <HoveredLink href="/solutions">SEO & technical marketing</HoveredLink>
                <HoveredLink href="/pricing">Unlimited plan</HoveredLink>
              </div>
            </MenuItem>
            <MenuItem setActive={setActive} active={active} item="Work">
              <div className="flex flex-col space-y-3 text-sm">
                <HoveredLink href="/case-studies">Case studies</HoveredLink>
                <HoveredLink href="/blog">Blog</HoveredLink>
                <HoveredLink href="/roadmap">Roadmap</HoveredLink>
              </div>
            </MenuItem>
            <HoveredLink href="/pricing" className="text-sm font-medium text-foreground hover:text-primary">
              Pricing
            </HoveredLink>
            <HoveredLink href="/about" className="text-sm font-medium text-foreground hover:text-primary">
              About
            </HoveredLink>
          </Menu>
        </div>

        <Button
          render={<Link href="/pricing" />}
          nativeButton={false}
          className="ml-auto hidden lg:inline-flex"
        >
          Get unlimited
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
            <BrandMark size={48} />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col px-2">
          <SheetClose
            render={<Link href="/tools" />}
            nativeButton={false}
            className="rounded-md px-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            All tools
          </SheetClose>
          {toolClusters.map((cluster) => (
            <SheetClose
              key={cluster.slug}
              render={<Link href={`/tools#${cluster.slug}`} />}
              nativeButton={false}
              className="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {cluster.name}
            </SheetClose>
          ))}
          {primaryNav
            .filter((link) => link.href !== "/tools")
            .map((link) => (
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
  );
}
