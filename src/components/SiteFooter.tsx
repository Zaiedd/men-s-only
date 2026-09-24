import Link from "next/link";
import { TAGLINE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer container">
      <div className="footer-grid">
        <div>
          <span className="brand brand-mark">
            <span className="mens">MEN&apos;S</span> <span className="only">ONLY</span>
          </span>
          <p style={{ color: "var(--faint)", fontSize: "0.92rem", marginTop: 14, maxWidth: 340, lineHeight: 1.7 }}>
            {TAGLINE}
          </p>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <div className="footer-links">
            <Link href="/explore">Explore</Link>
            <Link href="/challenges">Challenges</Link>
            <Link href="/search">Search</Link>
          </div>
        </div>
        <div>
          <h4>MEN&apos;S ONLY</h4>
          <div className="footer-links">
            <Link href="/home">Home</Link>
            <Link href="/saved">Saved</Link>
            <Link href="/profile">Profile</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} MEN&apos;S ONLY</span>
        <span>Discover. Learn. Challenge yourself. Improve. Come back tomorrow.</span>
      </div>
    </footer>
  );
}