import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://sketch-to.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/pricing/success", "/pricing/cancel"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
