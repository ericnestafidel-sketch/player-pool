import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/privacy", "/terms", "/conduct", "/code-of-conduct"],
      disallow: [
        "/parent",
        "/coach",
        "/admin",
        "/players",
        "/sign-in",
        "/sign-up",
        "/continue",
        "/access-denied",
        "/api",
      ],
    },
  };
}
