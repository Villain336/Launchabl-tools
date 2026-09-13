import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Security & Data Handling" };

export default function SecurityPage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Security &amp; Data Handling</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Last reviewed: {new Date().toISOString().slice(0, 10)}. This page is the honest, current
        state of our security posture — not an aspirational claim. See the{" "}
        <Link href="/legal/subprocessors" className="underline">
          subprocessor list
        </Link>{" "}
        and{" "}
        <Link href="/legal/dpa" className="underline">
          DPA template
        </Link>{" "}
        for the related documents referenced below.
      </p>

      <div className="mt-8 space-y-8 text-sm text-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">Encryption</h2>
          <p className="mt-2">
            All traffic to and from Launchabl is served over TLS (HTTPS) — Vercel&apos;s edge
            network terminates TLS 1.2+ for every request, and we don&apos;t serve any endpoint
            over plain HTTP. Data at rest is encrypted by each underlying infrastructure
            provider: Vercel-managed storage (Blob, and the Postgres instance backing the audit
            log and billing ledger) and Upstash Redis both encrypt data at rest on their
            respective platforms. We don&apos;t currently layer application-level encryption on
            top of provider-level at-rest encryption for any field; if a future enterprise
            requirement needs a customer-supplied API key stored with us (the BYO-model-key
            option, below), that specific field would be encrypted at the application layer
            before it&apos;s ever written to storage.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Where your data lives</h2>
          <p className="mt-2">
            Client-side tools (for example the Metadata Remover, Image Converter, QR Code
            Generator, and Watermark Generator) process files entirely in your browser — those
            files are never uploaded to our servers. Server-processed tools (the AI-powered
            tools, File Converter, Watermark Remover, transcription) transmit input to our
            servers or a named subprocessor for the duration of the request only, and results
            are not retained beyond what you explicitly save to your account (a saved report, a
            Vault project). See the full breakdown on the{" "}
            <Link href="/legal/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">
            AI model providers, prompts, and training
          </h2>
          <p className="mt-2">
            Every AI-powered tool routes model calls through Vercel&apos;s AI Gateway to
            underlying frontier-model providers (currently Anthropic, OpenAI, and Google, plus
            specialist image/media providers — see the{" "}
            <Link href="/legal/subprocessors" className="underline">
              subprocessor list
            </Link>{" "}
            for the exact current set). <strong>We do not use your prompts or outputs to train
            our own models</strong> — we don&apos;t train any models at all. On the
            underlying providers&apos; side: enterprise/API-tier agreements with Anthropic,
            OpenAI, and Google all state that API inputs and outputs are not used to train their
            models by default, which is the tier the AI Gateway routes through. We have not yet
            independently re-verified and filed the specific zero-retention/no-training contract
            language for every provider behind the gateway — that verification, and publishing
            the confirmed terms per provider, is the next concrete step here rather than an
            assumption we&apos;re asking you to take on faith. If a per-provider written
            no-training confirmation is a hard requirement for your deal, ask us and we&apos;ll
            get it in writing before you sign.
          </p>
          <p className="mt-2">
            For customers who need to avoid the shared AI Gateway data path entirely — for
            example, an existing enterprise agreement directly with a model provider — a
            bring-your-own-model-key option is on our near-term roadmap so requests route
            directly to your own provider agreement instead of through the shared gateway.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Access control</h2>
          <p className="mt-2">
            Accounts are gated by a signed session, and administrative access is currently
            restricted to a small number of operators via a dedicated admin credential, separate
            from customer sessions. Sensitive administrative actions and account-affecting events
            (organization membership changes, billing state changes) are recorded in an
            append-only audit log for internal review and to answer &ldquo;who did what,
            when&rdquo; during a security review.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Subprocessors</h2>
          <p className="mt-2">
            We keep the full, current list of every third party that can process customer data on
            our behalf on a dedicated page, since it changes as we add providers:{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">Incident response</h2>
          <p className="mt-2">
            If you believe you&apos;ve found a security issue, or if you&apos;re a customer
            responding to an incident on our side, contact{" "}
            <a href="mailto:security@launchabl.io" className="underline">
              security@launchabl.io
            </a>
            . We aim to acknowledge a reported security issue within one business day.
          </p>
          <p className="mt-2">
            If we confirm an incident that affects customer data, our commitment is to notify
            affected account holders without undue delay and, in any case, within 72 hours of
            confirming the incident meets that bar — consistent with GDPR&apos;s notification
            expectations even for customers outside the EU. That notification will describe what
            happened, what data was affected, what we&apos;ve done to contain it, and what you
            should do next. This is the same commitment reflected in our{" "}
            <Link href="/legal/dpa" className="underline">
              DPA template
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">What we&apos;re not claiming</h2>
          <p className="mt-2">
            We are not SOC 2 certified today. A SOC 2 Type II program is on our roadmap once
            there&apos;s an enterprise pipeline that justifies starting the (multi-month) control
            implementation and audit cycle — we&apos;d rather tell you that plainly than imply a
            certification that doesn&apos;t exist yet. If SOC 2 is a hard requirement for your
            deal today, tell us — it changes how we prioritize the roadmap.
          </p>
        </section>
      </div>
    </Container>
  );
}
