import { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://finly.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: APP_URL,              lastModified: new Date(), changeFrequency: "daily"  as const, priority: 1 },
    { url: `${APP_URL}/markets`, lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${APP_URL}/crypto`,  lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.9 },
    { url: `${APP_URL}/news`,    lastModified: new Date(), changeFrequency: "hourly" as const, priority: 0.8 },
    { url: `${APP_URL}/portfolio`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
  ];

  return staticPages;
}
