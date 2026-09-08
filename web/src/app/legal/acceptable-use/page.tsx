import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Acceptable Use Policy" };

export default function AcceptableUsePage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Acceptable Use Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Placeholder — replace with counsel-reviewed policy before launch.</p>
      <div className="mt-8 space-y-6 text-sm text-foreground">
        <h2 className="text-lg font-semibold text-foreground">Watermark Remover</h2>
        <p>
          This tool may only be used on content you own or have explicit, documented rights to
          edit. It must not be used to remove watermarks, copyright notices, or attribution from
          stock photography, licensed media, or any third party&apos;s copyrighted content. Every
          use requires an explicit ownership attestation, which is logged. Violating this policy
          may result in account termination and, where applicable, referral to the appropriate
          rights holder or authorities.
        </p>
        <h2 className="text-lg font-semibold text-foreground">AI Copywriter</h2>
        <p>
          Generated copy is a first draft, not a finished or legally cleared asset. You are
          responsible for fact-checking, originality-checking, and legal review before publishing
          any AI-generated content.
        </p>
        <h2 className="text-lg font-semibold text-foreground">General</h2>
        <p>
          You may not use any tool on this platform to violate the rights of others, to generate
          deceptive or fraudulent content, or to circumvent copyright protection measures beyond
          the narrow, attested use case described above.
        </p>
      </div>
    </Container>
  );
}
