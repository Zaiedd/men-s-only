// ============================================================
//  MEN'S ONLY · deterministic recommendations
//  Lightweight, content-based. No ML. Signal: shared tags,
//  category + subcategory proximity, type affinity, recency.
// ============================================================

import { prisma } from "@/lib/prisma";

type ContentWithCat = Awaited<
  ReturnType<typeof prisma.content.findMany>
>[number] & { category: { key: string; label: string } };

function tagSet(tags: string): Set<string> {
  return new Set(
    tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function relatedContent(
  contentId: string,
  opts: { limit?: number } = {},
): Promise<ContentWithCat[]> {
  const limit = opts.limit ?? 3;
  const current = await prisma.content.findUnique({
    where: { id: contentId },
    include: { category: true },
  });
  if (!current) return [];

  const tags = tagSet(current.tags);
  const tagArr = Array.from(tags).slice(0, 4);

  const candidates = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: contentId },
      OR: [
        { category: { key: current.category.key } },
        ...(current.subcategory
          ? [{ subcategory: current.subcategory as string }]
          : []),
        ...tagArr.map((t) => ({ tags: { contains: t } })),
      ],
    },
    include: { category: true },
    take: 120,
  });

  const scored = candidates
    .map((c) => {
      let s = 0;
      const cTags = tagSet(c.tags);
      for (const t of tags) if (cTags.has(t)) s += 5;
      if (c.category.key === current.category.key) s += 3;
      if (c.subcategory && c.subcategory === current.subcategory) s += 4;
      if (c.contentType === current.contentType) s += 1;
      if (c.featured) s += 1;
      if (c.publishedAt) {
        const ageDays = (Date.now() - c.publishedAt.getTime()) / 86_400_000;
        if (ageDays < 30) s += 1;
      }
      return { item: c, s };
    })
    .sort((a, b) => b.s - a.s);

  return scored.slice(0, limit).map((r) => r.item);
}