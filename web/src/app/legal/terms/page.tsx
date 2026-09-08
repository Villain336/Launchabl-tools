import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-4 text-sm text-muted-foreground">Placeholder — replace with counsel-reviewed terms before launch.</p>
      <div className="mt-8 space-y-6 text-sm text-foreground">
        <p>
          These terms govern use of the free tools and the unlimited request-based service
          (&ldquo;the Plan&rdquo;). By using either, you agree to the Acceptable Use Policy,
          including the ownership attestation required for tools like the Watermark Remover.
        </p>
        <p>
          The Plan entitles you to submit unlimited requests within the defined service
          categories, processed one active request at a time. It does not include custom
          software development, paid advertising spend, or unlimited simultaneous requests.
        </p>
        <p>
          Free tools that process files entirely client-side (see each tool&apos;s data-handling
          note) never transmit your files to our servers. Tools marked server-processed do
          transmit files for the duration of processing only.
        </p>
      </div>
    </Container>
  );
}
