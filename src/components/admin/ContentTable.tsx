"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  setContentStatusAction,
  toggleFeaturedAction,
  deleteContentAction,
} from "@/actions/admin";

export type AdminRow = {
  id: string;
  slug: string;
  title: string;
  contentType: string;
  status: string;
  featured: boolean;
  views: number;
  updatedAt: string;
  difficulty: string;
};

const TYPE: Record<string, string> = {
  GUIDE: "Guide",
  TIP: "Tip",
  ROUTINE: "Routine",
  CHALLENGE: "Challenge",
  CHECKLIST: "Checklist",
  QUIZ: "Quiz",
  KNOWLEDGE: "Know-how",
};

export function ContentTable({ rows }: { rows: AdminRow[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const run = (id: string, fn: (id: string) => Promise<unknown>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(id);
    start(async () => {
      try {
        await fn(id);
      } finally {
        setBusy(null);
        router.refresh();
      }
    });
  };

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="big">No content yet.</p>
        <Link className="btn btn--gold" href="/admin/content/new" style={{ marginTop: 14 }}>
          Forge the first piece
        </Link>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Featured</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link href={`/admin/content/${r.id}/edit`} style={{ color: "var(--gold)" }}>
                  {r.title}
                </Link>
                <p style={{ color: "var(--faint)", fontSize: "0.8rem", marginTop: 2 }}>
                  /{r.slug} · {r.difficulty}
                </p>
              </td>
              <td>{TYPE[r.contentType] ?? r.contentType}</td>
              <td>
                <span className={`badge ${r.status === "PUBLISHED" ? "badge--live" : "badge--draft"}`}>
                  {r.status}
                </span>
              </td>
              <td>{r.featured ? "Yes" : "No"}</td>
              <td>{r.views}</td>
              <td>
                <div className="row-actions">
                  <Link className="row-action" href={`/admin/content/${r.id}/edit`}>
                    Edit
                  </Link>
                  {r.status === "PUBLISHED" ? (
                    <button
                      className="row-action"
                      onClick={() => run(r.id, (i) => setContentStatusAction(i, "DRAFT"), "Move to drafts?")}
                      disabled={busy === r.id}
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      className="row-action row-action--gold"
                      onClick={() => run(r.id, (i) => setContentStatusAction(i, "PUBLISHED"))}
                      disabled={busy === r.id}
                    >
                      Publish
                    </button>
                  )}
                  <button
                    className="row-action"
                    onClick={() => run(r.id, (i) => toggleFeaturedAction(i))}
                    disabled={busy === r.id}
                  >
                    {r.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    className="row-action row-action--danger"
                    onClick={() =>
                      run(r.id, (i) => deleteContentAction(i), "Delete this piece permanently?")
                    }
                    disabled={busy === r.id}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}