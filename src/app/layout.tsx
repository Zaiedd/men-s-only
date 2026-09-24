import type { ReactNode } from "react";
import type { Metadata } from "next";
import { display, body } from "@/lib/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "MEN'S ONLY — Build the Perfect Man",
    template: "%s · MEN'S ONLY",
  },
  description:
    "A continuously evolving knowledge and self-improvement platform for men. Discover, learn, challenge yourself, and improve — one day at a time.",
  openGraph: {
    title: "MEN'S ONLY",
    description:
      "We don't want to build a good man. We want to build the PERFECT MAN.",
    siteName: "MEN'S ONLY",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable}`}
    >
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}