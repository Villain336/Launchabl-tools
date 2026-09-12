import type { Metadata } from "next";
import { Ide } from "@/components/ide/ide";

export const metadata: Metadata = {
  title: "Code editor — edit a repo or a site in the browser with an AI assistant",
  description:
    "Open a GitHub repo, a ZIP or a blank project; edit with syntax highlighting and live preview; ask the assistant to read, search and propose diffs you accept file by file. Commit to a branch or open a pull request. Bring your own API key or use ours, free.",
  alternates: { canonical: "/ide" },
};

/**
 * Locked-viewport shell like the tool pages; the editor owns everything under
 * the header. All state lives in the browser until the user commits.
 */
export default function IdePage() {
  return (
    <div data-tool-page className="flex min-h-0 flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Launchabl Code Editor",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: metadata.description,
            featureList: ["GitHub import and commit", "ZIP and folder upload", "CodeMirror editor with live HTML and Markdown preview", "AI assistant with diff review", "Bring your own API key"],
          }),
        }}
      />
      <Ide />
    </div>
  );
}
