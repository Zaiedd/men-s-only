import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContentTable } from "@/components/admin/ContentTable";

export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const rows = await prisma.content.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      contentType: true,
      status: true,
      featured: true,
      views: true,
      difficulty: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="section-head">
        <h2>Content library</h2>
        <Link className="more" href="/admin/content/new">New piece <span aria-hidden>+</span></Link>
      </div>
      <ContentTable
        rows={rows.map((r) => ({
          ...r,
          contentType: r.contentType,
          status: r.status,
          difficulty: r.difficulty,
          updatedAt: r.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}