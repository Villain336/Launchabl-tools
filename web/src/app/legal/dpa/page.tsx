import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Data Processing Agreement" };

export default function DpaPage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Data Processing Agreement (Template)</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Placeholder template — has not been reviewed by counsel and is not binding until it is
        signed by both parties (typically as an addendum referenced from your Master Services
        Agreement or Terms of Service). Request a countersigned copy at{" "}
        <a href="mailto:security@launchabl.io" className="underline">
          security@launchabl.io
        </a>
        . Have your own counsel review before relying on this as your final agreement.
      </p>

      <div className="mt-8 space-y-8 text-sm text-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Parties &amp; definitions</h2>
          <p className="mt-2">
            This Data Processing Agreement (&ldquo;<strong>DPA</strong>&rdquo;) is entered into
            between Launchabl (&ldquo;<strong>Processor</strong>&rdquo;) and the customer entity
            identified in the applicable order form or Terms of Service acceptance (&ldquo;
            <strong>Controller</strong>&rdquo;), and forms part of the agreement between the
            parties governing Controller&apos;s use of the Launchabl service (the &ldquo;
            <strong>Agreement</strong>&rdquo;). Terms such as &ldquo;personal data,&rdquo;
            &ldquo;processing,&rdquo; &ldquo;controller,&rdquo; and &ldquo;processor&rdquo; have
            the meanings given in the EU General Data Protection Regulation (GDPR) and, where
            applicable, the California Consumer Privacy Act (CCPA) and other applicable data
            protection law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Subject matter and duration</h2>
          <p className="mt-2">
            Processor processes personal data on Controller&apos;s behalf solely to provide the
            Launchabl service as described in the Agreement, for the duration of the Agreement,
            unless a longer retention period is required by law or agreed in writing.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Nature and purpose of processing</h2>
          <p className="mt-2">
            Personal data is processed to: authenticate and identify Controller&apos;s account and
            authorized users; deliver the requested tool output (which may include transmitting
            Controller-submitted input to an AI model provider for the duration of generating a
            response); process payment for a subscription or credit pack; and provide customer
            support. See{" "}
            <Link href="/legal/subprocessors" className="underline">
              the subprocessor list
            </Link>{" "}
            for exactly which third parties may process this data and why.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Categories of data subjects and personal data</h2>
          <p className="mt-2">
            Data subjects: Controller&apos;s authorized users (employees/contractors) who hold
            accounts on the service. Categories of personal data: name, email address, and
            authentication metadata; content submitted to a tool (which may itself contain
            personal data at Controller&apos;s discretion — Controller is responsible for having
            a lawful basis to submit any such content); and billing contact information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Processor obligations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process personal data only on Controller&apos;s documented instructions, including as set out in the Agreement, unless required otherwise by law (in which case Processor will inform Controller before processing, unless prohibited from doing so).</li>
            <li>Ensure personnel authorized to process personal data are bound by confidentiality obligations.</li>
            <li>Implement the technical and organizational security measures described in Section 7.</li>
            <li>Assist Controller, at Controller&apos;s reasonable request, in responding to data subject rights requests and in Controller&apos;s own compliance obligations under applicable data protection law, to the extent the nature of the processing allows.</li>
            <li>Notify Controller without undue delay, and in any case within 72 hours of confirming an incident meets this bar, after becoming aware of a personal data breach affecting Controller&apos;s data — see Section 8.</li>
            <li>At Controller&apos;s choice, delete or return all personal data at the end of the Agreement, except where retention is required by law (e.g. Stripe&apos;s own financial-record retention for payment data).</li>
            <li>Make available information reasonably necessary to demonstrate compliance with this DPA, and allow for and contribute to audits, including inspections, conducted by Controller or an auditor mandated by Controller, on reasonable notice and no more than once per year absent a specific incident.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Subprocessors</h2>
          <p className="mt-2">
            Controller provides general authorization for Processor to engage the subprocessors
            listed at{" "}
            <Link href="/legal/subprocessors" className="underline">
              /legal/subprocessors
            </Link>
            . Processor will notify Controller before adding a new subprocessor that will process
            Controller&apos;s personal data, giving Controller a reasonable opportunity to object
            on reasonable data-protection grounds. Processor remains liable for each
            subprocessor&apos;s performance to the same extent Processor would be liable if
            performing that subprocessor&apos;s services directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Security measures</h2>
          <p className="mt-2">
            Processor maintains the technical and organizational measures described in the{" "}
            <Link href="/security" className="underline">
              Security &amp; Data Handling
            </Link>{" "}
            page, including: encryption in transit (TLS) for all traffic; encryption at rest
            provided by underlying infrastructure providers; access controls restricting
            administrative access to a limited set of authorized personnel; an audit log of
            administrative and account-affecting actions; and webhook signature verification and
            idempotent processing for all payment events.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">8. Personal data breach notification</h2>
          <p className="mt-2">
            Processor will notify Controller without undue delay, and in any case within 72 hours
            of confirming that an incident meets this bar, after becoming aware of a breach of
            security leading to the accidental or unlawful destruction, loss, alteration,
            unauthorized disclosure of, or access to, personal data processed under this DPA.
            That notice will describe, to the extent then known: the nature of the breach; the
            categories and approximate number of data subjects and records affected; the likely
            consequences; and the measures taken or proposed to address it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">9. International data transfers</h2>
          <p className="mt-2">
            Personal data is currently processed and stored in the United States (see{" "}
            <Link href="/legal/subprocessors" className="underline">
              subprocessor locations
            </Link>
            ). Where Controller&apos;s personal data originates in the European Economic Area,
            United Kingdom, or Switzerland, the parties agree that the Standard Contractual
            Clauses (as adopted by the European Commission) are incorporated by reference to the
            extent legally required for that transfer, until such time as Processor offers an
            EU-hosted processing option.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">10. Liability &amp; term</h2>
          <p className="mt-2">
            Liability under this DPA is subject to the limitations of liability set out in the
            Agreement. This DPA remains in effect for as long as Processor processes personal
            data on Controller&apos;s behalf under the Agreement and terminates automatically
            upon termination of the Agreement.
          </p>
        </section>
      </div>
    </Container>
  );
}
