"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/payload";

export function QuizPlayer({
  intro,
  questions,
}: {
  intro?: string;
  questions: QuizQuestion[];
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const done = index >= questions.length;
  const q = questions[index];

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="form-card form-card--wide" style={{ textAlign: "center" }}>
        <p className="eyebrow">Result</p>
        <h2 style={{ fontSize: "clamp(2rem,5vw,3.4rem)" }}>
          {score} / {questions.length}
        </h2>
        <p style={{ color: "var(--muted)", marginTop: 8 }}>
          {pct >= 80
            ? "Sharp. You know the standard."
            : pct >= 50
              ? "Solid foundation. One more pass and it sticks."
              : "The standard is built, not born. Retake and learn."}
        </p>
        <button className="btn btn--gold" onClick={restart} style={{ marginTop: 20 }}>
          Try again
        </button>
      </div>
    );
  }

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setScore((s) => s + 1);
  };

  return (
    <div className="form-card form-card--wide">
      <div className="form-row" style={{ alignItems: "center" }}>
        <span className="eyebrow">Question {index + 1} of {questions.length}</span>
        <span className="badge">Score {score}</span>
      </div>
      {intro && <p style={{ color: "var(--muted)", margin: "10px 0 18px" }}>{intro}</p>}
      <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.3rem)", lineHeight: 1.2 }}>{q.question}</h2>
      <div className="list-stack" style={{ marginTop: 22 }}>
        {q.options.map((opt, i) => {
          let cls = "btn btn--ghost btn--block";
          if (picked !== null) {
            if (i === q.answerIndex) cls = "btn btn--ghost btn--block correct";
            else if (i === picked && i !== q.answerIndex) cls = "btn btn--ghost btn--block wrong";
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => pick(i)} disabled={picked !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div style={{ marginTop: 20, color: "var(--muted)" }}>
          {picked === q.answerIndex ? (
            <p className="alert alert-ok">Correct.</p>
          ) : (
            <p>Not quite — {q.explain ?? "see the related guides to level up."}</p>
          )}
          {picked !== q.answerIndex && q.explain ? (
            <p style={{ fontSize: "0.92rem", marginTop: 6 }}>{q.explain}</p>
          ) : null}
          <button
            className="btn btn--red"
            style={{ marginTop: 16 }}
            onClick={() => {
              setPicked(null);
              setIndex((i) => i + 1);
            }}
          >
            {index + 1 === questions.length ? "See result" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}