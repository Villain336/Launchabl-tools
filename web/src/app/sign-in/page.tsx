import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SignInRedirect } from "@/components/auth/sign-in-redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Create a free Launchabl account to keep using every tool without limits.",
  robots: { index: false, follow: true },
};

function safeNext(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/tools";
  return raw;
}

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  return (
    <Container className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-sm rounded-card bg-surface p-6 shadow-card sm:p-8">
        <SignInRedirect next={next} />
      </div>
      <p className="mt-6 text-center text-[12.5px] text-ink-3">
        Your first run of any tool works without an account. After that we ask for an email so the free tools stay free for everyone.
      </p>
    </Container>
  );
}
