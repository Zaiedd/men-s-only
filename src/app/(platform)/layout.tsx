import type { ReactNode } from "react";
import { SiteHeader, type HeaderUser } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DailyHeartbeat } from "@/components/DailyHeartbeat";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  let user: HeaderUser = null;

  if (session) {
    const row = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, role: true, streak: true },
    });
    if (row) {
      user = {
        name: row.name,
        isAdmin: row.role === "ADMIN",
        streak: row.streak,
      };
    }
  }

  return (
    <>
      <SiteHeader user={user} />
      <DailyHeartbeat hasSession={!!session} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}