import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <Container className="prose py-16 sm:py-24">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-4 text-sm text-muted-foreground">Placeholder — replace with counsel-reviewed policy before launch.</p>
      <div className="mt-8 space-y-6 text-sm text-foreground">
        <p>
          Client-side tools (Metadata Remover, Image Converter, QR Code Generator, Watermark
          Generator, Schema Markup Generator) process your files entirely in your browser using
          JavaScript. Your files are never uploaded to our servers for these tools.
        </p>
        <p>
          Server-processed tools (File Converter, Watermark Remover, AI Copywriter) transmit
          your input to our servers or a third-party processing API for the duration of the
          request, and are deleted immediately after processing unless you explicitly save the
          result to your Vault.
        </p>
        <p>
          Domain and hosting tools route availability checks and purchases through third-party
          registrar/reseller partners; their privacy policies apply to data shared with them.
        </p>
      </div>
    </Container>
  );
}
