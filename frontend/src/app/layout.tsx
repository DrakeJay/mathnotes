import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: {
    default: "MathNotes — The Math Behind Machine Learning",
    template: "%s · MathNotes",
  },
  description:
    "Interactive lessons on the mathematics powering neural networks, with live demos computed by real NumPy code.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-hairline">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span className="text-accent">∇</span> MathNotes
            </Link>
            <nav className="flex items-center gap-6 text-sm text-ink-2">
              <Link href="/" className="hover:text-foreground">
                Lessons
              </Link>
              <Link href="/admin" className="hover:text-foreground">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="w-full flex-1">{children}</main>
        <footer className="border-t border-hairline">
          <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-ink-3">
            Built with Next.js, FastAPI, and PostgreSQL — every demo runs on
            real NumPy math, live on the server.
          </div>
        </footer>
      </body>
    </html>
  );
}
