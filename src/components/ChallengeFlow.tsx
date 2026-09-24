"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  startChallengeAction,
  completeChallengeDayAction,
} from "@/actions/user";
import type { ChallengeTask } from "@/lib/payload";

export type ChallengeProgressShape = {
  started: boolean;
  completed: boolean;
  currentDay: number;
  daysDone: number[];
};

export function ChallengeFlow({
  contentId,
  duration,
  tagline,
  tasks,
  progress,
}: {
  contentId: string;
  duration: number;
  tagline?: string;
  tasks: ChallengeTask[];
  progress: ChallengeProgressShape;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const startChallenge = () =>
    start(async () => {
      const r = await startChallengeAction(contentId);
      if (r.error) setError(r.error);
      else {
        setError(null);
        router.refresh();
      }
    });

  const completeDay = (day: number) =>
    start(async () => {
      const r = await completeChallengeDayAction(contentId, day);
      if (r.error) setError(r.error);
      else {
        setError(null);
        router.refresh();
      }
    });

  const { started, completed, currentDay, daysDone } = progress;
  const doneSet = new Set(daysDone);

  if (!started) {
    return (
      <div className="form-card form-card--wide" style={{ textAlign: "center" }}>
        <p className="eyebrow">Challenge · {duration} days</p>
        {tagline && <p style={{ color: "var(--muted)", margin: "8px 0 20px" }}>{tagline}</p>}
        <p style={{ color: "var(--muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
          Commit to one task per day. No excuses, no rerolls. Come back daily —
          consistency beats intensity.
        </p>
        {error && <p className="alert alert-error" style={{ marginTop: 16 }}>{error}</p>}
        <button className="btn btn--gold" onClick={startChallenge} disabled={pending} style={{ marginTop: 24 }}>
          Start the challenge
        </button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="form-card form-card--wide" style={{ textAlign: "center" }}>
        <p className="eyebrow">Challenge complete</p>
        <h2 style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}>{duration} days. Done.</h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          You showed up {duration} days in a row. That is the entire secret.
        </p>
        <a href="/challenges" className="btn btn--red" style={{ marginTop: 20 }}>
          Pick your next challenge
        </a>
      </div>
    );
  }

  const activeTask = tasks.find((t) => t.day === currentDay) ?? tasks[0];

  return (
    <div>
      <div className="challenge-progress">
        <div className="progress-track" aria-hidden>
          <div
            className="progress-fill"
            style={{ width: `${Math.round((doneSet.size / duration) * 100)}%` }}
          />
        </div>
        <span className="counter">Day {currentDay} of {duration}</span>
      </div>

      <div className="challenge-day is-active">
        <span className="day-label">TODAY · DAY {activeTask?.day}</span>
        <h3 className="day-title">{activeTask?.title}</h3>
        {activeTask?.detail && <p className="day-detail">{activeTask.detail}</p>}
        {error && <p className="alert alert-error" style={{ marginTop: 12 }}>{error}</p>}
        <button
          className="btn btn--red"
          onClick={() => completeDay(activeTask?.day ?? currentDay)}
          disabled={pending}
        >
          Mark day {currentDay} complete
        </button>
      </div>

      <div className="list-stack" style={{ marginTop: 18 }}>
        {tasks.map((t) => {
          const isDone = doneSet.has(t.day);
          const isActive = t.day === currentDay;
          return (
            <div
              key={t.day}
              className={`day-row ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`}
            >
              <span className="day-num">{String(t.day).padStart(2, "0")}</span>
              <div>
                <h4>{t.title}</h4>
                {t.detail && <p>{t.detail}</p>}
              </div>
              <span className="day-status">
                {isDone ? "Done" : isActive ? "Active" : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}