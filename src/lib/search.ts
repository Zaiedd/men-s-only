// ============================================================
//  MEN'S ONLY · search
//  Full-corpus search over title / description / tags /
//  subcategory / category / body with deterministic ranking.
// ============================================================

import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT = 48;

type ContentWithCat = Awaited<
  ReturnType<typeof queryCandidates>
>[number];

async function queryCandidates(opts: {
  q: string;
  type?: string;
  category?: string;
}) {
  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (opts.type) where.contentType = opts.type;
  if (opts.category) where.category = { key: opts.category };

  const ors = ["title", "description", "tags", "subcategory", "searchText"].map(
    (field) => ({ [field]: { contains: opts.q } }),
  );
  where.OR = ors;

  return prisma.content.findMany({
    where,
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 300,
  });
}

function scoreItem(item: ContentWithCat, query: string): number {
  const q = query.toLowerCase().trim();
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  const tags = item.tags.toLowerCase();
  const sub = (item.subcategory ?? "").toLowerCase();
  const corpus = item.searchText.toLowerCase();
  const catLabel = (item.category.label ?? "").toLowerCase();

  let s = 0;

  if (title === q) s += 1000;
  else if (title.startsWith(q)) s += 700;
  else if (title.includes(q)) s += 500;

  const words = q.split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (!w) continue;
    if (tags.split(",").map((t) => t.trim()).includes(w)) s += 320;
    else if (tags.includes(w)) s += 220;
    if (sub === w) s += 280;
    else if (sub.includes(w)) s += 160;
    if (catLabel === w) s += 240;
    if (desc.includes(w)) s += 150;
  }

  if (desc.includes(q)) s += 120;
  if (corpus.includes(q)) s += 90;

  return s;
}

export async function searchContent(
  query: string,
  opts: { type?: string; category?: string } = {},
) {
  const q = query.trim();
  if (!q) return { items: [], total: 0, query: q };

  const candidates = await queryCandidates({ q, ...opts });
  const ranked = candidates
    .map((c) => ({ item: c, score: scoreItem(c, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = ranked.length;
  const items = ranked.slice(0, SEARCH_LIMIT).map((r) => r.item);
  return { items, total, query: q };
}