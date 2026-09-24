import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ContentCard } from "@/components/ContentCard";
import { parsePayload, type ChallengePayload } from "@/lib/payload";

export const dynamic = "force-dynamic";

export default async function ChallengesPage() {
  const session = await getSession();

  const challenges = await prisma.content.findMany({
    where: { status: "PUBLISHED", contentType: "CHALLENGE" },
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
      payload: true,
      category: { select: { key: true } },
    },
    orderBy: [{ views: "desc" }, { createdAt: "desc" }],
  });

  const inProgress = session
    ? await prisma.challengeProgress.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        include: { content: { select: { slug: true, title: true, payload: true } }, days: true },
      })
    : [];

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">The proving ground</p>
        <h1>Challenges</h1>
        <p className="sub">
          Commit to a duration. Do the daily task. Miss a day and the streak
          breaks — that is the entire system.
        </p>
      </header>

      {inProgress.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>In progress</h2>
          </div>
          <div className="grid-3">
            {inProgress.map((cp) => {
              const p = parsePayload("CHALLENGE", cp.content.payload) as ChallengePayload;
              const done = cp.days.length;
              const total = p.duration;
              return (
                <Link key={cp.id} href={`/content/${cp.content.slug}`} className="card card--tall">
                  <div className="card-body">
                    <span className="card-type">Active challenge</span>
                    <h3>{cp.content.title}</h3>
                    <div className="challenge-progress" style={{ marginBottom: 0 }}>
                      <div className="progress-track" aria-hidden>
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.round((done / total) * 100)}%` }}
                        />
                      </div>
                      <span className="counter">Day {cp.currentDay} / {total}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-head">
          <h2>All challenges</h2>
        </div>
        {challenges.length === 0 ? (
          <div className="empty-state">
            <p className="big">No challenges forged yet.</p>
            <p>They are coming. The standard is being measured.</p>
          </div>
        ) : (
          <div className="grid-3">
            {challenges.map((c) => (
              <ContentCard key={c.id} item={c} tall />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}