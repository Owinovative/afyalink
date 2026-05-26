import type { MetadataRoute } from "next";
import { absoluteUrl, publicSeoRoutes } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicSeoRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}
