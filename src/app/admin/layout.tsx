import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  let session;
  try {
    session = await requireSession({ roles: ["ADMIN"] });
  } catch {
    redirect("/auth/login?return=/admin");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "ADMIN") redirect("/auth/login?return=/admin");

  return (
    <div className="page container">
      <header className="page-head">
        <p className="eyebrow eyebrow--red">Command floor</p>
        <h1>Admin</h1>
        <p className="sub">
          Content is the product. Forge it, measure it, publish it.
        </p>
      </header>

      <div className="admin-grid">
        <nav className="admin-nav" aria-label="Admin">
          <Link href="/admin" className="plain">Dashboard</Link>
          <Link href="/admin/content">All content</Link>
          <Link href="/admin/content/new">New piece</Link>
          <Link href="/home">View site <span aria-hidden>→</span></Link>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}