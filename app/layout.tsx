import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grand Harbour Hotel — Reservations Portal",
  description: "Hackathon reservations data source. Scrape the live book of business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-semibold tracking-tight text-teal-300">
                Grand Harbour Hotel
              </span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                Reservations Portal
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/reservations" className="text-slate-300 hover:text-teal-300">
                Reservations
              </Link>
              <Link href="/reference" className="text-slate-300 hover:text-teal-300">
                Reference
              </Link>
              <Link href="/verify" className="text-slate-300 hover:text-teal-300">
                Verify
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-6 py-10 text-xs text-slate-500">
          Synthetic dataset for the Revenue Manager Agent hackathon. Data is
          regenerated daily and is always forward-looking from today.
        </footer>
      </body>
    </html>
  );
}
