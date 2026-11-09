import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, publicPageUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: publicPageUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
