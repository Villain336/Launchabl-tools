"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Menu } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { primaryNav, siteConfig, toolClusters } from "@/lib/site-config";

const pillSpring = { type: "spring" as const, stiffness: 400, damping: 34 };

const capsuleLinks = primaryNav.filter((link) => link.href !== "/tools");

export function SiteHeader() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const activeIndex = capsuleLinks.findIndex(
    (link) => pathname === link.href || pathname.startsWith(link.href + "/"),
  );
  const shown = hovered ?? (activeIndex === -1 ? 0 : activeIndex);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 text-foreground backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="shrink-0 text-foreground">
          <BrandMark size={32} />
          <span className="sr-only">{siteConfig.name} home</span>
        </Link>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="h-9 gap-1 px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground data-popup-open:text-foreground">
                Tools
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="flex w-72 flex-col p-1">
                  {toolClusters.map((cluster) => (
                    <li key={cluster.slug}>
                      <NavigationMenuLink
                        render={<Link href={`/tools#${cluster.slug}`} />}
                        className="flex-col items-start gap-0.5 p-2.5"
                      >
                        <span className="text-sm font-medium text-foreground">{cluster.name}</span>
                        <span className="text-xs text-muted-foreground">{cluster.description}</span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <nav
          onMouseLeave={() => setHovered(null)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(null);
          }}
          className="ml-auto hidden items-center gap-0.5 rounded-[calc(var(--radius-md)+4px)] border border-border bg-muted/60 p-1 backdrop-blur lg:flex"
        >
          {capsuleLinks.map((link, i) => {
            const isShown = shown === i;
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onMouseEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                className={cn(
                  "relative rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isShown ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isShown && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden="true"
                    transition={reduce ? { duration: 0 } : pillSpring}
                    className="absolute inset-0 -z-10 rounded-md bg-background shadow-sm"
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Button render={<Link href="/pricing" />} nativeButton={false} className="hidden lg:inline-flex">
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
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xs">
        <SheetHeader>
          <SheetTitle>
            <BrandMark size={28} />
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
