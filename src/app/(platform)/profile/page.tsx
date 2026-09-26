import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionOrRedirect } from "@/lib/auth";
import { CATEGORIES } from "@/lib/site";
import { parsePayload, type ChallengePayload } from "@/lib/payload";

export const dynamic = "force-dynamic";

const ACTIVITY_LABEL: Record<string, string> = {
  VIEW: "Read",
  SAVE: "Saved",
  UNSAVE: "Unsaved",
  START_CHALLENGE: "Started challenge",
  COMPLETE_DAY: "Completed a day",
  COMPLETE_CHALLENGE: "Finished challenge",
};

export default async function ProfilePage() {
  const session = await requireSessionOrRedirect("/profile");

  const [user, savedCount, inProgress, completed, activity, challenges] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          name: true,
          email: true,
          createdAt: true,
          streak: true,
          bestStreak: true,
          totalDaysActive: true,
          challengesCompleted: true,
          categoryAffinity: true,
        },
      }),
      prisma.savedItem.count({ where: { userId: session.userId } }),
      prisma.challengeProgress.findMany({
        where: { userId: session.userId, status: "ACTIVE" },
        include: { content: { select: { slug: true, title: true, payload: true } }, days: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.challengeProgress.findMany({
        where: { userId: session.userId, status: "COMPLETED" },
        include: { content: { select: { slug: true, title: true, payload: true } }, days: true },
        orderBy: { completedAt: "desc" },
        take: 4,
      }),
      prisma.activity.findMany({
        where: { userId: session.userId },
        include: { content: { select: { slug: true, title: true } } },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
      prisma.content.count({ where: { status: "PUBLISHED" } }),
    ]);

  if (!user) return null;

  const affinity = (() => {
    const map: Record<string, number> = {};
    try {
      const raw = JSON.parse(user.categoryAffinity);
      for (const { key } of CATEGORIES) map[key] = (raw as Record<string, number>)[key] ?? 0;
    } catch {
      /* nothing */
    }
    const total = CATEGORIES.reduce((sum, c) => sum + (map[c.key] ?? 0), 0);
    return CATEGORIES.filter((c) => (map[c.key] ?? 0) > 0)
      .sort((a, b) => (map[b.key] ?? 0) - (map[a.key] ?? 0))
      .slice(0, 4)
      .map((c) => ({
        key: c.key,
        label: c.label,
        pct: total ? Math.round(((map[c.key] ?? 0) / total) * 100) : 0,
      }));
  })();

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Your file</p>
        <h1>{user.name.split(" ")[0]}&apos;s profile</h1>
        <p className="sub">
          The man on file since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}.
          {user.streak > 0 && ` Currently on a ${user.streak}-day streak.`}
        </p>
      </header>

      <div className="stats-grid">
        <div className="stat-card stat-card--gold">
          <b>{user.streak}</b>
          <span>Day streak</span>
        </div>
        <div className="stat-card">
          <b>{user.bestStreak}</b>
          <span>Best streak</span>
        </div>
        <div className="stat-card">
          <b>{user.totalDaysActive}</b>
          <span>Days active</span>
        </div>
        <div className="stat-card">
          <b>{user.challengesCompleted}</b>
          <span>Challenges finished</span>
        </div>
        <div className="stat-card">
          <b>{savedCount}</b>
          <span>Pieces saved</span>
        </div>
      </div>

      {affinity.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Your standards</h2>
          </div>
          <div className="list-stack">
            {affinity.map((a) => (
              <div key={a.key} className="mini-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{a.label}</span>
                  <span className="counter">{a.pct}%</span>
                </div>
                <div className="progress-track" aria-hidden>
                  <div className="progress-fill" style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-head">
          <h2>Challenges in the middle</h2>
          <Link className="more" href="/challenges">All challenges <span aria-hidden>→</span></Link>
        </div>
        {inProgress.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            {user.challengesCompleted > 0
              ? `Done ${user.challengesCompleted}. Pick another while the habit holds.`
              : "No active challenge. The only way to build one is to start one."}
          </p>
        ) : (
          <div className="grid-3">
            {inProgress.map((cp) => {
              const p = parsePayload("CHALLENGE", cp.content.payload) as ChallengePayload;
              return (
                <Link key={cp.id} href={`/content/${cp.content.slug}`} className="card card--tall">
                  <div className="card-body">
                    <span className="card-type">Active</span>
                    <h3>{cp.content.title}</h3>
                    <div className="challenge-progress" style={{ marginBottom: 0 }}>
                      <div className="progress-track" aria-hidden>
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.round((cp.days.length / p.duration) * 100)}%` }}
                        />
                      </div>
                      <span className="counter">Day {cp.currentDay} / {p.duration}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {completed.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Finished</h2>
          </div>
          <div className="list-stack">
            {completed.map((cp) => (
              <Link key={cp.id} href={`/content/${cp.content.slug}`} className="mini-card">
                <div style={{ minWidth: 0 }}>
                  <h3>{cp.content.title}</h3>
                  <p className="mc-desc">
                    {cp.days.length} days logged
                    {cp.completedAt
                      ? ` · ${cp.completedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                      : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activity.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Recent activity</h2>
          </div>
          <div className="list-stack">
            {activity.map((a) => (
              <div key={a.id} className="day-row">
                <span className="day-num">{String(new Date(a.createdAt).getDate()).padStart(2, "0")}</span>
                <div>
                  <h4>{ACTIVITY_LABEL[a.type] ?? a.type}</h4>
                  {a.content ? (
                    <p>
                      <Link href={`/content/${a.content.slug}`} style={{ color: "var(--gold)" }}>
                        {a.content.title}
                      </Link>
                    </p>
                  ) : (
                    a.categoryKey && <p>{a.categoryKey}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p style={{ color: "var(--faint)", fontSize: "0.85rem", marginTop: 40 }}>
        The platform holds {challenges} published pieces across {CATEGORIES.length} standards.
        No hype. No shortcuts. Just the work, tracked.
      </p>
    </div>
  );
}