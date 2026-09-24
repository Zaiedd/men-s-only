import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) notFound();

  return (
    <div>
      <div className="section-head">
        <h2>Editing</h2>
        <p className="sub" style={{ marginTop: 0 }}>{content.title}</p>
      </div>
      <ContentEditor
        id={content.id}
        initial={{
          title: content.title,
          description: content.description,
          contentType: content.contentType,
          category: content.categoryId
            ? ((await prisma.category.findUnique({ where: { id: content.categoryId } }))?.key ?? "BODY")
            : "BODY",
          subcategory: content.subcategory ?? "",
          tags: content.tags,
          difficulty: content.difficulty,
          readingTime: content.readingTime ? String(content.readingTime) : "",
          image: content.image ?? "",
          altText: content.altText ?? "",
          authorName: content.authorName ?? "",
          source: content.source ?? "",
          seoTitle: content.seoTitle ?? "",
          seoDescription: content.seoDescription ?? "",
          featured: content.featured,
          status: content.status,
        }}
        initialPayload={content.payload}
      />
    </div>
  );
}