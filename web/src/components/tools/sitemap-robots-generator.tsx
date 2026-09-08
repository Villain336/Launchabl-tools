"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/agency-button";
import { downloadBlob } from "@/lib/download";

function buildSitemap(urls: string[]): string {
  const entries = urls
    .map(
      (u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function buildRobots(sitemapUrl: string, blockPaths: string[]): string {
  const disallowLines = blockPaths.filter(Boolean).map((p) => `Disallow: ${p}`);
  return [
    "User-agent: *",
    ...(disallowLines.length ? disallowLines : ["Disallow:"]),
    "",
    sitemapUrl ? `Sitemap: ${sitemapUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function SitemapRobotsGenerator() {
  const [urlsRaw, setUrlsRaw] = useState("");
  const [blockRaw, setBlockRaw] = useState("/admin\n/cart\n/checkout");
  const [copied, setCopied] = useState<string | null>(null);

  const urls = useMemo(
    () =>
      urlsRaw
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter(Boolean),
    [urlsRaw],
  );

  const sitemapUrl = urls[0] ? `${new URL(withProtocol(urls[0])).origin}/sitemap.xml` : "";
  const sitemapXml = useMemo(() => buildSitemap(urls.map(withProtocol)), [urls]);
  const robotsTxt = useMemo(
    () => buildRobots(sitemapUrl, blockRaw.split(/\r?\n/).map((s) => s.trim())),
    [sitemapUrl, blockRaw],
  );

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-foreground">Page URLs (one per line)</label>
          <textarea
            value={urlsRaw}
            onChange={(e) => setUrlsRaw(e.target.value)}
            rows={8}
            placeholder={"https://yourbrand.com/\nhttps://yourbrand.com/solutions\nhttps://yourbrand.com/pricing"}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Paths to block (one per line)</label>
          <textarea
            value={blockRaw}
            onChange={(e) => setBlockRaw(e.target.value)}
            rows={8}
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 font-mono text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OutputBlock
          title="sitemap.xml"
          content={sitemapXml}
          filename="sitemap.xml"
          copied={copied === "sitemap"}
          onCopy={() => copy(sitemapXml, "sitemap")}
        />
        <OutputBlock
          title="robots.txt"
          content={robotsTxt}
          filename="robots.txt"
          copied={copied === "robots"}
          onCopy={() => copy(robotsTxt, "robots")}
        />
      </div>
    </div>
  );
}

function withProtocol(u: string) {
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function OutputBlock({
  title,
  content,
  filename,
  copied,
  onCopy,
}: {
  title: string;
  content: string;
  filename: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadBlob(new Blob([content], { type: "text/plain" }), filename)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">{content}</pre>
    </div>
  );
}
