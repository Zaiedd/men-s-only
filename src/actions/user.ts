"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, requireSession } from "@/lib/auth";
import { parsePayload, type ChallengePayload } from "@/lib/payload";

export type ActionResult = { ok?: string; error?: string; [key: string]: unknown };

// ---------------- streak + daily heartbeat ----------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function pingDailyAction(): Promise<ActionResult> {
  try {
    const session = await getSession();
    if (!session) return {};
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return {};

    const today = startOfDay(new Date());
    const last = user.lastActiveDay ? startOfDay(user.lastActiveDay) : null;
    if (last && last.getTime() === today.getTime()) return {};

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const continued = last?.getTime() === yesterday.getTime();
    const nextStreak = continued ? user.streak + 1 : 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        streak: nextStreak,
        bestStreak: Math.max(user.bestStreak, nextStreak),
        totalDaysActive: { increment: 1 },
        lastActiveDay: new Date(),
      },
    });

    return { streak: nextStreak };
  } catch {
    return {};
  }
}

export async function recordViewAction(contentId: string): Promise<ActionResult> {
  try {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { category: true },
    });
    if (!content) return {};

    await prisma.content.update({
      where: { id: contentId },
      data: { views: { increment: 1 } },
    });

    const session = await getSession();
    if (!session) return {};

    // light personalization: category affinity
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (user) {
      const affinity: Record<string, number> = safeAffinity(user.categoryAffinity);
      const key = content.category.key.toLowerCase();
      affinity[key] = (affinity[key] ?? 0) + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { categoryAffinity: JSON.stringify(affinity) },
      });
    }

    await prisma.activity.create({
      data: {
        userId: session.userId,
        type: "VIEW",
        contentId,
        categoryKey: content.category.key,
      },
    });
    return {};
  } catch {
    return {};
  }
}

function safeAffinity(raw: string): Record<string, number> {
  try {
    const o = JSON.parse(raw);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

// ---------------- save ----------------

export async function saveToggleAction(contentId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const existing = await prisma.savedItem.findUnique({
      where: { userId_contentId: { userId: session.userId, contentId } },
    });

    if (existing) {
      await prisma.savedItem.delete({ where: { id: existing.id } });
      await prisma.activity.create({
        data: {
          userId: session.userId,
          type: "UNSAVE",
          contentId,
          categoryKey: undefined,
        },
      }).catch(() => {});
      revalidatePath("/saved");
      return { saved: false };
    }

    await prisma.savedItem.create({
      data: { userId: session.userId, contentId },
    });
    await prisma.activity.create({
      data: { userId: session.userId, type: "SAVE", contentId },
    }).catch(() => {});
    revalidatePath("/saved");
    return { saved: true };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------- challenges ----------------

export async function startChallengeAction(contentId: string): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { category: true },
    });
    if (!content || content.contentType !== "CHALLENGE")
      return { error: "Challenge not found." };

    const existing = await prisma.challengeProgress.findUnique({
      where: { userId_contentId: { userId: session.userId, contentId } },
    });
    if (existing) return { error: "Already started." };

    await prisma.challengeProgress.create({
      data: { userId: session.userId, contentId, currentDay: 1, status: "ACTIVE" },
    });
    await prisma.activity.create({
      data: {
        userId: session.userId,
        type: "START_CHALLENGE",
        contentId,
        categoryKey: content.category.key,
      },
    }).catch(() => {});

    revalidatePath("/challenges");
    revalidatePath(`/challenges/${content.slug}`);
    return { ok: "Challenge started. Day 1 begins now." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function completeChallengeDayAction(
  contentId: string,
  day: number,
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { category: true },
    });
    if (!content) return { error: "Challenge not found." };

    const payload = parsePayload("CHALLENGE", content.payload) as ChallengePayload;
    const duration = Math.max(1, payload.duration ?? payload.dailyTasks.length);

    const progress = await prisma.challengeProgress.findUnique({
      where: { userId_contentId: { userId: session.userId, contentId } },
    });
    if (!progress) return { error: "Start the challenge first." };
    if (progress.status !== "ACTIVE") return { error: "Challenge already finished." };
    if (day !== progress.currentDay) return { error: "Complete today's day first." };

    const done = await prisma.challengeDayProgress.findUnique({
      where: { progressId_day: { progressId: progress.id, day } },
    });
    if (done) return { ok: "Already complete." };

    await prisma.challengeDayProgress.create({
      data: { progressId: progress.id, day },
    });

    if (day >= duration) {
      await prisma.$transaction([
        prisma.challengeProgress.update({
          where: { id: progress.id },
          data: { status: "COMPLETED", currentDay: day, completedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: session.userId },
          data: { challengesCompleted: { increment: 1 } },
        }),
      ]);
      await prisma.activity.create({
        data: {
          userId: session.userId,
          type: "COMPLETE_CHALLENGE",
          contentId,
          categoryKey: content.category.key,
        },
      }).catch(() => {});
    } else {
      await prisma.challengeProgress.update({
        where: { id: progress.id },
        data: { currentDay: { increment: 1 } },
      });
      await prisma.activity.create({
        data: {
          userId: session.userId,
          type: "COMPLETE_DAY",
          contentId,
          categoryKey: content.category.key,
        },
      }).catch(() => {});
    }

    revalidatePath("/challenges");
    revalidatePath("/profile");
    revalidatePath(`/challenges/${content.slug}`);
    return { ok: day >= duration ? "Challenge completed." : `Day ${day} complete.`, done: day >= duration };
  } catch (e) {
    return { error: (e as Error).message };
  }
}