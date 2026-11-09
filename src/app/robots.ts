import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/launch";
import { PUBLIC_PATHS } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [...PUBLIC_PATHS],
      disallow: [
        "/admin",
        "/parent",
        "/coach",
        "/api",
        "/sign-in",
        "/sign-up",
        "/players",
        "/continue",
        "/access-denied",
      ],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
    host: siteOrigin(),
  };
}
