import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://standarde-digitale.vercel.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/raport/", "/activitate", "/t/"] },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
