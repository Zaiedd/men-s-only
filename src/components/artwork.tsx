import type { CSSProperties } from "react";
import { categoryByKey } from "@/lib/site";

export function Artwork({
  categoryKey,
  label,
  className = "",
  tag,
}: {
  categoryKey: string;
  label?: string;
  className?: string;
  tag?: string;
}) {
  const cat = categoryByKey(categoryKey);
  const accent = cat?.accent ?? "#d8b36a";
  return (
    <div
      className={`art art--gradient ${className}`}
      role="img"
      aria-hidden={label ? false : true}
      style={{ "--c": accent } as CSSProperties}
      data-label={label ?? cat?.label ?? categoryKey}
    >
      {tag ? <span className="art-tag">{tag}</span> : null}
    </div>
  );
}