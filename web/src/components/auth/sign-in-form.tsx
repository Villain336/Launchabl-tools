"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Lock, Sparkles } from "lucide-react";
import { setSessionUser, type SessionUser } from "@/lib/auth/use-session";

type Step = "email" | "code";

/**
 * Email sign-in. Used inline in the chat (after the free run) and on /sign-in.
 * The server decides whether a code step is needed (only when an email
 * sender is configured), so the form just follows `step` in the response.
 */
export function SignInForm({ onSignedIn, compact = false, reason }: { onSignedIn?: (user: SessionUser) => void; compact?: boolean; reason?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, code: step === "code" ? code : undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; step?: Step; user?: SessionUser };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      if (data.step === "code") {
        setStep("code");
        return;
      }
      if (data.user) {
        setSessionUser(data.user);
        onSignedIn?.(data.user);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const field = "h-10 w-full rounded-control border border-line bg-field px-3 text-[13.5px] text-ink placeholder:text-ink-3 outline-none transition-colors focus:border-line-strong focus:bg-surface";

  return (
    <form onSubmit={submit} className={compact ? "" : "mx-auto w-full max-w-sm"} data-sign-in-form>
      {!compact && (
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-[20px] font-semibold tracking-tight text-ink">Create your free account</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{reason ?? "Every tool, unlimited runs, saved conversations. No credit card."}</p>
        </div>
      )}
      {step === "email" ? (
        <div className="flex flex-col gap-2">
          <input type="email" required autoComplete="email" inputMode="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoFocus={!compact} />
          <input type="text" autoComplete="name" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-ink-2">
            We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
          </p>
          <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${field} font-mono tracking-[0.3em]`} autoFocus />
          <button type="button" onClick={() => setStep("email")} className="self-start text-[12px] text-ink-3 hover:text-ink">
            Use a different email
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-[12.5px] text-red">{error}</p>}
      <button
        type="submit"
        disabled={busy || (step === "email" ? !email : code.length < 6)}
        className="mt-3 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-control bg-primary px-4 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : step === "email" ? "Continue" : "Sign in"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11.5px] text-ink-3">
        <Lock className="h-3 w-3" /> No password. No spam. Unsubscribe from anything in one click.
      </p>
    </form>
  );
}
