"use server";

import { prisma } from "@/lib/prisma";

export type HomeFeedItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentType: string;
  difficulty: string;
  readingTime: number | null;
  image: string | null;
  altText: string | null;
  category: { key: string } | null;
};

export async function homeFeed(): Promise<HomeFeedItem[]> {
  const items = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      contentType: true,
      difficulty: true,
      readingTime: true,
      image: true,
      altText: true,
      category: { select: { key: true } },
    },
    orderBy: [{ featured: "desc" }, { views: "desc" }, { createdAt: "desc" }],
  });

  return items;
}

export type SearchResult = { query: string; results: HomeFeedItem[] };

export async function searchActionRaw(q: string): Promise<SearchResult> {
  const ql = q.trim().toLowerCase();
  if (!ql) return { query: q, results: [] };

  const terms = ql.split(/\s+/).filter(Boolean);

  const rows = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      AND: terms.map((t) => ({
        OR: [
          { searchText: { contains: t } },
          { category: { key: { contains: t } } },
          { category: { label: { contains: t } } },
        ],
      })),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      contentType: true,
      difficulty: true,
      readingTime: true,
      image: true,
      altText: true,
      category: { select: { key: true } },
    },
  });

  const scored = rows
    .map((r) => {
      const title = r.title.toLowerCase();
      const label = (r.category?.key ?? "").toLowerCase();
      let score = 1;
      for (const t of terms) {
        if (title.includes(t)) score += 2;
        if (label.includes(t)) score += 1;
      }
      if (title.includes(ql)) score += 4;
      if (title === ql) score += 5;
      return { item: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
    .map((x) => x.item);

  return { query: q, results: scored };
}