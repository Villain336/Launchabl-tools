"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { signOut, useSession } from "@/lib/auth/use-session";

/**
 * The marketing site header never had an account entry point — sign-in only
 * ever appeared inside a tool's chat UI (see AccountChip in tool-chat.tsx).
 * That made the whole account/billing system invisible from the homepage,
 * /pricing and every other marketing page. This is the same idea, styled for
 * the header's shadcn-based nav instead of the tool chat's custom tokens.
 */
export function HeaderAccountLink({ className = "" }: { className?: string }) {
  const session = useSession();
  const pathname = usePathname();
  if (session.status !== "ready") return null;

  if (session.user) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`} data-account-link="user">
        <Link href="/tools" className="flex items-center gap-1.5 hover:text-foreground">
          <UserRound className="size-4" aria-hidden="true" />
          <span className="max-w-[140px] truncate">{session.user.name || session.user.email}</span>
        </Link>
        {session.isPro && (
          <span className="rounded-[4px] bg-primary/10 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary" data-pro-badge="true">
            Pro
          </span>
        )}
        <button type="button" onClick={() => void signOut()} className="hover:text-foreground">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <Link
      href={`/sign-in?next=${encodeURIComponent(pathname ?? "/tools")}`}
      className={`flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary ${className}`}
      data-account-link="anon"
    >
      <UserRound className="size-4" aria-hidden="true" />
      Sign in
    </Link>
  );
}
