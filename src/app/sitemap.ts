import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORIES } from "@/lib/site";

const HOME = "https://mensonly.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes = ["", "/home", "/explore", "/challenges", "/search"].map(
    (p) => ({
      url: `${HOME}${p}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : 0.8,
    }),
  );

  return [
    ...staticRoutes,
    ...CATEGORIES.map((c) => ({
      url: `${HOME}/explore/${c.key.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...content.map((c) => ({
      url: `${HOME}/content/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}