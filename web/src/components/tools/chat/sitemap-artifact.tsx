"use client";

import { useState } from "react";
import { Map as MapIcon, Route } from "lucide-react";
import type { SitemapToolOutput } from "@/lib/ai/tools/site-reports";
import { ArtifactHeader, CopyButton, DownloadButton, Footnote, Pill, Tabs } from "@/components/tools/chat/bits";

type Ok = Extract<SitemapToolOutput, { ok: true }>;

export function SitemapArtifact({ data }: { data: Ok }) {
  const [tab, setTab] = useState<"pages" | "sitemap" | "robots">("pages");
  const { crawl } = data;
  const included = crawl.pages.filter((p) => !p.excluded && (p.status === null || p.status < 400));
  const excluded = crawl.pages.filter((p) => !included.includes(p));
  const content = tab === "sitemap" ? data.files.sitemap : data.files.robots;

  return (
    <div className="not-prose w-full overflow-hidden rounded-card bg-surface shadow-card">
      <ArtifactHeader icon={<MapIcon className="h-4 w-4" />} title={`sitemap.xml + robots.txt for ${crawl.host}`} subtitle={`${included.length} URLs included · ${excluded.length} excluded · crawled in ${(crawl.durationMs / 1000).toFixed(1)}s${crawl.unfetched ? ` · ${crawl.unfetched} links not fetched (limit)` : ""}`}>
        <Tabs value={tab} onChange={setTab} options={[{ key: "pages", label: `URLs (${crawl.pages.length})` }, { key: "sitemap", label: "sitemap.xml" }, { key: "robots", label: "robots.txt" }]} />
        {tab !== "pages" && <CopyButton text={content} />}
        <DownloadButton content={data.files.sitemap} filename="sitemap.xml" type="application/xml" label="sitemap.xml" />
        <DownloadButton content={data.files.robots} filename="robots.txt" type="text/plain" label="robots.txt" />
      </ArtifactHeader>

      <div className="flex flex-wrap gap-2 border-b border-line px-4 py-2.5 text-[12px]">
        <Pill t={crawl.existingSitemap && crawl.existingSitemap.status && crawl.existingSitemap.status < 400 ? "info" : "muted"}>
          {crawl.existingSitemap && crawl.existingSitemap.status && crawl.existingSitemap.status < 400 ? "existing sitemap.xml found" : "no sitemap.xml live"}
        </Pill>
        <Pill t={crawl.robots.exists ? "info" : "muted"}>{crawl.robots.exists ? `existing robots.txt (${crawl.robots.disallowed.length} disallow rules)` : "no robots.txt live"}</Pill>
        {crawl.robots.sitemaps.length > 0 && <Pill t="muted">robots.txt lists {crawl.robots.sitemaps.length} sitemap(s)</Pill>}
      </div>

      {tab === "pages" ? (
        <ul className="max-h-[420px] divide-y divide-line overflow-auto">
          {[...included, ...excluded].map((p) => {
            let path = p.url;
            try {
              const u = new URL(p.url);
              path = u.pathname + u.search;
            } catch {
              // keep the raw url
            }
            return (
              <li key={p.url} className="flex items-center gap-3 px-4 py-2 text-[12.5px]">
                <span className={`w-8 shrink-0 text-right font-mono text-[11px] ${p.status && p.status >= 400 ? "text-red" : "text-ink-3"}`}>{p.status ?? "—"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-ink" title={p.url}>
                    {path}
                  </p>
                  {p.title && <p className="truncate text-[11.5px] text-ink-3">{p.title}</p>}
                </div>
                <span className="shrink-0 text-[11px] text-ink-3">d{p.depth}</span>
                {p.excluded ? <Pill t="warn">{p.excluded}</Pill> : <Pill t="good">included</Pill>}
              </li>
            );
          })}
        </ul>
      ) : (
        <pre className="max-h-[420px] overflow-auto px-4 py-3 font-mono text-[12px] leading-relaxed text-ink">{content}</pre>
      )}
      <Footnote icon={<Route className="h-3 w-3" />}>Upload both files to the site root, then submit {data.sitemapUrl.replace(/^https?:\/\//, "")} in Google Search Console and Bing Webmaster Tools.</Footnote>
    </div>
  );
}
