import type { NextConfig } from "next";

/** Playwright 1.60+ loads browsers.json dynamically; NFT misses it. Sparticuz binaries are not JS imports. */
const auditTraceIncludes = [
  "./node_modules/playwright-core/browsers.json",
  "./node_modules/playwright-core/**/*",
  "./node_modules/@sparticuz/chromium/package.json",
  "./node_modules/@sparticuz/chromium/build/**/*",
  "./node_modules/@sparticuz/chromium/bin/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/audit": auditTraceIncludes,
    "/api/audit/**": auditTraceIncludes,
    "/api/audit/route": auditTraceIncludes,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
