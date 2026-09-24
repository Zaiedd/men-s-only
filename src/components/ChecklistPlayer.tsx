"use client";

import { useState } from "react";
import type { ChecklistPayload } from "@/lib/payload";

export function ChecklistPlayer({ payload }: { payload: ChecklistPayload }) {
  const [done, setDone] = useState<Set<number>>(new Set());
  const total = payload.items.length;
  const count = done.size;
  const pct = total ? Math.round((count / total) * 100) : 0;

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="list-stack">
      {payload.intro && <p style={{ color: "var(--muted)" }}>{payload.intro}</p>}
      <div className="challenge-progress">
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="counter">{count} / {total} done</span>
      </div>
      {payload.items.map((item, i) => (
        <label key={i} className={`check-row ${done.has(i) ? "is-done" : ""}`}>
          <input
            type="checkbox"
            checked={done.has(i)}
            onChange={() => toggle(i)}
          />
          <div>
            <span className="check-label">{item.label}</span>
            {item.detail && <span className="check-detail">{item.detail}</span>}
          </div>
        </label>
      ))}
    </div>
  );
}