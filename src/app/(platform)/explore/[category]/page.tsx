import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentCard } from "@/components/ContentCard";
import { categoryByKey } from "@/lib/site";

export const dynamic = "force-dynamic";

const CAT_BY_KEY: Record<string, string> = {
  body: "BODY",
  look: "LOOK",
  mind: "MIND",
  life: "LIFE",
  knowledge: "KNOWLEDGE",
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sub?: string }>;
}) {
  const { category } = await params;
  const { sub } = await searchParams;

  const key = CAT_BY_KEY[category.toLowerCase()];
  if (!key) notFound();

  const items = await prisma.content.findMany({
    where: { status: "PUBLISHED", category: { key } },
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
      subcategory: true,
      category: { select: { key: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  const subs = Array.from(
    new Set(items.map((i) => i.subcategory).filter((s): s is string => !!s)),
  );
  const filtered = sub && subs.includes(sub)
    ? items.filter((i) => i.subcategory === sub)
    : items;

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Standard · {key}</p>
        <h1>{categoryByKey(key)?.label ?? key}</h1>
        <p className="sub">
          {filtered.length} piece{filtered.length === 1 ? "" : "s"}
          {sub ? ` under ${sub}` : " under this standard"}.
        </p>
      </header>

      {subs.length > 0 && (
        <div className="search-filters" role="group" aria-label="Filter by subcategory">
          <a className={`chip ${!sub ? "active" : ""}`} href={`/explore/${category.toLowerCase()}`}>
            All
          </a>
          {subs.map((s) => (
            <a
              key={s}
              className={`chip ${sub === s ? "active" : ""}`}
              href={`/explore/${category.toLowerCase()}?sub=${encodeURIComponent(s)}`}
            >
              {s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </a>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="big">Nothing under this filter yet.</p>
          <p>Choose another subcategory or browse the full standard.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}