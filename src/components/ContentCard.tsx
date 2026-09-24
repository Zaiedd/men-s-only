import Link from "next/link";
import { Artwork } from "@/components/artwork";
import { categoryByKey } from "@/lib/site";

export type CardContent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentType: string;
  difficulty: string;
  readingTime: number | null;
  image: string | null;
  altText: string | null;
  category: { key: string } | null;
};

const TYPE_TAG: Record<string, string> = {
  GUIDE: "Guide",
  TIP: "Tip",
  ROUTINE: "Routine",
  CHALLENGE: "Challenge",
  CHECKLIST: "Checklist",
  QUIZ: "Quiz",
  KNOWLEDGE: "Know-how",
};

const DIFF_TAG: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export function ContentCard({
  item,
  variant = "grid",
  tall = false,
}: {
  item: CardContent;
  variant?: "grid" | "mini";
  tall?: boolean;
}) {
  const cat = item.category?.key ? categoryByKey(item.category.key) : null;
  const href = `/content/${item.slug}`;

  if (variant === "mini") {
    return (
      <Link href={href} className="mini-card">
        <Artwork categoryKey={item.category?.key ?? "KNOWLEDGE"} className="art--sm" />
        <div style={{ minWidth: 0 }}>
          <span className="mc-type">{TYPE_TAG[item.contentType] ?? "Read"}</span>
          <h3>{item.title}</h3>
          <p className="mc-desc">
            {cat?.label ?? "Knowledge"} · {item.readingTime ? `${item.readingTime} min` : "Quick read"}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <article className={`card ${tall ? "card--tall" : ""}`}>
      <Link href={href} className="card-art" aria-label={item.title}>
        <Artwork categoryKey={item.category?.key ?? "KNOWLEDGE"} tag={TYPE_TAG[item.contentType]} />
      </Link>
      <div className="card-body">
        <span className="card-type">{TYPE_TAG[item.contentType] ?? "Read"}</span>
        <h3>
          <Link href={href} className="card-title-link">
            {item.title}
          </Link>
        </h3>
        <p className="card-desc">{item.description}</p>
        <div className="card-meta">
          <span className="pill">{cat?.label ?? "Knowledge"}</span>
          <span className="pill pill--red">{DIFF_TAG[item.difficulty] ?? "Beginner"}</span>
          <span>{item.readingTime ? `${item.readingTime} min` : "Quick read"}</span>
        </div>
      </div>
    </article>
  );
}