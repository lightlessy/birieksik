import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://birieksik.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/onboarding",
        "/onboarding/",
        "/requests",
        "/requests/",
        "/requests/new",
        "/requests/new/",
        "/auth",
        "/auth/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}