import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://standarde-digitale.vercel.app";
  return [
    { url: site, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${site}/metodologie`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${site}/exemplu`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  ];
}
