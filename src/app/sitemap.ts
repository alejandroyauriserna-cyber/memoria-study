import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.appUrl.replace(/\/$/, "");
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/auth`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/library`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/fuentes-juridicas`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/organizers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/cuaderno`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
}
