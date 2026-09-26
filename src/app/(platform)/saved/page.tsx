import { prisma } from "@/lib/prisma";
import { requireSessionOrRedirect } from "@/lib/auth";
import { ContentCard } from "@/components/ContentCard";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await requireSessionOrRedirect("/saved");
  const saved = await prisma.savedItem.findMany({
    where: { userId: session.userId },
    select: {
      id: true,
      createdAt: true,
      content: {
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
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Your archive</p>
        <h1>Saved</h1>
        <p className="sub">
          Everything a man marks for later, in one place. {saved.length}{" "}
          {saved.length === 1 ? "piece" : "pieces"} held.
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="empty-state">
          <p className="big">Nothing saved yet.</p>
          <p>Mark any guide, routine or challenge as saved to keep it here.</p>
        </div>
      ) : (
        <div className="grid-3">
          {saved.map((s) => (
            <ContentCard key={s.id} item={s.content} />
          ))}
        </div>
      )}
    </div>
  );
}