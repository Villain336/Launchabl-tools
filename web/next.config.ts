import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The AI Copywriter was folded into the A/B Copy Variant Generator.
      { source: "/tools/copywriter", destination: "/tools/ab-copy-variants", permanent: true },
    ];
  },
};

export default nextConfig;
