"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { markEntered } from "@/actions/landing";
import { HeroVisual } from "@/components/HeroVisual";

export default function LandingHero({ showSplash = false }: { showSplash?: boolean }) {
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(Boolean(showSplash));
  const [phase, setPhase] = useState<"idle" | "hiding" | "gone">(showSplash ? "idle" : "gone");

  useEffect(() => {
    if (phase !== "hiding") return;
    const timer = window.setTimeout(() => setSplashVisible(false), 800);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const dismissSplash = () => {
    if (phase !== "idle") return;
    void markEntered();
    setPhase("hiding");
  };

  const enterTheStandard = () => {
    void markEntered();
    router.push("/home");
  };

  return (
    <div className="landing">
      <div className="landing-inner container">
        <div className="hero-copy">
          <p className="hero-kicker">
            <span className="rule" aria-hidden />
            THE STANDARD FOR MODERN MANHOOD
          </p>
          <h1 className="hero-title">
            <span className="line-mens">MEN&apos;S</span>
            <span className="line-only">ONLY</span>
          </h1>
          <p className="hero-tagline">
            We don&apos;t want to build a good man.
            <br />
            <strong className="gold-text">We want to build the PERFECT MAN.</strong>
          </p>
          <div className="hero-cta-row">
            <button className="btn btn--gold" onClick={enterTheStandard}>
              ENTER THE STANDARD
            </button>
          </div>
          <div className="hero-sub-meta">
            <span>
              <span className="dot" aria-hidden /> DISCIPLINE
            </span>
            <span>
              <span className="dot" aria-hidden /> ROUTINE
            </span>
            <span>
              <span className="dot" aria-hidden /> IMPROVEMENT
            </span>
          </div>
        </div>

        <HeroVisual />
      </div>

      {splashVisible && (
        <div className={`enter-overlay ${phase === "hiding" ? "is-hiding" : ""}`}>
          <p className="hero-kicker" style={{ justifyContent: "center" }}>
            <span className="rule" aria-hidden /> MEN&apos;S ONLY
          </p>
          <h1 className="eo-title">A MAN TAKES</h1>
          <div className="eo-line">DISCIPLINE · ROUTINE · COMMITMENT · IMPROVEMENT</div>
          <button className="btn btn--gold" onClick={dismissSplash}>
            ENTER
          </button>
          <p className="eo-hint">You arrive alone. You leave better.</p>
        </div>
      )}
    </div>
  );
}