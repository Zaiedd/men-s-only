import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/ContentCard";
import { CATEGORIES } from "@/lib/site";

export const dynamic = "force-dynamic";

const VALID_CAT = new Set(CATEGORIES.map((c) => c.key));

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentType: string;
  difficulty: string;
  readingTime: number | null;
  image: string | null;
  altText: string | null;
  views: number;
  category: { key: string } | null;
};

async function counts(): Promise<Record<string, number>> {
  const rows = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    select: { category: { select: { key: true } } },
  });
  const map: Record<string, number> = {};
  for (const r of rows) {
    const k = r.category?.key ?? "KNOWLEDGE";
    map[k] = (map[k] ?? 0) + 1;
  }
  return map;
}

const SELECT = {
  id: true,
  slug: true,
  title: true,
  description: true,
  contentType: true,
  difficulty: true,
  readingTime: true,
  image: true,
  altText: true,
  views: true,
  category: { select: { key: true } },
} as const;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const sel = cat && VALID_CAT.has(cat) ? cat : null;

  const [items, cnt] = await Promise.all([
    prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        ...(sel ? { category: { key: sel } } : {}),
      },
      select: SELECT,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    counts(),
  ]);

  const total = Object.values(cnt).reduce((a, b) => a + b, 0);
  const mostRead = sel
    ? []
    : (items as Row[])
        .slice()
        .sort((a, b) => b.views - a.views)
        .slice(0, 6);

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">The knowledge base</p>
        <h1>Explore</h1>
        <p className="sub">
          Every piece stands under one of five standards — Body, Look, Mind,
          Life and raw Knowledge. Pick a tab; everything we publish lands here.
        </p>
      </header>

      <div className="search-filters" role="group" aria-label="Filter by category">
        <Link className={`chip ${!sel ? "active" : ""}`} href="/explore" prefetch={false}>
          All · {total}
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            className={`chip ${sel === c.key ? "active" : ""}`}
            href={`/explore?cat=${c.key}`}
            prefetch={false}
          >
            {c.label} · {cnt[c.key] ?? 0}
          </Link>
        ))}
      </div>

      <p className="search-stats">
        {items.length} piece{items.length === 1 ? "" : "s"}
        {sel ? ` under ${sel}` : " in the whole library"}
      </p>

      {items.length === 0 ? (
        <div className="empty-state">
          <p className="big">Nothing here yet.</p>
          <p>New content lands in this tab the moment it is published.</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map((item: Row) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {mostRead.length > 0 && (
        <section className="section-block" style={{ marginTop: 60 }}>
          <div className="section-head">
            <h2>Most read</h2>
          </div>
          <div className="grid-3">
            {mostRead.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}