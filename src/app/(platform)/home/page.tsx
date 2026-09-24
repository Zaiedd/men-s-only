import { prisma } from "@/lib/prisma";
import { ContentCard, type CardContent } from "@/components/ContentCard";
import { CATEGORIES } from "@/lib/site";

export const dynamic = "force-dynamic";

function toCard(item: {
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
}): CardContent {
  return item;
}

export default async function HomePage() {
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
      featured: true,
      createdAt: true,
      category: { select: { key: true } },
    },
    orderBy: [{ featured: "desc" }, { views: "desc" }, { createdAt: "desc" }],
  });

  const featured = items.filter((i) => i.featured).slice(0, 2);
  const latest = items
    .filter((i) => !i.featured)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Today&apos;s standard</p>
        <h1>Explore</h1>
        <p className="sub">
          A continuously evolving knowledge base for men who do the work. New
          guides, routines, challenges and raw knowledge — checked daily.
        </p>
      </header>

      {featured.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Featured standard</h2>
          </div>
          <div className="grid-2">
            {featured.map((f) => (
              <ContentCard key={f.id} item={toCard(f)} tall />
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Latest on the floor</h2>
          </div>
          <div className="grid-3">
            {latest.map((item) => (
              <ContentCard key={item.id} item={toCard(item)} />
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((c) => {
        const row = items.filter((i) => i.category?.key === c.key).slice(0, 4);
        if (row.length === 0) return null;
        return (
          <section className="section-block" key={c.key}>
            <div className="section-head">
              <h2>{c.label}</h2>
              <a className="more" href={`/explore/${c.key.toLowerCase()}`}>
                View all <span aria-hidden>→</span>
              </a>
            </div>
            <div className="list-stack">
              {row.map((item) => (
                <ContentCard key={item.id} item={toCard(item)} />
              ))}
            </div>
          </section>
        );
      })}

      {items.length === 0 && (
        <div className="empty-state">
          <p className="big">The floor is empty.</p>
          <p>Content is being forged right now. Check back shortly.</p>
        </div>
      )}
    </div>
  );
}