import type { Metadata } from "next";
import { Comic_Neue, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HypnoFooter, HypnoMarquee } from "@/components/HypnoChrome";
import ThemeToggle from "@/components/ThemeToggle";
import { THEME_SCRIPT } from "@/lib/theme";
import "katex/dist/katex.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* The 1999 theme's typeface. Loaded always so toggling is instant. */
const comic = Comic_Neue({
  variable: "--font-comic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MathNotes — Interactive Mathematics",
    template: "%s · MathNotes",
  },
  description:
    "Interactive math lessons with live demos — classical geometry, calculus, and the mathematics behind machine learning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${comic.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <HypnoMarquee />
        <header className="border-b border-hairline">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span className="text-accent">∇</span> MathNotes
            </Link>
            <nav className="flex items-center gap-6 text-sm text-ink-2">
              <Link href="/" className="hover:text-foreground">
                Lessons
              </Link>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main className="w-full flex-1">{children}</main>
        <footer className="border-t border-hairline">
          <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-ink-3">
            Built with Next.js, FastAPI, and PostgreSQL — the training demos
            run on real NumPy math, live on the server.
          </div>
          <HypnoFooter />
        </footer>
      </body>
    </html>
  );
}
