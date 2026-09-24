"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";

export type HeaderUser =
  | { name: string; isAdmin: boolean; streak: number }
  | null;

const LINKS = [
  { href: "/home", label: "Explore" },
  { href: "/challenges", label: "Challenges" },
  { href: "/search", label: "Search" },
];

export function SiteHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand brand-mark">
            <span className="mens">MEN&apos;S</span>&nbsp;<span className="only">ONLY</span>
          </Link>

          <nav className="nav-links" aria-label="Main">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${pathname === l.href || (l.href === "/home" && pathname.startsWith("/explore")) ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                {user.streak > 0 && (
                  <span className="header-streak">
                    <b>{user.streak} day streak</b>
                  </span>
                )}
                <Link href={user.isAdmin ? "/admin" : "/profile"} className="btn btn--ghost btn--sm">
                  {user.name.split(" ")[0]}
                </Link>
              </>
            ) : (
              <Link href="/auth/login" className="btn btn--red btn--sm">
                Sign in
              </Link>
            )}
            <button
              className="mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="close-btn" onClick={() => setOpen(false)} aria-label="Close menu">
            ✕
          </button>
          <nav>
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="mm-link"
                onClick={() => setOpen(false)}
              >
                {l.label} <span aria-hidden>→</span>
              </Link>
            ))}
            <Link href="/saved" className="mm-link" onClick={() => setOpen(false)}>
              Saved <span aria-hidden>→</span>
            </Link>
            <Link href="/profile" className="mm-link" onClick={() => setOpen(false)}>
              Profile <span aria-hidden>→</span>
            </Link>
            {user?.isAdmin && (
              <Link href="/admin" className="mm-link" onClick={() => setOpen(false)}>
                Admin <span aria-hidden>→</span>
              </Link>
            )}
          </nav>
          <div style={{ marginTop: "auto", color: "var(--faint)", fontSize: "0.85rem" }}>
            {user ? (
              <form
                action={async () => {
                  await logoutAction();
                }}
              >
                <button className="btn btn--ghost btn--sm" type="submit">
                  Sign out
                </button>
              </form>
            ) : (
              <p>Discover. Learn. Challenge yourself. Come back tomorrow.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}