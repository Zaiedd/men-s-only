import Link from "next/link";
import { BRAND_GOLD } from "@/lib/site";

export default function NotFound() {
  return (
    <main className="landing">
      <div className="landing-inner container" style={{ minHeight: "100dvh", justifyContent: "center" }}>
        <div className="hero-copy" style={{ textAlign: "center", alignItems: "center" }}>
          <p className="hero-kicker">
            <span className="rule" aria-hidden />
            ERROR 404
          </p>
          <h1 className="hero-title">
            <span className="line-mens">NOT&nbsp;FOUND</span>
          </h1>
          <p className="hero-tagline">
            The standard you are looking for{" "}
            <strong className="gold-text">does not stand here.</strong>
          </p>
          <div className="hero-cta-row" style={{ justifyContent: "center" }}>
            <Link href="/home" className="btn btn--gold">
              BACK TO THE STANDARD
            </Link>
          </div>
          <p className="hero-sub-meta" style={{ color: `var(--faint, ${BRAND_GOLD})`, marginTop: 24 }}>
            THIS SECTION WAS NEVER BUILT — OR WAS REMOVED WITH INTENT.
          </p>
        </div>
      </div>
    </main>
  );
}