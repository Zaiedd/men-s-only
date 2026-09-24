import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [published, drafts, users, saved, views, recent, activities] = await Promise.all([
    prisma.content.count({ where: { status: "PUBLISHED" } }),
    prisma.content.count({ where: { status: "DRAFT" } }),
    prisma.user.count(),
    prisma.savedItem.count(),
    prisma.content.aggregate({ _sum: { views: true } }),
    prisma.content.findMany({
      select: { id: true, slug: true, title: true, status: true, featured: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.activity.groupBy({
      by: ["type"],
      _count: true,
      orderBy: { _count: { type: "desc" } },
    }),
  ]);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card stat-card--gold">
          <b>{published}</b>
          <span>Published</span>
        </div>
        <div className="stat-card">
          <b>{drafts}</b>
          <span>Drafts</span>
        </div>
        <div className="stat-card">
          <b>{users}</b>
          <span>Members</span>
        </div>
        <div className="stat-card">
          <b>{saved}</b>
          <span>Pieces saved</span>
        </div>
        <div className="stat-card">
          <b>{views._sum.views ?? 0}</b>
          <span>Total views</span>
        </div>
      </div>

      {activities.length > 0 && (
        <section className="section-block">
          <div className="section-head">
            <h2>Activity mix</h2>
          </div>
          <div className="list-stack">
            {activities.map((a) => (
              <div key={a.type} className="day-row">
                <span className="day-num">{a._count}</span>
                <div>
                  <h4>{a.type}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section-block">
        <div className="section-head">
          <h2>Recently touched</h2>
          <Link className="more" href="/admin/content">Manage all <span aria-hidden>→</span></Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/content/${r.id}/edit`} style={{ color: "var(--gold)" }}>
                      {r.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`badge ${r.status === "PUBLISHED" ? "badge--live" : "badge--draft"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{r.featured ? "Yes" : "—"}</td>
                  <td>{r.updatedAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}