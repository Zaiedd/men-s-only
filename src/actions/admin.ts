"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { payloadToText, parsePayload, estimateReadingMinutes } from "@/lib/payload";
import { categoryByKey } from "@/lib/site";

const CONTENT_TYPES = ["GUIDE", "TIP", "ROUTINE", "CHALLENGE", "CHECKLIST", "QUIZ", "KNOWLEDGE"] as const;
const CATEGORIES = ["BODY", "LOOK", "MIND", "LIFE", "KNOWLEDGE"] as const;
const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const contentSchema = z.object({
  title: z.string().trim().min(2, "Title is required.").max(160),
  description: z.string().trim().min(5).max(600),
  contentType: z.enum(CONTENT_TYPES),
  category: z.enum(CATEGORIES),
  subcategory: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  difficulty: z.enum(DIFFICULTIES).default("BEGINNER"),
  readingTime: z.coerce.number().int().min(0).optional(),
  image: z.string().trim().optional(),
  altText: z.string().trim().optional(),
  authorName: z.string().trim().optional(),
  source: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
  featured: z.boolean().optional(),
  status: z.enum(STATUSES).default("DRAFT"),
  payloadJson: z.string().trim().min(2, "Content body is required."),
});

export type AdminActionResult = {
  ok?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

async function requireAdmin() {
  const session = await requireSession({ roles: ["ADMIN"] });
  return session;
}

function normalizeTags(tags: string): string {
  if (!tags.trim()) return "";
  return Array.from(
    new Set(
      tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ).join(",");
}

export async function contentUpsertAction(
  id: string | null,
  _prev: AdminActionResult | undefined,
  formData: FormData,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const parsed = contentSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description"),
      contentType: formData.get("contentType"),
      category: formData.get("category"),
      subcategory: formData.get("subcategory") || undefined,
      tags: formData.get("tags"),
      difficulty: formData.get("difficulty"),
      readingTime: formData.get("readingTime") || undefined,
      image: formData.get("image") || undefined,
      altText: formData.get("altText") || undefined,
      authorName: formData.get("authorName") || undefined,
      source: formData.get("source") || undefined,
      seoTitle: formData.get("seoTitle") || undefined,
      seoDescription: formData.get("seoDescription") || undefined,
      featured: formData.get("featured") === "on",
      status: formData.get("status"),
      payloadJson: formData.get("payloadJson"),
    });

    if (!parsed.success) {
      return { fieldErrors: parsed.error.flatten().fieldErrors };
    }

    const data = parsed.data;

    // validate payload is a real structured object for its type
    const parsedPayload = parsePayload(data.contentType, data.payloadJson);
    const payloadIsEmpty =
      ("sections" in parsedPayload && (parsedPayload as { sections: unknown[] }).sections.length === 0) ||
      ("steps" in parsedPayload && (parsedPayload as { steps: unknown[] }).steps.length === 0) ||
      ("dailyTasks" in parsedPayload && (parsedPayload as { dailyTasks: unknown[] }).dailyTasks.length === 0) ||
      ("items" in parsedPayload && (parsedPayload as { items: unknown[] }).items.length === 0) ||
      ("questions" in parsedPayload && (parsedPayload as { questions: unknown[] }).questions.length === 0) ||
      ("text" in parsedPayload && !(parsedPayload as { text: string }).text) ||
      ("body" in parsedPayload && !(parsedPayload as { body: string }).body);

    if (payloadIsEmpty)
      return { error: "The content body looks empty. Fill in the structured content for this type." };

    const category = categoryByKey(data.category);
    const payloadText = payloadToText(data.contentType, data.payloadJson);
    const tags = normalizeTags(data.tags ?? "");
    const searchText = [
      data.title,
      data.description,
      tags,
      data.subcategory ?? "",
      category?.label ?? data.category,
      data.category,
      payloadText,
    ]
      .join(" ")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    const readingTime =
      data.readingTime && data.readingTime > 0
        ? data.readingTime
        : estimateReadingMinutes(data.contentType, data.payloadJson);

    const now = new Date();
    const isPublishing = data.status === "PUBLISHED";
    let savedSlug: string | null = null;

    if (id) {
      const current = await prisma.content.findUnique({ where: { id } });
      if (!current) return { error: "Content not found." };

      const categoryRow = await prisma.category.findUnique({
        where: { key: data.category },
      });
      if (!categoryRow) return { error: "Category not found." };

      const slug = current.slug;
      savedSlug = slug;
      await prisma.content.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          contentType: data.contentType,
          status: data.status,
          difficulty: data.difficulty,
          featured: data.featured ?? false,
          categoryId: categoryRow.id,
          subcategory: data.subcategory || null,
          tags,
          searchText,
          image: data.image || null,
          altText: data.altText || null,
          authorName: data.authorName || null,
          source: data.source || null,
          readingTime,
          payload: data.payloadJson,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          featuredAt: data.featured && !current.featured ? now : current.featuredAt,
          publishedAt:
            isPublishing && !current.publishedAt ? now : current.publishedAt,
        },
      });
    } else {
      const categoryRow = await prisma.category.findUnique({
        where: { key: data.category },
      });
      if (!categoryRow) return { error: "Category not found." };

      const baseSlug = slugify(data.title);
      let slug = baseSlug;
      let n = 2;
      while (await prisma.content.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${n}`;
        n += 1;
      }
      savedSlug = slug;

      await prisma.content.create({
        data: {
          slug,
          title: data.title,
          description: data.description,
          contentType: data.contentType,
          status: data.status,
          difficulty: data.difficulty,
          featured: data.featured ?? false,
          categoryId: categoryRow.id,
          subcategory: data.subcategory || null,
          tags,
          searchText,
          image: data.image || null,
          altText: data.altText || null,
          authorName: data.authorName || null,
          source: data.source || null,
          readingTime,
          payload: data.payloadJson,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          featuredAt: data.featured ? now : null,
          publishedAt: isPublishing ? now : null,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/explore");
    revalidatePath("/challenges");
    revalidatePath("/admin/content");
    if (savedSlug) revalidatePath(`/content/${savedSlug}`);
    return { ok: id ? "Content updated." : "Content created." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "untitled"
  );
}

export async function setContentStatusAction(
  id: string,
  status: string,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    if (!STATUSES.includes(status as (typeof STATUSES)[number]))
      return { error: "Invalid status." };

    const current = await prisma.content.findUnique({ where: { id } });
    if (!current) return { error: "Content not found." };

    const now = new Date();
    await prisma.content.update({
      where: { id },
      data: {
        status: status as (typeof STATUSES)[number],
        publishedAt:
          status === "PUBLISHED" && !current.publishedAt ? now : current.publishedAt,
      },
    });

    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/admin/content");
    return { ok: status === "PUBLISHED" ? "Published." : status === "DRAFT" ? "Moved to drafts." : "Archived." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function toggleFeaturedAction(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    const current = await prisma.content.findUnique({ where: { id } });
    if (!current) return { error: "Content not found." };

    await prisma.content.update({
      where: { id },
      data: {
        featured: !current.featured,
        featuredAt: current.featured ? null : new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/admin/content");
    return { ok: current.featured ? "Removed from featured." : "Marked featured." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteContentAction(id: string): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    await prisma.content.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath("/admin/content");
    return { ok: "Content deleted." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}