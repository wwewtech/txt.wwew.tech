import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://txt.wwew.tech",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}