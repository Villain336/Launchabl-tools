import { ImageResponse } from "next/og";
import { getToolBySlug, siteConfig, tools } from "@/lib/site-config";

export const alt = "Launchabl free tool";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

const STATUS_LABEL = { live: "Free forever · no account", beta: "Beta · free", "coming-soon": "Coming soon" } as const;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const name = tool?.name ?? siteConfig.name;
  const description = tool?.shortDescription ?? siteConfig.description;
  const status = tool ? STATUS_LABEL[tool.status] : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #ffffff 0%, #fff4ec 100%)",
          color: "#111111",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FF6600" }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>{siteConfig.name}</div>
          <div style={{ display: "flex", fontSize: 24, color: "#6b6b6b", marginLeft: 8 }}>Free tools</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: name.length > 28 ? 60 : 72, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>{name}</div>
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.35, color: "#3d3d3d", maxWidth: 980 }}>{description.length > 150 ? `${description.slice(0, 148).trimEnd()}…` : description}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "#6b6b6b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 999, background: "#16a34a" }} />
            <div style={{ display: "flex" }}>{status}</div>
          </div>
          <div style={{ display: "flex" }}>{`${siteConfig.url.replace(/^https?:\/\//, "")}/tools/${slug}`}</div>
        </div>
      </div>
    ),
    size,
  );
}
