import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/conduct"],
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
