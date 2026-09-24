"use client";

import { useState, useTransition } from "react";
import { searchActionRaw, type SearchResult } from "@/actions/browse";
import { ContentCard } from "@/components/ContentCard";
import { CATEGORIES } from "@/lib/site";

export function SearchExplorer({ initial }: { initial: SearchResult }) {
  const [q, setQ] = useState(initial.query);
  const [res, setRes] = useState<SearchResult>(initial);
  const [cat, setCat] = useState<string>("ALL");
  const [pending, start] = useTransition();

  const run = (query: string) => {
    setQ(query);
    start(async () => {
      setRes(await searchActionRaw(query));
    });
  };

  const filtered =
    cat === "ALL"
      ? res.results
      : res.results.filter((r) => r.category?.key === cat);

  return (
    <div>
      <div className="search-bar">
        <input
          type="search"
          placeholder="Ask like a man: what should I wear? how do I sleep better?..."
          value={q}
          onChange={(e) => run(e.target.value)}
          aria-label="Search content"
        />
        <span className="search-icon" aria-hidden />
      </div>

      <div className="search-filters" role="group" aria-label="Filter by category">
        {["ALL", ...CATEGORIES.map((c) => c.key)].map((k) => (
          <button
            key={k}
            className={`chip ${cat === k ? "active" : ""}`}
            onClick={() => setCat(k)}
          >
            {k === "ALL" ? "All" : k.charAt(0) + k.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <p className="search-stats">
        {pending
          ? "Searching..."
          : `${filtered.length} result${filtered.length === 1 ? "" : "s"}${q.trim() ? ` for "${q.trim()}"` : ""}`}
      </p>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="big">No matches yet.</p>
          <p>Try a plainer question — like “smell”, “routine”, or “discipline”.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}