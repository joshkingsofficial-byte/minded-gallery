import type { NextConfig } from "next";

// Static export for the preview (GitHub Pages). For production on Vercel with
// the Phase 3 CMS, remove `output: "export"` to enable server routes.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
