import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
