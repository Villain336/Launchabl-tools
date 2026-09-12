"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SignInForm } from "@/components/auth/sign-in-form";
import { signOut, useSession } from "@/lib/auth/use-session";

/** /sign-in body: shows the form, or a "you're already in" card, and sends the user back to `next`. */
export function SignInRedirect({ next }: { next: string }) {
  const router = useRouter();
  const session = useSession();

  if (session.status === "ready" && session.user) {
    return (
      <div className="flex flex-col items-center text-center">
        <h1 className="text-[20px] font-semibold tracking-tight text-ink">You&apos;re signed in</h1>
        <p className="mt-1.5 text-[13.5px] text-ink-2">
          as <span className="font-medium text-ink">{session.user.email}</span>
        </p>
        <Link
          href={next}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-control bg-primary px-4 text-[13.5px] font-medium text-primary-foreground hover:opacity-90"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Link>
        <button type="button" onClick={() => void signOut()} className="mt-3 text-[12.5px] text-ink-3 hover:text-ink">
          Use a different account
        </button>
      </div>
    );
  }

  return <SignInForm onSignedIn={() => router.push(next)} />;
}
